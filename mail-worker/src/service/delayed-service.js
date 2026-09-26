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
		// 回收孤儿：上次执行崩溃导致卡在 sending 超过 10 分钟的，重置为 pending
		try {
			const staleLine = dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss');
			await orm(c).update(delayedSend).set({ status: 'pending' })
				.where(and(
					eq(delayedSend.status, 'sending'),
					lte(delayedSend.sendAt, staleLine)
				)).run();
		} catch (e) {
			console.error('回收延迟发送孤儿记录异常: ', e);
		}
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
			// 原子认领：pending -> sending，只有抢到的才真正发送；
			// 避免多个 cron 执行并发（或上次执行崩溃后）重复发送同一封邮件
			let claimed = false;
			try {
				const cr = await orm(c).update(delayedSend).set({ status: 'sending' })
					.where(and(
						eq(delayedSend.id, item.id),
						eq(delayedSend.status, 'pending')
					)).run();
				claimed = Number(cr?.meta?.changes || 0) > 0;
			} catch (e) {
				console.error('认领延迟发送记录异常:', item.id, e.message);
			}
			if (!claimed) continue;
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
				await orm(c).update(delayedSend).set({
					status: 'failed',
					message: String(e?.message || e || '').slice(0, 500),
				})
					.where(eq(delayedSend.id, item.id)).run();
			}
		}
	},
	/** 查询自己的延迟发送记录状态（供前端在撤销窗口结束后确认真实发送结果） */
	async status(c, id, userId) {
		const row = await orm(c).select().from(delayedSend)
			.where(eq(delayedSend.id, Number(id))).get();
		if (!row || row.userId !== userId) {
			throw new BizError('记录不存在');
		}
		return { status: row.status, message: row.message || '' };
	},
};

export default delayedService;
