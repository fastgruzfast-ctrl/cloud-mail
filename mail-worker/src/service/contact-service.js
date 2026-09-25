import orm from '../entity/orm';
import contact from '../entity/contact';
import { and, desc, eq, like, or } from 'drizzle-orm';

const contactService = {

	async list(c, userId) {
		return await orm(c).select().from(contact)
			.where(eq(contact.userId, userId))
			.orderBy(desc(contact.contactId)).all();
	},

	async add(c, params, userId) {
		const { name, email, remark } = params;
		return await orm(c).insert(contact).values({
			userId,
			name: name || '',
			email: email || '',
			remark: remark || '',
		}).returning().get();
	},

	async update(c, params, userId) {
		const { contactId, name, email, remark } = params;
		const values = {};
		if (name !== undefined) values.name = name;
		if (email !== undefined) values.email = email;
		if (remark !== undefined) values.remark = remark;
		await orm(c).update(contact).set(values)
			.where(and(eq(contact.contactId, Number(contactId)), eq(contact.userId, userId))).run();
	},

	async remove(c, params, userId) {
		const { contactId } = params;
		await orm(c).delete(contact)
			.where(and(eq(contact.contactId, Number(contactId)), eq(contact.userId, userId))).run();
	},

	async search(c, params, userId) {
		const keyword = (params.keyword || '').trim();
		if (!keyword) {
			return await this.list(c, userId);
		}
		const kw = `%${keyword}%`;
		return await orm(c).select().from(contact)
			.where(and(
				eq(contact.userId, userId),
				or(like(contact.name, kw), like(contact.email, kw))
			))
			.orderBy(desc(contact.contactId))
			.limit(20).all();
	},
};

export default contactService;
