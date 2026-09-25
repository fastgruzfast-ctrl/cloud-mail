import app from '../hono/hono';
import aiService from '../service/ai-service';
import emailService from '../service/email-service';
import userContext from '../security/user-context';
import result from '../model/result';
import BizError from '../error/biz-error';

async function getOwnedEmail(c, emailId) {
	const emailRow = await emailService.selectById(c, emailId);
	if (!emailRow || emailRow.userId !== userContext.getUserId(c)) {
		throw new BizError('邮件不存在');
	}
	return emailRow;
}

app.get('/ai/summary', async (c) => {
	const query = c.req.query();
	const emailRow = await getOwnedEmail(c, query.emailId);
	const data = await aiService.summarize(c, emailRow);
	return c.json(result.ok(data));
});

app.get('/ai/translate', async (c) => {
	const query = c.req.query();
	const emailRow = await getOwnedEmail(c, query.emailId);
	const data = await aiService.translate(c, emailRow, query.lang || 'zh');
	return c.json(result.ok(data));
});
