import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sendQuota = sqliteTable('send_quota', {
	domain: text('domain').primaryKey(),
	dayLimit: integer('day_limit').default(100).notNull(),
	warmupEnabled: integer('warmup_enabled').default(0).notNull(),
	warmupStart: text('warmup_start').default('').notNull(),
	warmupStartLimit: integer('warmup_start_limit').default(20).notNull(),
	warmupStep: integer('warmup_step').default(20).notNull(),
	warmupMax: integer('warmup_max').default(100).notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default sendQuota
