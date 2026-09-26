import orm from '../entity/orm';
import setting from '../entity/setting';
import sendQuota from '../entity/send-quota';
import sendDailyStat from '../entity/send-daily-stat';
import { and, eq, sql } from 'drizzle-orm';
import dayjs from 'dayjs';
import BizError from '../error/biz-error';

function todayStr() {
	return dayjs().format('YYYY-MM-DD');
}

/** 计算某域名今天的实际生效限额 */
function calcEffectiveLimit(row) {
	const warmup = Number(row?.warmupEnabled) === 1;
	const dayLimit = Math.max(1, Number(row?.dayLimit) || 100);
	if (!warmup) return dayLimit;

	const startLimit = Math.max(1, Number(row.warmupStartLimit) || 20);
	const step = Math.max(0, Number(row.warmupStep) || 0);
	const max = Math.max(startLimit, Number(row.warmupMax) || 100);

	let daysDiff = 0;
	if (row.warmupStart) {
		const start = dayjs(row.warmupStart);
		if (start.isValid()) {
			daysDiff = Math.max(0, dayjs(todayStr()).diff(start.startOf('day'), 'day'));
		}
	}
	return Math.min(max, startLimit + daysDiff * step);
}

const quotaService = {

	/** 读配额总开关 */
	async getSetting(c) {
		const row = await orm(c).select().from(setting).get();
		return { quotaEnabled: Number(row?.quotaEnabled || 0) };
	},

	/** 保存配额总开关 */
	async saveSetting(c, params) {
		const { quotaEnabled } = params;
		await orm(c).update(setting).set({
			quotaEnabled: Number(quotaEnabled) === 1 ? 1 : 0,
		}).run();
	},

	/** 域名配额列表（含今日已发与有效限额） */
	async getQuotas(c) {
		const row = await orm(c).select().from(setting).get();
		const enabled = Number(row?.quotaEnabled || 0) === 1;

		const rows = await orm(c).select().from(sendQuota).all();
		const today = todayStr();
		const stats = await orm(c).select().from(sendDailyStat)
			.where(eq(sendDailyStat.date, today)).all();
		const statMap = {};
		for (const s of stats) statMap[s.domain] = Number(s.sent || 0);

		const list = rows.map((r) => ({
			domain: r.domain,
			dayLimit: Number(r.dayLimit),
			warmupEnabled: Number(r.warmupEnabled),
			warmupStart: r.warmupStart || '',
			warmupStartLimit: Number(r.warmupStartLimit),
			warmupStep: Number(r.warmupStep),
			warmupMax: Number(r.warmupMax),
			todaySent: statMap[r.domain] || 0,
			effectiveLimit: calcEffectiveLimit(r),
		}));
		return { enabled, list };
	},

	/** 新增/更新域名配额（upsert） */
	async saveQuota(c, params) {
		const { domain } = params;
		if (!domain) {
			throw new BizError('域名不能为空');
		}
		const values = {
			domain: String(domain).trim().toLowerCase(),
			dayLimit: Math.max(1, Number(params.dayLimit) || 100),
			warmupEnabled: Number(params.warmupEnabled) === 1 ? 1 : 0,
			warmupStart: params.warmupStart || '',
			warmupStartLimit: Math.max(1, Number(params.warmupStartLimit) || 20),
			warmupStep: Math.max(0, Number(params.warmupStep) || 0),
			warmupMax: Math.max(1, Number(params.warmupMax) || 100),
		};
		const exists = await orm(c).select().from(sendQuota)
			.where(eq(sendQuota.domain, values.domain)).get();
		if (exists) {
			await orm(c).update(sendQuota).set(values)
				.where(eq(sendQuota.domain, values.domain)).run();
		} else {
			await orm(c).insert(sendQuota).values(values).run();
		}
	},

	/** 删除域名配额 */
	async removeQuota(c, domain) {
		if (!domain) return;
		await orm(c).delete(sendQuota)
			.where(eq(sendQuota.domain, String(domain).trim().toLowerCase())).run();
	},

	/** 发信前配额检查：count 为本次要发的数量 */
	async checkQuota(c, domain, count) {
		const row = await orm(c).select().from(setting).get();
		if (Number(row?.quotaEnabled || 0) !== 1) return;

		const quota = await orm(c).select().from(sendQuota)
			.where(eq(sendQuota.domain, String(domain || '').trim().toLowerCase())).get();
		if (!quota) return;

		const limit = calcEffectiveLimit(quota);
		const today = todayStr();
		const stat = await orm(c).select().from(sendDailyStat)
			.where(and(eq(sendDailyStat.date, today), eq(sendDailyStat.domain, quota.domain))).get();
		const todaySent = Number(stat?.sent || 0);
		if (todaySent + Number(count || 1) > limit) {
			throw new BizError(`发信配额超限，今日限额 ${limit} 封`);
		}
	},

	/** 发信成功后累加当日发送计数 */
	async incrStat(c, domain, count) {
		const d = String(domain || '').trim().toLowerCase();
		if (!d) return;
		const today = todayStr();
		const n = Number(count) || 1;
		const stat = await orm(c).select().from(sendDailyStat)
			.where(and(eq(sendDailyStat.date, today), eq(sendDailyStat.domain, d))).get();
		if (stat) {
			await orm(c).update(sendDailyStat)
				.set({ sent: sql`${sendDailyStat.sent} + ${n}` })
				.where(eq(sendDailyStat.id, stat.id)).run();
		} else {
			await orm(c).insert(sendDailyStat).values({
				date: today,
				domain: d,
				sent: n,
			}).run();
		}
	},
};

export default quotaService;
