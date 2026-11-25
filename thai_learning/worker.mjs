const pagesOrigin = 'https://birteliu.github.io';
const names = { a: '旅伴 A', b: '旅伴 B' };
const allowedAssets = new Set(['/app.js', '/lessons.js', '/styles.css']);
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body, status = 200) => Response.json(body, { status, headers });

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
      'Access-Control-Allow-Headers': 'Content-Type',
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
  if (path === '/connect' && request.method === 'GET') {
    return Response.redirect(pagesOrigin + '/useAI/thai_learning/', 303);
  }
  if (path === '/api/progress') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin && !fromPages) return json({error: 'origin'}, 403);
    if (request.method === 'PUT' && !fromPages && origin !== url.origin) return json({error: 'origin'}, 403);
    const account = url.searchParams.get('account');
    if (!Object.hasOwn(names, account)) return json({error: 'account'}, 400);
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
    element.append('<meta name="thai-cloud" content="profiles">', {html: true});
  }}).transform(asset);
  const response = new Response(page.body, page);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
