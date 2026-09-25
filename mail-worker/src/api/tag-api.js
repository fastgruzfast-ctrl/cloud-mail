import app from '../hono/hono';
import tagService from '../service/tag-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/tag/list', async (c) => {
	const data = await tagService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/tag/add', async (c) => {
	const data = await tagService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/tag/update', async (c) => {
	await tagService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/tag/delete', async (c) => {
	await tagService.remove(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.post('/tag/assign', async (c) => {
	await tagService.assign(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.post('/tag/unassign', async (c) => {
	await tagService.unassign(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/tag/emailTags', async (c) => {
	const data = await tagService.emailTags(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});
