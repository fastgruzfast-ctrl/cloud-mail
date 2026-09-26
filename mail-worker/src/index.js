import app from './hono/webs';
import { email } from './email/email';
import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from './service/oauth-service';
import analysisService from './service/analysis-service';
import scheduleService from './service/schedule-service';
import backupService from './service/backup-service';
import delayedService from './service/delayed-service';
export default {
	 async fetch(req, env, ctx) {

		const url = new URL(req.url)

		if (url.pathname.startsWith('/api/')) {
			url.pathname = url.pathname.replace('/api', '')
			req = new Request(url.toString(), req)
			return app.fetch(req, env, ctx);
		}

		 if (['/static/','/attachments/'].some(p => url.pathname.startsWith(p))) {
			 return await kvObjService.toObjResp( { env }, url.pathname.substring(1));
		 }

		return env.assets.fetch(req);
	},
	email: email,
	async scheduled(c, env, ctx) {
		if (c.cron === '*/30 * * * *') {
			await analysisService.refreshEchartsCache({ env })
			return;
		}

		if (c.cron === '*/5 * * * *') {
			await scheduleService.processDue({ env })
			// 原每小时任务并入 5 分钟档（免费版 cron 触发器配额限制）：每小时整点后 5 分钟内跑一次
			if (new Date().getUTCMinutes() < 5) {
				await verifyRecordService.clearRecord({ env })
				await userService.resetDaySendCount({ env })
				await emailService.completeReceiveAll({ env })
				await emailService.autoClean({ env })
				await analysisService.refreshEchartsCache({ env })
				await oauthService.clearNoBindOathUser({ env })
				await backupService.checkAndRun(env)
			}
			return;
		}

		if (c.cron === '* * * * *') {
			await delayedService.processDue({ env });
			return;
		}

		// 兼容旧的 "0 * * * *" 触发器（已从 wrangler.toml 移除，保留兜底）
		await verifyRecordService.clearRecord({ env })
		await userService.resetDaySendCount({ env })
		await emailService.completeReceiveAll({ env })
		await emailService.autoClean({ env })
		await analysisService.refreshEchartsCache({ env })
		await oauthService.clearNoBindOathUser({ env })
		await backupService.checkAndRun(env)
	},
};
