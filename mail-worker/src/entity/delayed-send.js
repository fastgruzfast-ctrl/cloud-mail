import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const delayedSend = sqliteTable('delayed_send', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').default(0).notNull(),
	accountId: integer('account_id').default(0).notNull(),
	toEmail: text('to_email').default('').notNull(),
	subject: text('subject').default('').notNull(),
	content: text('content').default('').notNull(),
	text: text('text').default('').notNull(),
	attachments: text('attachments').default('[]').notNull(),
	sendAt: text('send_at').default('').notNull(),
	status: text('status').default('pending').notNull(),
	message: text('message').default('').notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default delayedSend
