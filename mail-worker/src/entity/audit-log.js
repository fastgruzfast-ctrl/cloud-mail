import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const auditLog = sqliteTable('audit_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id'),
	userEmail: text('user_email').default('').notNull(),
	toEmail: text('to_email').default('').notNull(),
	subject: text('subject').default('').notNull(),
	words: text('words').default('').notNull(),
	action: text('action').default('').notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default auditLog
