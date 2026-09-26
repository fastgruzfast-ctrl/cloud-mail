import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const sendDailyStat = sqliteTable('send_daily_stat', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: text('date').default('').notNull(),
	domain: text('domain').default('').notNull(),
	sent: integer('sent').default(0).notNull(),
}, (t) => [
	uniqueIndex('send_daily_stat_date_domain').on(t.date, t.domain),
]);
export default sendDailyStat
