import orm from '../entity/orm';
import mailTemplate from '../entity/mail-template';
import { and, desc, eq } from 'drizzle-orm';

const templateService = {

	async list(c, userId) {
		return await orm(c).select().from(mailTemplate)
			.where(eq(mailTemplate.userId, userId))
			.orderBy(desc(mailTemplate.id)).all();
	},

	async add(c, params, userId) {
		const { name, subject, content } = params;
		return await orm(c).insert(mailTemplate).values({
			userId,
			name: name || '',
			subject: subject || '',
			content: content || '',
		}).returning().get();
	},

	async update(c, params, userId) {
		const { id, name, subject, content } = params;
		const values = {};
		if (name !== undefined) values.name = name;
		if (subject !== undefined) values.subject = subject;
		if (content !== undefined) values.content = content;
		await orm(c).update(mailTemplate).set(values)
			.where(and(eq(mailTemplate.id, Number(id)), eq(mailTemplate.userId, userId))).run();
	},

	async remove(c, params, userId) {
		const { id } = params;
		await orm(c).delete(mailTemplate)
			.where(and(eq(mailTemplate.id, Number(id)), eq(mailTemplate.userId, userId))).run();
	},
};

export default templateService;
