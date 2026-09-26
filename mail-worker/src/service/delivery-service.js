import orm from '../entity/orm';
import email from '../entity/email';
import { and, count, desc, eq, gte, inArray, like } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { emailConst, isDel } from '../const/entity-const';
import dayjs from 'dayjs';

const DATE_FMT = 'YYYY-MM-DD';

const deliveryService = {

	/**
	 * 投递统计：近 N 天按天+状态分组计数
	 * @param days 天数（默认 7）
	 * @param domain 可选发件域名过滤
	 */
	async stats(c, params) {
		const { domain } = params || {};
		const days = Math.min(90, Math.max(1, Number(params?.days) || 7));
		const fromDay = dayjs().subtract(days - 1, 'day').format(DATE_FMT);

		const filters = [
			eq(email.type, emailConst.type.SEND),
			gte(email.createTime, `${fromDay} 00:00:00`),
		];
		if (domain) {
			filters.push(like(email.sendEmail, `%@${String(domain).trim().toLowerCase()}`));
		}

		const rows = await orm(c).select({
			date: sql`substr(${email.createTime}, 1, 10)`,
			status: email.status,
			cnt: count(),
		}).from(email)
			.where(and(...filters))
			.groupBy(sql`substr(${email.createTime}, 1, 10)`, email.status)
			.all();

		const totals = { sent: 0, delivered: 0, bounced: 0, complained: 0, failed: 0, delayed: 0 };
		const byDay = [];
		for (let i = days - 1; i >= 0; i--) {
			const date = dayjs().subtract(i, 'day').format(DATE_FMT);
			const dayRow = { date, sent: 0, delivered: 0, bounced: 0, complained: 0, failed: 0, delayed: 0 };
			for (const r of rows) {
				if (r.date !== date) continue;
				const n = Number(r.cnt);
				dayRow.sent += n;
				totals.sent += n;
				switch (Number(r.status)) {
					case emailConst.status.DELIVERED:
						dayRow.delivered += n; totals.delivered += n; break;
					case emailConst.status.BOUNCED:
						dayRow.bounced += n; totals.bounced += n; break;
					case emailConst.status.COMPLAINED:
						dayRow.complained += n; totals.complained += n; break;
					case emailConst.status.FAILED:
						dayRow.failed += n; totals.failed += n; break;
					case emailConst.status.DELAYED:
						dayRow.delayed += n; totals.delayed += n; break;
				}
			}
			byDay.push(dayRow);
		}

		// 去重发件域名列表
		const senders = await orm(c).select({ sendEmail: email.sendEmail })
			.from(email)
			.where(and(
				eq(email.type, emailConst.type.SEND),
				gte(email.createTime, `${fromDay} 00:00:00`)
			)).all();
		const domainSet = new Set();
		for (const s of senders) {
			const addr = String(s.sendEmail || '').toLowerCase();
			const at = addr.lastIndexOf('@');
			if (at > 0) domainSet.add(addr.slice(at + 1));
		}

		return {
			byDay,
			totals,
			domains: [...domainSet].sort(),
		};
	},

	/**
	 * 退信/投诉明细：status IN (BOUNCED, COMPLAINED, FAILED)，按 email_id 倒序分页
	 */
	async bounceList(c, params) {
		const page = Math.max(1, Number(params?.page) || 1);
		const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 20));
		const domain = params?.domain ? String(params.domain).trim().toLowerCase() : '';

		const filters = [
			eq(email.isDel, isDel.NORMAL),
			inArray(email.status, [emailConst.status.BOUNCED, emailConst.status.COMPLAINED, emailConst.status.FAILED]),
		];
		if (domain) {
			filters.push(like(email.sendEmail, `%@${domain}`));
		}

		const totalRow = await orm(c).select({ total: count() }).from(email)
			.where(and(...filters)).get();
		const total = Number(totalRow?.total || 0);

		const list = await orm(c).select().from(email)
			.where(and(...filters))
			.orderBy(desc(email.emailId))
			.limit(pageSize)
			.offset((page - 1) * pageSize)
			.all();

		return { total, list };
	},
};

export default deliveryService;
