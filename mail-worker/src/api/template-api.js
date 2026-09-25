import app from '../hono/hono';
import templateService from '../service/template-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/template/list', async (c) => {
	const data = await templateService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/template/add', async (c) => {
	const data = await templateService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/template/update', async (c) => {
	await templateService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/template/delete', async (c) => {
	await templateService.remove(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});
