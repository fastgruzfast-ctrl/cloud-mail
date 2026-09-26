import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const mailBackup = sqliteTable('mail_backup', {
	backupId: integer('backup_id').primaryKey({ autoIncrement: true }),
	fileName: text('file_name').default('').notNull(),
	kvKey: text('kv_key').default('').notNull(),
	emailCount: integer('email_count').default(0).notNull(),
	size: integer('size').default(0).notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
export default mailBackup
