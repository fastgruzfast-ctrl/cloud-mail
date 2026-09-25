import orm from '../entity/orm';
import autoReply from '../entity/auto-reply';
import emailService from './email-service';
import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';

const autoreplyService = {

	async get(c, userId) {
		const row = await orm(c).select().from(autoReply)
			.where(eq(autoReply.userId, userId)).get();
		return row || { userId, enabled: 0, subject: '', content: '', startTime: null, endTime: null };
	},

	async save(c, params, userId) {
		const { enabled, subject, content, startTime, endTime } = params;
		const exist = await orm(c).select().from(autoReply)
			.where(eq(autoReply.userId, userId)).get();
		const values = {
			enabled: enabled ? 1 : 0,
			subject: subject || '',
			content: content || '',
			startTime: startTime || null,
			endTime: endTime || null,
		};
		if (exist) {
			await orm(c).update(autoReply).set(values).where(eq(autoReply.userId, userId)).run();
		} else {
			await orm(c).insert(autoReply).values({ userId, ...values }).run();
		}
	},

	/** 收信后：如在自动回复时间窗内且今天未回复过该发件人，则自动回复 */
	async maybeSend(c, emailRow) {
		if (!emailRow || !emailRow.userId || !emailRow.accountId) return;
		try {
			const conf = await this.get(c, emailRow.userId);
			if (!conf || !conf.enabled) return;

			const now = dayjs();
			if (conf.startTime && now.isBefore(dayjs(conf.startTime))) return;
			if (conf.endTime && now.isAfter(dayjs(conf.endTime))) return;

			const sender = (emailRow.sendEmail || '').toLowerCase();
			if (!sender) return;
			// 不给自己/空发件人回，避免循环
			if (sender.includes('mailer-daemon') || sender.includes('postmaster')) return;

			const day = now.format('YYYY-MM-DD');
			const kvKey = `autoreply:${emailRow.userId}:${sender}:${day}`;
			const sent = await c.env.kv.get(kvKey);
			if (sent) return;

			const subject = conf.subject || ('Re: ' + (emailRow.subject || ''));
			await emailService.send(c, {
				accountId: emailRow.accountId,
				receiveEmail: [emailRow.sendEmail],
				subject,
				content: conf.content || '',
				text: conf.content || '',
			}, emailRow.userId);

			await c.env.kv.put(kvKey, '1', { expirationTtl: 86400 });
		} catch (e) {
			console.error('自动回复异常: ', e);
		}
	},
};

export default autoreplyService;
