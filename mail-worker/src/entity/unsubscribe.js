import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const unsubscribe = sqliteTable('unsubscribe', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').default('').notNull(),
	domain: text('domain').default('').notNull(),
	token: text('token').unique(),
	status: integer('status').default(0).notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default unsubscribe
