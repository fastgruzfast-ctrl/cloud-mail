import orm from '../entity/orm';
import mailApproval from '../entity/mail-approval';
import setting from '../entity/setting';
import userService from './user-service';
import BizError from '../error/biz-error';
import { count, desc, eq } from 'drizzle-orm';

const approvalService = {

	async getSetting(c) {
		const row = await orm(c).select().from(setting).get();
		return {
			approvalEnabled: Number(row?.approvalEnabled || 0),
			approvalUids: row?.approvalUids || '',
		};
	},

	async saveSetting(c, params) {
		const { approvalEnabled, approvalUids } = params;
		await orm(c).update(setting).set({
			approvalEnabled: Number(approvalEnabled) ? 1 : 0,
			approvalUids: String(approvalUids || ''),
		}).run();
	},

	/** 发信钩子：当前用户发信是否需要先审批 */
	async needsApproval(c, userId) {
		const row = await orm(c).select().from(setting).get();
		if (!Number(row?.approvalEnabled || 0)) {
			return false;
		}
		const userRow = await userService.selectById(c, userId);
		if (!userRow) {
			return false;
		}
		// 管理员免审批
		if (c.env.admin === userRow.email) {
			return false;
		}
		const uids = String(row.approvalUids || '')
			.split(',')
			.map(s => Number(String(s).trim()))
			.filter(n => Number.isFinite(n) && n > 0);
		if (uids.length === 0) {
			return false;
		}
		return uids.includes(Number(userId));
	},

	/** 暂存待审批邮件，返回审批 id */
	async hold(c, params, userId, accountId) {
		const { receiveEmail = [], subject = '', content = '', text = '', attachments = [] } = params;
		const toList = Array.isArray(receiveEmail) ? receiveEmail : [receiveEmail];
		const row = await orm(c).insert(mailApproval).values({
			userId: Number(userId),
			accountId: Number(accountId),
			toEmail: toList.map(String).join(','),
			subject: String(subject || ''),
			content: String(content || ''),
			text: String(text || ''),
			attachments: JSON.stringify(attachments || []),
			status: 'pending',
		}).returning().get();
		return row.id;
	},

	async list(c, { status, page = 1, pageSize = 20 } = {}) {
		page = Math.max(1, Number(page) || 1);
		pageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
		const where = status ? eq(mailApproval.status, status) : undefined;

		const listQuery = orm(c).select().from(mailApproval);
		const list = await (where ? listQuery.where(where) : listQuery)
			.orderBy(desc(mailApproval.id))
			.limit(pageSize)
			.offset((page - 1) * pageSize)
			.all();

		const countQuery = orm(c).select({ total: count() }).from(mailApproval);
		const { total } = await (where ? countQuery.where(where) : countQuery).get();

		// 拼上申请人邮箱
		const emailMap = {};
		const uids = [...new Set(list.map(item => item.userId).filter(Boolean))];
		for (const uid of uids) {
			try {
				const userRow = await userService.selectById(c, uid);
				emailMap[uid] = userRow?.email || '';
			} catch (e) {
				emailMap[uid] = '';
			}
		}
		for (const item of list) {
			item.applicantEmail = emailMap[item.userId] || '';
		}

		return { total: Number(total) || 0, list };
	},

	async approve(c, id) {
		const row = await orm(c).select().from(mailApproval)
			.where(eq(mailApproval.id, Number(id))).get();
		if (!row) {
			throw new BizError('审批记录不存在');
		}
		if (row.status !== 'pending') {
			throw new BizError('该审批已处理');
		}
		// 动态导入避免循环依赖（email-service 会引用本服务）
		const emailService = (await import('./email-service.js')).default;
		try {
			await emailService.send(c, {
				accountId: row.accountId,
				receiveEmail: String(row.toEmail || '').split(',').map(s => s.trim()).filter(Boolean),
				subject: row.subject,
				content: row.content,
				text: row.text,
				attachments: JSON.parse(row.attachments || '[]'),
			}, row.userId, { skipDelay: true, skipApproval: true });
		} catch (e) {
			await orm(c).update(mailApproval).set({ status: 'failed' })
				.where(eq(mailApproval.id, row.id)).run();
			throw e;
		}
		await orm(c).update(mailApproval).set({ status: 'approved' })
			.where(eq(mailApproval.id, row.id)).run();
		return true;
	},

	async reject(c, id, reason) {
		const row = await orm(c).select().from(mailApproval)
			.where(eq(mailApproval.id, Number(id))).get();
		if (!row) {
			throw new BizError('审批记录不存在');
		}
		if (row.status !== 'pending') {
			throw new BizError('该审批已处理');
		}
		await orm(c).update(mailApproval).set({
			status: 'rejected',
			reason: String(reason || ''),
		}).where(eq(mailApproval.id, row.id)).run();
		return true;
	},
};

export default approvalService;
