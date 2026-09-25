import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const scheduledEmail = sqliteTable('scheduled_email', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	accountId: integer('account_id').notNull(),
	toEmail: text('to_email').default('').notNull(),
	subject: text('subject').default('').notNull(),
	content: text('content').default('').notNull(),
	sendAt: text('send_at').notNull(),
	status: text('status').default('pending').notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default scheduledEmail
