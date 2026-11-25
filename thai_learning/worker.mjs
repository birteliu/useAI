const cookie = 'thai_session';
const pagesOrigin = 'https://birteliu.github.io';
const pagesUrl = pagesOrigin + '/useAI/thai_learning/';
const tokenLifetime = 8 * 60 * 60;
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

async function pagesSignature(account, expires, key) {
  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', signingKey, encoder.encode('thai-pages:' + account + ':' + expires));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function pagesAccount(request, keys) {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([ab])\.([0-9]{10})\.([a-f0-9]{64})$/);
  if (!token || Number(token[2]) <= Math.floor(Date.now() / 1000)) return null;
  return matches(token[3], await pagesSignature(token[1], token[2], keys[token[1]])) ? token[1] : null;
}

function login(message = '', status = 200, action = '/login') {
  const html = '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>登入泰語旅伴</title><link rel="stylesheet" href="/styles.css"><main><article class="card" style="max-width:420px;margin:8vh auto"><h1>登入泰語旅伴</h1><form method="post" action="' + action + '"><label class="field">選擇帳號 <select name="account"><option value="a">旅伴 A</option><option value="b">旅伴 B</option></select></label><label class="field">登入金鑰<input name="key" type="password" maxlength="128" autocomplete="current-password" required></label><button class="btn primary">登入</button></form><p role="status">' + message + '</p></article></main></html>';
  return new Response(html, {status, headers: {...headers, 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'same-origin', 'Content-Security-Policy': "frame-ancestors 'none'; form-action 'self'"}});
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
    const path = new URL(request.url).pathname;
    if (path !== '/api/progress' || request.headers.get('Origin') !== pagesOrigin) {
      return handleRequest(request, env);
    }
    const cors = {
      ...headers,
      'Access-Control-Allow-Origin': pagesOrigin,
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors});
    let result;
    try {
      result = await handleRequest(request, env, true);
    } catch {
      result = json({error: 'service'}, 500);
    }
    const response = new Response(result.body, result);
    for (const [name, value] of Object.entries(cors)) response.headers.set(name, value);
    return response;
  },
};

async function handleRequest(request, env, fromPages = false) {
  const url = new URL(request.url);
  const path = url.pathname;
  const keys = { a: env.LEARNER_A_KEY, b: env.LEARNER_B_KEY };

  if (path === '/styles.css') return env.ASSETS.fetch(request);
  if ([keys.a, keys.b].some(key => !/^[a-f0-9]{64}$/.test(key || '')) || keys.a === keys.b) {
    return path.startsWith('/api/') ? json({error: 'setup'}, 503)
      : login('網站尚未設定兩組獨立的登入金鑰。', 503, path === '/connect' ? '/connect' : '/login');
  }
  if (!fromPages && !['GET', 'HEAD'].includes(request.method) && request.headers.get('Origin') !== url.origin) {
    return json({error: 'origin'}, 403);
  }
  if (path === '/connect' && request.method === 'GET') return login('', 200, '/connect');
  if ((path === '/login' || path === '/connect') && request.method === 'POST') {
    try {
      const form = new URLSearchParams(await limitedBody(request, 1024));
      const account = form.get('account');
      if (Object.hasOwn(keys, account) && matches(await digest(form.get('key') || ''), await digest(keys[account]))) {
        if (path === '/connect') {
          const expires = String(Math.floor(Date.now() / 1000) + tokenLifetime);
          const token = account + '.' + expires + '.' + await pagesSignature(account, expires, keys[account]);
          return new Response(null, {status: 303, headers: {...headers, 'Referrer-Policy': 'no-referrer',
            Location: pagesUrl + '#cloud-session=' + token}});
        }
        return redirect(account + '.' + await sessionId(account, keys[account]), 60 * 60 * 24 * 30);
      }
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
    return login('帳號或登入金鑰不正確。', 401, path);
  }
  if (path === '/logout' && request.method === 'POST') return redirect('', 0);
  const session = request.headers.get('Cookie')?.match(/(?:^|;\s*)thai_session=([ab])\.([a-f0-9]{64})(?:;|$)/);
  const account = fromPages
    ? await pagesAccount(request, keys)
    : session && matches(session[2], await sessionId(session[1], keys[session[1]])) ? session[1] : null;
  if (!account) {
    return path.startsWith('/api/') ? json({error: 'login'}, 401) : login();
  }
  if (path === '/api/progress') {
    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT revision, snapshot FROM progress WHERE account = ?').bind(account).first();
      return json({account, revision: row?.revision || 0, state: row ? JSON.parse(row.snapshot) : {name: names[account]}});
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
}
