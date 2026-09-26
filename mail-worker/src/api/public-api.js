import app from '../hono/hono';
import result from '../model/result';
import publicService from '../service/public-service';
import unsubscribeService from '../service/unsubscribe-service';

app.post('/public/genToken', async (c) => {
	const data = await publicService.genToken(c, await c.req.json());
	return c.json(result.ok(data));
});

app.post('/public/emailList', async (c) => {
	const list = await publicService.emailList(c, await c.req.json());
	return c.json(result.ok(list));
});

app.post('/public/addUser', async (c) => {
	await publicService.addUser(c, await c.req.json());
	return c.json(result.ok());
});

/** 退订确认页（公开，无需登录；token 只取 hex 字符防 XSS） */
app.get('/public/unsubscribe', async (c) => {
	const token = String(c.req.query('token') || '').replace(/[^a-zA-Z0-9]/g, '');
	const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>退订 / Unsubscribe</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;color:#333}.card{background:#fff;border-radius:12px;padding:32px;max-width:420px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.08)}.card h2{margin:0 0 8px;font-size:20px}.card p{color:#888;font-size:14px;margin:0 0 24px}.card button{background:#e5484d;color:#fff;border:0;border-radius:8px;padding:10px 32px;font-size:15px;cursor:pointer}.card button:disabled{background:#ccc;cursor:default}#msg{margin-top:16px;font-size:14px;min-height:20px}</style>
</head><body><div class="card">
<h2>确认退订该邮箱吗？</h2>
<p>Are you sure you want to unsubscribe this email address?</p>
<button id="btn" onclick="confirmUnsub()">确认退订 / Confirm</button>
<div id="msg"></div>
</div><script>
const token = ${JSON.stringify(token)};
function confirmUnsub(){
  const btn = document.getElementById('btn');
  btn.disabled = true;
  fetch('/api/public/unsubscribe/confirm', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({token})
  }).then(r => r.json()).then(d => {
    document.getElementById('msg').textContent = d.code === 200 ? '退订成功 / Unsubscribed' : ('失败: ' + (d.message || ''));
  }).catch(() => {
    document.getElementById('msg').textContent = '请求失败 / Request failed';
    btn.disabled = false;
  });
}
</script></body></html>`;
	return c.html(html);
});

/** 退订确认提交（公开，无需登录；兼容 JSON body 与一键退订 POST） */
app.post('/public/unsubscribe/confirm', async (c) => {
	let token = c.req.query('token') || '';
	if (!token) {
		try {
			token = (await c.req.json()).token || '';
		} catch (e) { /* 一键退订的表单体没有 JSON，忽略 */ }
	}
	await unsubscribeService.unsubscribeByToken(c, token);
	return c.json(result.ok());
});
