import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const autoReply = sqliteTable('auto_reply', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	enabled: integer('enabled').default(0).notNull(),
	subject: text('subject').default('').notNull(),
	content: text('content').default('').notNull(),
	startTime: text('start_time'),
	endTime: text('end_time'),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default autoReply
