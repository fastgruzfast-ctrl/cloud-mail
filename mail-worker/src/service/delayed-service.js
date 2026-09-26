import orm from '../entity/orm';
import delayedSend from '../entity/delayed-send';
import setting from '../entity/setting';
import BizError from '../error/biz-error';
import { and, eq, lte } from 'drizzle-orm';
import dayjs from 'dayjs';

const delayedService = {

	/**
	 * 发信钩子：把邮件暂存为 pending，undo_seconds 秒后再真正发送
	 * 返回暂存记录 id；undo_seconds 为 0（关闭）时返回 null 表示直接发送
	 */
	async hold(c, params, userId, accountId) {
		const settingRow = await orm(c).select().from(setting).get();
		const undoSeconds = Number(settingRow?.undoSeconds ?? 30);
		if (!undoSeconds || undoSeconds <= 0) return null;

		const row = await orm(c).insert(delayedSend).values({
			userId,
			accountId: Number(accountId),
			toEmail: (params.receiveEmail || []).join(','),
			subject: params.subject || '',
			content: params.content || '',
			text: params.text || '',
			attachments: JSON.stringify(params.attachments || []),
			sendAt: dayjs().add(undoSeconds, 'second').format('YYYY-MM-DD HH:mm:ss'),
			status: 'pending',
		}).returning().get();
		return row.id;
	},

	/** 撤销发送：只能撤销自己的 pending 记录 */
	async cancel(c, id, userId) {
		const row = await orm(c).select().from(delayedSend)
			.where(eq(delayedSend.id, Number(id))).get();
		if (!row || row.userId !== userId || row.status !== 'pending') {
			throw new BizError('该邮件无法撤销');
		}
		await orm(c).update(delayedSend).set({ status: 'cancelled' })
			.where(and(
				eq(delayedSend.id, Number(id)),
				eq(delayedSend.userId, userId),
				eq(delayedSend.status, 'pending')
			)).run();
	},

	/** 定时任务（每分钟）：发送到期的延迟邮件 */
	async processDue(c) {
		const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
		let dueList = [];
		try {
			dueList = await orm(c).select().from(delayedSend)
				.where(and(
					eq(delayedSend.status, 'pending'),
					lte(delayedSend.sendAt, now)
				)).all();
		} catch (e) {
			console.error('查询延迟发送邮件异常: ', e);
			return;
		}
		// 动态 import 避免与 email-service 循环依赖
		const emailService = (await import('./email-service.js')).default;
		for (const item of dueList) {
			try {
				let attachments = [];
				try {
					attachments = JSON.parse(item.attachments || '[]');
				} catch (e) { /* 忽略 */ }
				await emailService.send(c, {
					accountId: item.accountId,
					receiveEmail: String(item.toEmail || '').split(',').map(s => s.trim()).filter(Boolean),
					subject: item.subject,
					content: item.content,
					text: item.text,
					attachments,
				}, item.userId, { skipDelay: true, skipApproval: true });
				await orm(c).update(delayedSend).set({ status: 'sent' })
					.where(eq(delayedSend.id, item.id)).run();
			} catch (e) {
				console.error('延迟发送失败:', item.id, e.message);
				await orm(c).update(delayedSend).set({ status: 'failed' })
					.where(eq(delayedSend.id, item.id)).run();
			}
		}
	},
};

export default delayedService;
