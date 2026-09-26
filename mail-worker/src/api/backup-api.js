import app from '../hono/hono';
import backupService from '../service/backup-service';
import result from '../model/result';

app.get('/backup/list', async (c) => {
	const data = await backupService.list(c);
	return c.json(result.ok(data));
});

app.post('/backup/run', async (c) => {
	const data = await backupService.run(c.env);
	return c.json(result.ok(data));
});

app.get('/backup/download', async (c) => {
	return await backupService.download(c, c.req.query('backupId'));
});

app.delete('/backup/remove', async (c) => {
	await backupService.remove(c, c.req.query('backupId'));
	return c.json(result.ok());
});

app.post('/backup/setting', async (c) => {
	await backupService.saveSetting(c, await c.req.json());
	return c.json(result.ok());
});
