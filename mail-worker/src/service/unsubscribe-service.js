import orm from '../entity/orm';
import unsubscribe from '../entity/unsubscribe';
import setting from '../entity/setting';
import BizError from '../error/biz-error';
import emailUtils from '../utils/email-utils';
import { desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

function genToken() {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const unsubscribeService = {

	/** 按邮箱查 token，没有则生成并入库（status=0 仅表示发过营销邮件，不算退订） */
	async getToken(c, email, domain) {
		const row = await orm(c).select().from(unsubscribe)
			.where(eq(unsubscribe.email, email)).get();
		if (row) return row.token;
		for (let i = 0; i < 3; i++) {
			const token = genToken();
			try {
				await orm(c).insert(unsubscribe).values({
					email,
					domain: domain || emailUtils.getDomain(email),
					token,
					status: 0,
				}).run();
				return token;
			} catch (e) {
				// 并发插入或 token 极小概率碰撞：重查一次
				const exist = await orm(c).select().from(unsubscribe)
					.where(eq(unsubscribe.email, email)).get();
				if (exist) return exist.token;
			}
		}
		throw new BizError('生成退订 token 失败');
	},

	/** 是否已确认退订（status=1） */
	async isUnsubscribed(c, email) {
		const row = await orm(c).select().from(unsubscribe)
			.where(eq(unsubscribe.email, email)).get();
		return !!row && Number(row.status) === 1;
	},

	/** 用户点击退订链接确认：token 无效抛错；标记为已退订（幂等） */
	async unsubscribeByToken(c, token) {
		const row = await orm(c).select().from(unsubscribe)
			.where(eq(unsubscribe.token, token)).get();
		if (!row) {
			throw new BizError('退订链接无效');
		}
		if (Number(row.status) !== 1) {
			await orm(c).update(unsubscribe).set({ status: 1 })
				.where(eq(unsubscribe.id, row.id)).run();
		}
		return true;
	},

	async list(c, { page = 1, pageSize = 20 } = {}) {
		page = Math.max(1, Number(page) || 1);
		pageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
		const { total } = await orm(c).select({ total: sql`count(*)` })
			.from(unsubscribe).where(eq(unsubscribe.status, 1)).get();
		const list = await orm(c).select().from(unsubscribe)
			.where(eq(unsubscribe.status, 1))
			.orderBy(desc(unsubscribe.id))
			.limit(pageSize).offset((page - 1) * pageSize).all();
		return { total: Number(total) || 0, list };
	},

	/** 删除记录 = 重新允许发送 */
	async remove(c, id) {
		await orm(c).delete(unsubscribe)
			.where(eq(unsubscribe.id, Number(id))).run();
	},

	/** 发信设置：site_url（退订链接域名）+ undo_seconds（撤销秒数，B2 共用） */
	async getSetting(c) {
		const row = await orm(c).select().from(setting).get();
		return {
			siteUrl: row?.siteUrl || '',
			undoSeconds: Number(row?.undoSeconds ?? 30),
		};
	},

	async saveSetting(c, params) {
		const { siteUrl, undoSeconds } = params || {};
		await orm(c).update(setting).set({
			siteUrl: String(siteUrl || '').trim().replace(/\/$/, ''),
			undoSeconds: Math.min(600, Math.max(0, Number(undoSeconds) || 0)),
		}).run();
	},

	/**
	 * 营销邮件发信钩子（由 email-service.send 接入）
	 * 返回 null 表示非营销邮件；返回对象则替换 params 的收件人/正文/请求头
	 */
	async prepareMarketing(c, params, accountRow) {
		if (!params.marketing) return null;

		const receiveEmail = params.receiveEmail || [];
		if (receiveEmail.length !== 1) {
			throw new BizError('营销邮件只能单个发送');
		}
		const email = receiveEmail[0];
		if (await this.isUnsubscribed(c, email)) {
			throw new BizError('该收件人已退订');
		}

		const token = await this.getToken(c, email, emailUtils.getDomain(email));
		const settingRow = await this.getSetting(c);
		const fromDomain = emailUtils.getDomain(accountRow?.email || '');
		const base = (settingRow.siteUrl || ('https://' + fromDomain)).replace(/\/$/, '');
		const url = base + '/api/public/unsubscribe?token=' + token;

		const footerHtml = `<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:12px;color:#999999;">如果您不想再收到此类邮件，请点击<a href="${url}">退订</a> / If you no longer wish to receive such emails, please <a href="${url}">unsubscribe</a>.</div>`;
		const footerText = `\n退订/Unsubscribe: ${url}`;

		return {
			receiveEmail,
			content: params.content ? params.content + footerHtml : params.content,
			text: (params.text || '') + footerText,
			extraHeaders: {
				'List-Unsubscribe': `<${base}/api/public/unsubscribe/confirm?token=${token}>`,
				'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
			},
		};
	},
};

export default unsubscribeService;
