import app from '../hono/hono';
import result from '../model/result';
import userContext from '../security/user-context';
import delayedService from '../service/delayed-service';

app.post('/delayed/cancel', async (c) => {
	await delayedService.cancel(c, (await c.req.json()).id, userContext.getUserId(c));
	return c.json(result.ok());
});
