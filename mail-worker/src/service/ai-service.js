import emailUtils from '../utils/email-utils';
import { settingConst } from '../const/entity-const';

const aiService = {
	async extractCode(c, email, options = {}) {
		if (!this.shouldExtractCode(options.aiCode, options.aiCodeFilter, email)) {
			return '';
		}

		const ai = c.env.ai;

		try {
			const subject = email.subject || '';
			const text = emailUtils.formatText(email.text || '');
			const htmlText = emailUtils.htmlToText(email.html || '');
			const body = (htmlText || text).slice(0, 6000);

			if (!subject && !body) {
				return '';
			}

			const result = await ai.run(c.env.ai_model || '@cf/meta/llama-3.1-8b-instruct-fast', {
				messages: [
					{
						role: 'system',
						content: 'You extract verification codes from emails. Return only JSON like {"code":"12345678"} or {"code":""}. The code must be 8 characters or fewer and must not contain spaces. If the code is longer than 8 characters or contains spaces, return {"code":""}. Do not explain.'
					},
					{
						role: 'user',
						content: `Subject: ${subject}\n\n${body}`
					}
				],
				temperature: 0,
				max_tokens: 32
			});

			const content = typeof result === 'string' ? result : result?.response || '';
			const json = typeof content === 'string' ? JSON.parse(content) : content;
			if (typeof json.code !== 'string') {
				return '';
			}

			if (json.code.length > 8 || /\s/.test(json.code)) {
				return '';
			}

			return json.code;
		} catch (e) {
			console.error('验证码提取失败: ', e);
			return '';
		}
	},

	shouldExtractCode(aiCode, aiCodeFilterStr, email) {
		if (aiCode !== settingConst.aiCode.OPEN) {
			return false;
		}

		const filterList = aiCodeFilterStr ? aiCodeFilterStr.split(',').map(item => item.trim().toLowerCase()).filter(Boolean) : [];

		if (filterList.length === 0) {
			return true;
		}

		const fromEmail = (email.from?.address || '').trim().toLowerCase();
		const fromDomain = emailUtils.getDomain(fromEmail).toLowerCase();

		return filterList.some(item => item === fromEmail || item === fromDomain);
	},

	getBodyText(email) {
		const text = emailUtils.formatText(email.text || '');
		const htmlText = emailUtils.htmlToText(email.content || '');
		return (text || htmlText || '').slice(0, 4000);
	},

	async summarize(c, email) {
		const body = this.getBodyText(email);
		if (!body) {
			return '';
		}
		try {
			const result = await c.env.ai.run(c.env.ai_model || '@cf/meta/llama-3.1-8b-instruct-fast', {
				messages: [
					{
						role: 'system',
						content: '你是一个邮件助手。请用中文简洁总结下面这封邮件的核心内容，3-5句话，只输出摘要本身，不要输出多余解释。'
					},
					{
						role: 'user',
						content: body
					}
				],
				temperature: 0.3,
				max_tokens: 512
			});
			return typeof result === 'string' ? result : result?.response || '';
		} catch (e) {
			console.error('邮件摘要失败: ', e);
			return '';
		}
	},

	async translate(c, email, targetLang = 'zh') {
		const body = this.getBodyText(email);
		if (!body) {
			return '';
		}
		const langName = targetLang === 'en' ? '英文' : '中文';
		try {
			const result = await c.env.ai.run(c.env.ai_model || '@cf/meta/llama-3.1-8b-instruct-fast', {
				messages: [
					{
						role: 'system',
						content: `你是一个翻译助手。请把下面这封邮件的正文完整翻译成${langName}，只输出译文本身，不要输出多余解释。`
					},
					{
						role: 'user',
						content: body
					}
				],
				temperature: 0.3,
				max_tokens: 2048
			});
			return typeof result === 'string' ? result : result?.response || '';
		} catch (e) {
			console.error('邮件翻译失败: ', e);
			return '';
		}
	}
};

export default aiService;
