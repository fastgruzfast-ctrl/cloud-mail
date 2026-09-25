import app from '../hono/hono';
import contactService from '../service/contact-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/contact/list', async (c) => {
	const data = await contactService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/contact/add', async (c) => {
	const data = await contactService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/contact/update', async (c) => {
	await contactService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/contact/delete', async (c) => {
	await contactService.remove(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/contact/search', async (c) => {
	const data = await contactService.search(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});
