import app from '../hono/hono';
import auditService from '../service/audit-service';
import result from '../model/result';

app.get('/audit/setting', async (c) => {
	const data = await auditService.getSetting(c);
	return c.json(result.ok(data));
});

app.post('/audit/setting', async (c) => {
	await auditService.saveSetting(c, await c.req.json());
	return c.json(result.ok());
});

app.get('/audit/logs', async (c) => {
	const data = await auditService.logList(c, {
		page: c.req.query('page'),
		pageSize: c.req.query('pageSize'),
	});
	return c.json(result.ok(data));
});
