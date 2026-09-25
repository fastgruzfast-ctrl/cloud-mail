import orm from '../entity/orm';
import mailTag from '../entity/mail-tag';
import emailTag from '../entity/email-tag';
import emailService from './email-service';
import { and, desc, eq, inArray, like } from 'drizzle-orm';

const tagService = {

	async list(c, userId) {
		return await orm(c).select().from(mailTag)
			.where(eq(mailTag.userId, userId))
			.orderBy(desc(mailTag.tagId)).all();
	},

	async add(c, params, userId) {
		const { name, color } = params;
		return await orm(c).insert(mailTag).values({
			userId,
			name: name || '',
			color: color || '#409eff',
		}).returning().get();
	},

	async update(c, params, userId) {
		const { tagId, name, color } = params;
		const values = {};
		if (name !== undefined) values.name = name;
		if (color !== undefined) values.color = color;
		await orm(c).update(mailTag).set(values)
			.where(and(eq(mailTag.tagId, Number(tagId)), eq(mailTag.userId, userId))).run();
	},

	async remove(c, params, userId) {
		const { tagId } = params;
		const tagRow = await orm(c).select().from(mailTag)
			.where(and(eq(mailTag.tagId, Number(tagId)), eq(mailTag.userId, userId))).get();
		if (!tagRow) return;
		await orm(c).delete(emailTag).where(eq(emailTag.tagId, Number(tagId))).run();
		await orm(c).delete(mailTag)
			.where(and(eq(mailTag.tagId, Number(tagId)), eq(mailTag.userId, userId))).run();
	},

	async assign(c, params, userId) {
		const { emailIds, tagId } = params;
		const ids = String(emailIds || '').split(',').map(s => Number(s)).filter(Boolean);
		if (ids.length === 0) return;
		const tagRow = await orm(c).select().from(mailTag)
			.where(and(eq(mailTag.tagId, Number(tagId)), eq(mailTag.userId, userId))).get();
		if (!tagRow) return;
		// 校验邮件归属
		for (const emailId of ids) {
			const emailRow = await emailService.selectById(c, emailId);
			if (!emailRow || emailRow.userId !== userId) continue;
			await c.env.db.prepare(
				`INSERT OR IGNORE INTO email_tag (email_id, tag_id) VALUES (?, ?)`
			).bind(emailId, Number(tagId)).run();
		}
	},

	async unassign(c, params, userId) {
		const { emailIds, tagId } = params;
		const ids = String(emailIds || '').split(',').map(s => Number(s)).filter(Boolean);
		if (ids.length === 0) return;
		const tagRow = await orm(c).select().from(mailTag)
			.where(and(eq(mailTag.tagId, Number(tagId)), eq(mailTag.userId, userId))).get();
		if (!tagRow) return;
		await orm(c).delete(emailTag)
			.where(and(inArray(emailTag.emailId, ids), eq(emailTag.tagId, Number(tagId)))).run();
	},

	/** 批量返回邮件的标签，供列表展示 */
	async emailTags(c, params, userId) {
		const ids = String(params.emailIds || '').split(',').map(s => Number(s)).filter(Boolean);
		if (ids.length === 0) return {};
		const rows = await c.env.db.prepare(
			`SELECT et.email_id AS emailId, t.tag_id AS tagId, t.name, t.color
			 FROM email_tag et
			 JOIN mail_tag t ON t.tag_id = et.tag_id
			 WHERE et.email_id IN (${ids.map(() => '?').join(',')}) AND t.user_id = ?`
		).bind(...ids, userId).all();
		const map = {};
		for (const row of rows.results || []) {
			if (!map[row.emailId]) map[row.emailId] = [];
			map[row.emailId].push({ tagId: row.tagId, name: row.name, color: row.color });
		}
		return map;
	},
};

export default tagService;
