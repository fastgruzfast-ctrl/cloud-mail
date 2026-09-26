import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const mailApproval = sqliteTable('mail_approval', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id'),
	accountId: integer('account_id'),
	toEmail: text('to_email').default('').notNull(),
	subject: text('subject').default('').notNull(),
	content: text('content').default('').notNull(),
	text: text('text').default('').notNull(),
	attachments: text('attachments').default('[]').notNull(),
	status: text('status').default('pending').notNull(),
	reason: text('reason').default('').notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default mailApproval
