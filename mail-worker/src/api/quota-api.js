import app from '../hono/hono';
import quotaService from '../service/quota-service';
import result from '../model/result';

app.get('/quota/list', async (c) => {
	const data = await quotaService.getQuotas(c);
	return c.json(result.ok(data));
});

app.post('/quota/save', async (c) => {
	await quotaService.saveQuota(c, await c.req.json());
	return c.json(result.ok());
});

app.post('/quota/setting', async (c) => {
	await quotaService.saveSetting(c, await c.req.json());
	return c.json(result.ok());
});

app.delete('/quota/remove', async (c) => {
	await quotaService.removeQuota(c, c.req.query('domain'));
	return c.json(result.ok());
});
