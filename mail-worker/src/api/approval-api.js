import app from '../hono/hono';
import approvalService from '../service/approval-service';
import result from '../model/result';

app.get('/approval/list', async (c) => {
	const data = await approvalService.list(c, {
		status: c.req.query('status'),
		page: c.req.query('page'),
		pageSize: c.req.query('pageSize'),
	});
	return c.json(result.ok(data));
});

app.get('/approval/setting', async (c) => {
	const data = await approvalService.getSetting(c);
	return c.json(result.ok(data));
});

app.post('/approval/setting', async (c) => {
	await approvalService.saveSetting(c, await c.req.json());
	return c.json(result.ok());
});

app.post('/approval/approve', async (c) => {
	const { id } = await c.req.json();
	await approvalService.approve(c, id);
	return c.json(result.ok());
});

app.post('/approval/reject', async (c) => {
	const { id, reason } = await c.req.json();
	await approvalService.reject(c, id, reason);
	return c.json(result.ok());
});
