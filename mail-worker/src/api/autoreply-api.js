import app from '../hono/hono';
import autoreplyService from '../service/autoreply-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/autoreply/get', async (c) => {
	const data = await autoreplyService.get(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/autoreply/save', async (c) => {
	await autoreplyService.save(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});
