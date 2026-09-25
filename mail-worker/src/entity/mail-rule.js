import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const mailRule = sqliteTable('mail_rule', {
	ruleId: integer('rule_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').default('').notNull(),
	field: text('field').default('sender').notNull(),
	op: text('op').default('contains').notNull(),
	value: text('value').default('').notNull(),
	actions: text('actions').default('[]').notNull(),
	enabled: integer('enabled').default(1).notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default mailRule
