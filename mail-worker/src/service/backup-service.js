import orm from '../entity/orm';
import mailBackup from '../entity/mail-backup';
import setting from '../entity/setting';
import { desc, eq, sql } from 'drizzle-orm';
import JSZip from 'jszip';
import dayjs from 'dayjs';

const KV_PREFIX = 'backup/';
const BATCH_SIZE = 500;

function buildEml(email) {
	const from = email.sendEmail || '';
	const to = email.toEmail || '';
	const subject = (email.subject || '').replace(/[\r\n]+/g, ' ');
	const date = email.createTime
		? new Date(String(email.createTime).replace(' ', 'T') + 'Z').toUTCString()
		: new Date().toUTCString();
	const isHtml = !!(email.content && /<\w+/.test(email.content));
	const body = isHtml ? email.content : (email.text || '');
	const contentType = isHtml ? 'text/html' : 'text/plain';
	return [
		`From: ${from}`,
		`To: ${to}`,
		`Subject: ${subject}`,
		`Date: ${date}`,
		'MIME-Version: 1.0',
		`Content-Type: ${contentType}; charset=utf-8`,
		'Content-Transfer-Encoding: 8bit',
		'',
		body || ''
	].join('\r\n');
}

const backupService = {

	/** 执行一次全量备份：所有未删除邮件 -> EML -> ZIP -> KV */
	async run(env) {
		const db = env.db;
		const stamp = dayjs().format('YYYYMMDD-HHmmss');
		const zip = new JSZip();
		let emailCount = 0;
		let offset = 0;

		while (true) {
			const rows = await db.prepare(
				`SELECT email_id, send_email, to_email, subject, content, text, create_time
				 FROM email WHERE is_del = 0 ORDER BY email_id LIMIT ? OFFSET ?`
			).bind(BATCH_SIZE, offset).all();

			const list = rows.results || [];
			if (list.length === 0) break;

			for (const item of list) {
				const safe = String(item.subject || 'no-subject').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || 'email';
				zip.file(`${safe}-${item.email_id}.eml`, buildEml({
					sendEmail: item.send_email,
					toEmail: item.to_email,
					subject: item.subject,
					content: item.content,
					text: item.text,
					createTime: item.create_time,
				}));
				emailCount++;
			}
			offset += list.length;
			if (list.length < BATCH_SIZE) break;
		}

		if (emailCount === 0) {
			throw new Error('没有可备份的邮件');
		}

		const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
		const fileName = `mail-backup-${stamp}.zip`;
		const kvKey = KV_PREFIX + fileName;

		await env.kv.put(kvKey, zipBuffer);

		const row = await orm({ env }).insert(mailBackup).values({
			fileName,
			kvKey,
			emailCount,
			size: zipBuffer.byteLength,
		}).returning().get();

		await this.cleanOld(env);

		return row;
	},

	/** 按保留份数清理旧备份 */
	async cleanOld(env) {
		const settingRow = await orm({ env }).select().from(setting).get();
		const keep = Math.max(1, Number(settingRow?.backupKeep ?? 7));

		const rows = await orm({ env }).select().from(mailBackup)
			.orderBy(desc(mailBackup.backupId)).all();

		const overflow = rows.slice(keep);
		for (const item of overflow) {
			try {
				if (item.kvKey) await env.kv.delete(item.kvKey);
			} catch (e) {
				console.warn('删除备份文件失败:', e.message);
			}
			await orm({ env }).delete(mailBackup)
				.where(eq(mailBackup.backupId, item.backupId)).run();
		}
	},

	/** 定时检查：根据 backup_cron 判断今天是否需要备份 */
	async checkAndRun(env) {
		let settingRow;
		try {
			settingRow = await orm({ env }).select().from(setting).get();
		} catch (e) {
			console.warn('备份检查读取设置失败:', e.message);
			return;
		}
		const cron = Number(settingRow?.backupCron || 0);
		if (cron <= 0) return;

		const latest = await orm({ env }).select().from(mailBackup)
			.orderBy(desc(mailBackup.backupId)).limit(1).get();

		const now = dayjs();
		let need = false;
		if (!latest) {
			need = true;
		} else {
			const last = dayjs(latest.createTime);
			if (cron === 1) {
				need = !last.isSame(now, 'day');
			} else if (cron === 2) {
				need = !last.isSame(now, 'week');
			} else if (cron === 3) {
				need = !last.isSame(now, 'month');
			}
		}

		if (need) {
			console.log('开始定时备份邮件...');
			await this.run(env);
			console.log('定时备份完成');
		}
	},

	async list(c) {
		return await orm(c).select().from(mailBackup)
			.orderBy(desc(mailBackup.backupId)).all();
	},

	async download(c, backupId) {
		const row = await orm(c).select().from(mailBackup)
			.where(eq(mailBackup.backupId, Number(backupId))).get();
		if (!row) {
			throw new Error('备份不存在');
		}
		const buf = await c.env.kv.get(row.kvKey, { type: 'arrayBuffer' });
		if (!buf) {
			throw new Error('备份文件已丢失');
		}
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${encodeURIComponent(row.fileName)}"`,
			},
		});
	},

	async remove(c, backupId) {
		const row = await orm(c).select().from(mailBackup)
			.where(eq(mailBackup.backupId, Number(backupId))).get();
		if (row?.kvKey) {
			try { await c.env.kv.delete(row.kvKey); } catch (e) { /* 忽略 */ }
		}
		await orm(c).delete(mailBackup)
			.where(eq(mailBackup.backupId, Number(backupId))).run();
	},

	async saveSetting(c, params) {
		const { backupCron, backupKeep } = params;
		await orm(c).update(setting).set({
			backupCron: Math.min(3, Math.max(0, Number(backupCron) || 0)),
			backupKeep: Math.min(100, Math.max(1, Number(backupKeep) || 7)),
		}).run();
	},
};

export default backupService;
