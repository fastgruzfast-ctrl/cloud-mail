import unsubscribeService from './unsubscribe-service';
import auditService from './audit-service';
import approvalService from './approval-service';
import quotaService from './quota-service';
import delayedService from './delayed-service';
import emailUtils from '../utils/email-utils';

/**
 * 发信守卫：emailService.send 在角色检查之后、实际发信之前调用。
 * 顺序：①退订过滤（可改 params）→ ②审计（可抛错）→ ③审批（可短路）→ ④配额检查（可抛错）→ ⑤撤销延迟（可短路）
 */
const sendGuard = {

	/**
	 * @returns {delayed:true,id,undoSeconds} 撤销延迟短路 | {held:'approval',id} 审批短路 | {params} 更新后的发信参数
	 */
	async beforeSend(c, { params, userId, userRow, accountRow, opts = {}, allInternal = false }) {
		let p = { ...params };

		// ① 退订过滤（营销邮件）：过滤已退订收件人、追加退订页脚与 List-Unsubscribe 头
		const marketing = await unsubscribeService.prepareMarketing(c, p, accountRow);
		if (marketing) {
			p = {
				...p,
				receiveEmail: marketing.receiveEmail,
				content: marketing.content,
				text: marketing.text,
				extraHeaders: marketing.extraHeaders,
			};
		}

		// ② 外发审计：敏感词命中写日志，block 模式抛错
		await auditService.check(c, {
			subject: p.subject,
			text: p.text,
			attachments: p.attachments,
			userId,
			userEmail: userRow?.email || '',
			toEmail: (p.receiveEmail || []).join(','),
		});

		// ③ 邮件审批：名单内用户转审批暂存
		if (!opts.skipApproval && await approvalService.needsApproval(c, userId)) {
			const id = await approvalService.hold(c, p, userId, p.accountId);
			return { held: 'approval', id };
		}

		// ④ 发信配额：站内互发不计入域名预热配额
		if (!allInternal) {
			const domain = emailUtils.getDomain(accountRow?.email || '');
			await quotaService.checkQuota(c, domain, (p.receiveEmail || []).length);
		}

		// ⑤ 撤销延迟：暂存 pending，undo_seconds 秒后由定时任务真正发送
		if (!opts.skipDelay) {
			const delayedId = await delayedService.hold(c, p, userId, p.accountId);
			if (delayedId) {
				const s = await unsubscribeService.getSetting(c);
				return { delayed: true, id: delayedId, undoSeconds: s.undoSeconds };
			}
		}

		return { params: p };
	},

	/** 发信成功后：配额统计（站内互发不计） */
	async afterSend(c, { accountRow, receiveEmail, allInternal = false }) {
		if (allInternal) return;
		const domain = emailUtils.getDomain(accountRow?.email || '');
		await quotaService.incrStat(c, domain, (receiveEmail || []).length);
	},
};

export default sendGuard;
