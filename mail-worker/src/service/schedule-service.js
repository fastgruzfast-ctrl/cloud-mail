import orm from '../entity/orm';
import scheduledEmail from '../entity/scheduled-email';
import emailService from './email-service';
import emailUtils from '../utils/email-utils';
import dayjs from 'dayjs';
import { and, desc, eq, lte } from 'drizzle-orm';

const scheduleService = {

	async list(c, userId) {
		return await orm(c).select().from(scheduledEmail)
			.where(eq(scheduledEmail.userId, userId))
			.orderBy(desc(scheduledEmail.id)).all();
	},

	async add(c, params, userId) {
		const { accountId, toEmail, subject, content, sendAt } = params;
		const row = await orm(c).insert(scheduledEmail).values({
			userId,
			accountId: Number(accountId),
			toEmail: Array.isArray(toEmail) ? toEmail.join(',') : (toEmail || ''),
			subject: subject || '',
			content: content || '',
			sendAt: sendAt,
			status: 'pending',
		}).returning().get();
		return row;
	},

	async cancel(c, params, userId) {
		const { id } = params;
		await orm(c).update(scheduledEmail).set({ status: 'cancelled' })
			.where(and(
				eq(scheduledEmail.id, Number(id)),
				eq(scheduledEmail.userId, userId),
				eq(scheduledEmail.status, 'pending')
			)).run();
	},

	/** 定时任务：发送到期的定时邮件 */
	async processDue(c) {
		const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
		let dueList = [];
		try {
			dueList = await orm(c).select().from(scheduledEmail)
				.where(and(eq(scheduledEmail.status, 'pending'), lte(scheduledEmail.sendAt, now))).all();
		} catch (e) {
			console.error('查询定时邮件异常: ', e);
			return;
		}
		for (const item of dueList) {
			try {
				const receiveEmail = (item.toEmail || '').split(',').map(s => s.trim()).filter(Boolean);
				if (receiveEmail.length === 0) throw new Error('empty recipient');
				await emailService.send(c, {
					accountId: item.accountId,
					receiveEmail,
					subject: item.subject,
					content: item.content,
					text: emailUtils.htmlToText(item.content || ''),
				}, item.userId);
				await orm(c).update(scheduledEmail).set({ status: 'sent' })
					.where(eq(scheduledEmail.id, item.id)).run();
			} catch (e) {
				console.error('定时邮件发送失败: ', e);
				await orm(c).update(scheduledEmail).set({ status: 'failed' })
					.where(eq(scheduledEmail.id, item.id)).run();
			}
		}
	},
};

export default scheduleService;
