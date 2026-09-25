import { sqliteTable, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const emailTag = sqliteTable('email_tag', {
	emailId: integer('email_id').notNull(),
	tagId: integer('tag_id').notNull(),
}, (t) => [
	primaryKey({ columns: [t.emailId, t.tagId] }),
]);
export default emailTag
