import app from '../hono/hono';
import deliveryService from '../service/delivery-service';
import result from '../model/result';

app.get('/delivery/stats', async (c) => {
	const data = await deliveryService.stats(c, c.req.query());
	return c.json(result.ok(data));
});

app.get('/delivery/bounces', async (c) => {
	const data = await deliveryService.bounceList(c, c.req.query());
	return c.json(result.ok(data));
});
