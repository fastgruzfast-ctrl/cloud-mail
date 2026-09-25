import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const contact = sqliteTable('contact', {
	contactId: integer('contact_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').default('').notNull(),
	email: text('email').default('').notNull(),
	remark: text('remark').default('').notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default contact
