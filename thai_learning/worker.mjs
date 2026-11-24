const cookie = 'thai_session';
const names = { a: '旅伴 A', b: '旅伴 B' };
const allowedAssets = new Set(['/app.js', '/lessons.js', '/styles.css']);
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body, status = 200) => Response.json(body, { status, headers });

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sessionId(account, key) {
  return digest('thai-learning-session:' + account + ':' + key);
}

function matches(a, b) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) difference |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  return difference === 0;
}

function login(message = '', status = 200) {
  const html = '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>登入泰語旅伴</title><link rel="stylesheet" href="/styles.css"><main><article class="card" style="max-width:420px;margin:8vh auto"><h1>登入泰語旅伴</h1><form method="post" action="/login"><label class="field">選擇帳號 <select name="account"><option value="a">旅伴 A</option><option value="b">旅伴 B</option></select></label><label class="field">登入金鑰<input name="key" type="password" maxlength="128" autocomplete="current-password" required></label><button class="btn primary">登入</button></form><p role="status">' + message + '</p></article></main></html>';
  return new Response(html, {status, headers: {...headers, 'Content-Type': 'text/html; charset=utf-8'}});
}

function redirect(value, maxAge) {
  return new Response(null, { status: 303, headers: {...headers, Location: '/',
    'Set-Cookie': cookie + '=' + value + '; Path=/; Max-Age=' + maxAge + '; HttpOnly; Secure; SameSite=Strict'} });
}

async function limitedBody(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  while (true) {
    const {done, value} = await reader.read();
    if (done) return body + decoder.decode();
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new RangeError('Body too large');
    }
    body += decoder.decode(value, {stream: true});
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const keys = { a: env.LEARNER_A_KEY, b: env.LEARNER_B_KEY };

    if (path === '/styles.css') return env.ASSETS.fetch(request);
    if ([keys.a, keys.b].some(key => !/^[a-f0-9]{64}$/.test(key || '')) || keys.a === keys.b) {
      return login('網站尚未設定兩組獨立的登入金鑰。', 503);
    }
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('Origin') !== url.origin) {
      return json({error: 'origin'}, 403);
    }
    if (path === '/login' && request.method === 'POST') {
      try {
        const form = new URLSearchParams(await limitedBody(request, 1024));
        const account = form.get('account');
        if (Object.hasOwn(keys, account) && matches(await digest(form.get('key') || ''), await digest(keys[account]))) {
          return redirect(account + '.' + await sessionId(account, keys[account]), 60 * 60 * 24 * 30);
        }
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
      }
      return login('帳號或登入金鑰不正確。', 401);
    }
    if (path === '/logout' && request.method === 'POST') return redirect('', 0);
    const session = request.headers.get('Cookie')?.match(/(?:^|;\s*)thai_session=([ab])\.([a-f0-9]{64})(?:;|$)/);
    const account = session?.[1];
    if (!session || !matches(session[2], await sessionId(account, keys[account]))) {
      return path.startsWith('/api/') ? json({error: 'login'}, 401) : login();
    }
    if (path === '/api/progress') {
      if (request.method === 'GET') {
        const row = await env.DB.prepare('SELECT revision, snapshot FROM progress WHERE account = ?').bind(account).first();
        return json({revision: row?.revision || 0, state: row ? JSON.parse(row.snapshot) : {name: names[account]}});
      }
      if (request.method !== 'PUT') return json({error: 'method'}, 405);
      let data;
      try {
        data = JSON.parse(await limitedBody(request, 16384));
      } catch (error) {
        return json({error: 'body'}, error instanceof RangeError ? 413 : 400);
      }
      if (!Number.isSafeInteger(data?.revision) || data.revision < 0 || !data.state ||
          !Array.isArray(data.state.done) || !Array.isArray(data.state.favorites)) {
        return json({error: 'body'}, 400);
      }
      const result = data.revision === 0
        ? await env.DB.prepare('INSERT OR IGNORE INTO progress (account, revision, snapshot) VALUES (?, 1, ?)')
            .bind(account, JSON.stringify(data.state)).run()
        : await env.DB.prepare('UPDATE progress SET revision = revision + 1, snapshot = ? WHERE account = ? AND revision = ?')
            .bind(JSON.stringify(data.state), account, data.revision).run();
      return result.meta.changes === 1 ? json({revision: data.revision + 1}) : json({error: 'conflict'}, 409);
    }
    if (allowedAssets.has(path)) return env.ASSETS.fetch(request);
    if (path !== '/' && path !== '/index.html') return new Response('Not found', {status: 404});
    const asset = await env.ASSETS.fetch(new Request(new URL('/', url), request));
    const page = new HTMLRewriter().on('head', {element(element) {
      element.append('<meta name="thai-cloud" content="' + account + '">', {html: true});
    }}).transform(asset);
    const response = new Response(page.body, page);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  },
};
