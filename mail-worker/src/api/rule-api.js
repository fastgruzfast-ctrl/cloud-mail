import app from '../hono/hono';
import ruleService from '../service/rule-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/rule/list', async (c) => {
	const data = await ruleService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/rule/add', async (c) => {
	const data = await ruleService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/rule/update', async (c) => {
	await ruleService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/rule/delete', async (c) => {
	await ruleService.remove(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});
