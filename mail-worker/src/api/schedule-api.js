import app from '../hono/hono';
import scheduleService from '../service/schedule-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/schedule/list', async (c) => {
	const data = await scheduleService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/schedule/add', async (c) => {
	const data = await scheduleService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.delete('/schedule/cancel', async (c) => {
	await scheduleService.cancel(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});
