import app from '../hono/hono';
import result from '../model/result';
import unsubscribeService from '../service/unsubscribe-service';

app.get('/unsubscribe/list', async (c) => {
	const data = await unsubscribeService.list(c, c.req.query());
	return c.json(result.ok(data));
});

app.delete('/unsubscribe/remove', async (c) => {
	await unsubscribeService.remove(c, c.req.query('id'));
	return c.json(result.ok());
});

app.get('/unsubscribe/setting', async (c) => {
	const data = await unsubscribeService.getSetting(c);
	return c.json(result.ok(data));
});

app.post('/unsubscribe/setting', async (c) => {
	await unsubscribeService.saveSetting(c, await c.req.json());
	return c.json(result.ok());
});
