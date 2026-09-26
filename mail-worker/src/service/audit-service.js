import orm from '../entity/orm';
import auditLog from '../entity/audit-log';
import setting from '../entity/setting';
import BizError from '../error/biz-error';
import { count, desc } from 'drizzle-orm';

function parseWords(str) {
	return String(str || '')
		.split(/[,\n，]/)
		.map(s => s.trim())
		.filter(Boolean);
}

const auditService = {

	async getSetting(c) {
		const row = await orm(c).select().from(setting).get();
		return {
			auditEnabled: Number(row?.auditEnabled || 0),
			auditWords: row?.auditWords || '',
			auditMode: row?.auditMode || 'warn',
		};
	},

	async saveSetting(c, params) {
		const { auditEnabled, auditWords, auditMode = 'warn' } = params;
		if (auditMode !== 'warn' && auditMode !== 'block') {
			throw new BizError('审计模式只能是 warn 或 block');
		}
		await orm(c).update(setting).set({
			auditEnabled: Number(auditEnabled) ? 1 : 0,
			auditWords: String(auditWords || ''),
			auditMode,
		}).run();
	},

	/** 发信钩子：敏感词审计。block 模式命中时抛错拦截，warn 模式只记录 */
	async check(c, { subject = '', text = '', attachments = [], userId, userEmail = '', toEmail = '' }) {
		const row = await orm(c).select().from(setting).get();
		if (!Number(row?.auditEnabled || 0)) {
			return;
		}
		const words = parseWords(row.auditWords);
		if (words.length === 0) {
			return;
		}
		const haystack = [
			String(subject || ''),
			String(text || ''),
			...((attachments || []).map(att =>
				att?.filename || att?.name || att?.originalName || ''
			)),
		].join('\n').toLowerCase();

		const hits = [...new Set(words.filter(w => haystack.includes(w.toLowerCase())))];
		if (hits.length === 0) {
			return;
		}

		const mode = row.auditMode || 'warn';
		const toList = Array.isArray(toEmail) ? toEmail : [toEmail];
		await orm(c).insert(auditLog).values({
			userId: Number(userId) || 0,
			userEmail: String(userEmail || ''),
			toEmail: toList.map(String).join(','),
			subject: String(subject || ''),
			words: hits.join(','),
			action: mode,
		}).run();

		if (mode === 'block') {
			throw new BizError(`邮件包含敏感词：${hits.join(',')}，已被拦截`);
		}
	},

	async logList(c, { page = 1, pageSize = 20 } = {}) {
		page = Math.max(1, Number(page) || 1);
		pageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
		const list = await orm(c).select().from(auditLog)
			.orderBy(desc(auditLog.id))
			.limit(pageSize)
			.offset((page - 1) * pageSize)
			.all();
		const { total } = await orm(c).select({ total: count() }).from(auditLog).get();
		return { total: Number(total) || 0, list };
	},
};

export default auditService;
