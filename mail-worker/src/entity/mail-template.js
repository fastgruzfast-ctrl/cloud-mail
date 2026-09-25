import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const mailTemplate = sqliteTable('mail_template', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').default('').notNull(),
	subject: text('subject').default('').notNull(),
	content: text('content').default('').notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default mailTemplate
