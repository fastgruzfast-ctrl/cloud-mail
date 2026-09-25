import orm from '../entity/orm';
import mailRule from '../entity/mail-rule';
import email from '../entity/email';
import { star } from '../entity/star';
import emailService from './email-service';
import emailUtils from '../utils/email-utils';
import { and, desc, eq } from 'drizzle-orm';
import { emailConst, isDel } from '../const/entity-const';

const ruleService = {

	async list(c, userId) {
		return await orm(c).select().from(mailRule)
			.where(eq(mailRule.userId, userId))
			.orderBy(desc(mailRule.ruleId)).all();
	},

	async add(c, params, userId) {
		const { name, field, op, value, actions, enabled } = params;
		const row = await orm(c).insert(mailRule).values({
			userId,
			name: name || '',
			field: field || 'sender',
			op: op || 'contains',
			value: value || '',
			actions: typeof actions === 'string' ? actions : JSON.stringify(actions || []),
			enabled: enabled === undefined ? 1 : Number(enabled),
		}).returning().get();
		return row;
	},

	async update(c, params, userId) {
		const { ruleId, name, field, op, value, actions, enabled } = params;
		const values = {};
		if (name !== undefined) values.name = name;
		if (field !== undefined) values.field = field;
		if (op !== undefined) values.op = op;
		if (value !== undefined) values.value = value;
		if (actions !== undefined) values.actions = typeof actions === 'string' ? actions : JSON.stringify(actions);
		if (enabled !== undefined) values.enabled = Number(enabled);
		await orm(c).update(mailRule).set(values)
			.where(and(eq(mailRule.ruleId, Number(ruleId)), eq(mailRule.userId, userId))).run();
	},

	async remove(c, params, userId) {
		const { ruleId } = params;
		await orm(c).delete(mailRule)
			.where(and(eq(mailRule.ruleId, Number(ruleId)), eq(mailRule.userId, userId))).run();
	},

	matchField(rule, emailRow) {
		let target = '';
		if (rule.field === 'sender') {
			target = `${emailRow.sendEmail || ''} ${emailRow.name || ''}`;
		} else if (rule.field === 'subject') {
			target = emailRow.subject || '';
		} else if (rule.field === 'content') {
			target = `${emailRow.text || ''} ${emailUtils.htmlToText(emailRow.content || '')}`;
		}
		const value = rule.value || '';
		const t = target.toLowerCase();
		const v = value.toLowerCase();
		if (rule.op === 'equals') return t.trim() === v.trim();
		if (rule.op === 'starts') return t.startsWith(v);
		return t.includes(v);
	},

	/** 收信后执行用户启用的规则 */
	async applyRules(c, emailRow) {
		if (!emailRow || !emailRow.userId) return;
		try {
			const rules = await orm(c).select().from(mailRule)
				.where(and(eq(mailRule.userId, emailRow.userId), eq(mailRule.enabled, 1))).all();
			for (const rule of rules) {
				let matched = false;
				try {
					matched = this.matchField(rule, emailRow);
				} catch (e) {
					console.error('规则匹配异常: ', e);
					continue;
				}
				if (!matched) continue;
				let actions = [];
				try {
					actions = JSON.parse(rule.actions || '[]');
				} catch (e) {
					continue;
				}
				for (const action of actions) {
					try {
						await this.execAction(c, action, emailRow);
					} catch (e) {
						console.error('规则动作执行异常: ', e);
					}
				}
			}
		} catch (e) {
			console.error('邮件规则执行异常: ', e);
		}
	},

	async execAction(c, action, emailRow) {
		const type = action.type;
		if (type === 'star') {
			const exist = await orm(c).select().from(star)
				.where(and(eq(star.userId, emailRow.userId), eq(star.emailId, emailRow.emailId))).get();
			if (!exist) {
				await orm(c).insert(star).values({ userId: emailRow.userId, emailId: emailRow.emailId }).run();
			}
		} else if (type === 'read') {
			await orm(c).update(email).set({ unread: emailConst.unread.READ })
				.where(eq(email.emailId, emailRow.emailId)).run();
		} else if (type === 'delete') {
			await orm(c).update(email).set({ isDel: isDel.DELETE })
				.where(eq(email.emailId, emailRow.emailId)).run();
		} else if (type === 'forward' && action.to) {
			await emailService.send(c, {
				accountId: emailRow.accountId,
				receiveEmail: [action.to],
				subject: 'Fwd: ' + (emailRow.subject || ''),
				content: emailRow.content || '',
				text: emailRow.text || '',
			}, emailRow.userId);
		}
	},
};

export default ruleService;
