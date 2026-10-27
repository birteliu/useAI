const MILKS = ['高纖', '補體素', '雙卡', '一般'];
const GAP_MS = 210 * 60000;
const DUPLICATE_MS = 2 * 60000;

export default { async fetch(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  try {
    if (!env.DB) throw fault(503, '資料庫尚未設定。');
    if (request.method !== 'GET') checkOrigin(request);
    if (url.pathname === '/api/state' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM feedings ORDER BY fed_at DESC LIMIT 100').all();
      return json(200, { version: 2, records: results.map(mapRecord), milks: MILKS,
        minGapMs: GAP_MS, serverTime: new Date().toISOString() });
    }
    if (request.method !== 'POST') throw fault(405, '不支援這個操作。');
    const body = await parseBody(request);
    let result;
    switch (url.pathname) {
      case '/api/feedings': result = await add(env.DB, body); break;
      case '/api/edit': result = await edit(env.DB, body); break;
      case '/api/void': result = await voidRecord(env.DB, body); break;
      default: throw fault(404, '找不到這個操作。');
    }
    return json(200, { result });
  } catch (error) {
    if (!error.status) console.error(error);
    return json(error.status ?? 500, { error: error.status ? error.message : '伺服器發生錯誤。', code: error.code ?? 'server_error' });
  }
} };

function checkOrigin(request) {
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) throw fault(403, '這個來源不能修改紀錄。');
}
async function parseBody(request) {
  if (Number(request.headers.get('Content-Length') ?? 0) > 20000) throw fault(413, '資料太長。');
  const raw = await request.text();
  if (raw.length > 20000) throw fault(413, '資料太長。');
  try { return JSON.parse(raw || '{}'); } catch { throw fault(400, '資料格式不正確。'); }
}
function json(status, value) {
  return new Response(JSON.stringify(value), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
  } });
}
function fault(status, message, code = 'invalid') { return Object.assign(new Error(message), { status, code }); }
function validId(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw fault(400, '紀錄編號不正確。');
  return value;
}
function validMilk(value) { if (!MILKS.includes(value)) throw fault(400, '請選擇奶品。'); return value; }
function validAmount(value) { if (!['whole', 'half'].includes(value)) throw fault(400, '請選擇一罐或半罐。'); return value; }
function validTime(value) {
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(time) || time > Date.now() + 60000) throw fault(400, '餵完時間不正確，不能填未來時間。');
  return new Date(time).toISOString();
}
function mapRecord(row) {
  return { id: row.id, milk: row.milk, amount: row.amount, fedAt: row.fed_at,
    status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, version: row.version };
}
async function one(db, id) { return db.prepare('SELECT * FROM feedings WHERE id = ?').bind(id).first(); }

async function add(db, body) {
  const id = validId(body.id);
  const existing = await one(db, id);
  if (existing) return mapRecord(existing);
  const milk = validMilk(body.milk), amount = validAmount(body.amount);
  const fedAt = body.fedAt == null ? new Date().toISOString() : validTime(body.fedAt);
  if (body.fedAt == null && body.confirmEarly !== true) {
    const last = await db.prepare("SELECT fed_at FROM feedings WHERE status='completed' ORDER BY fed_at DESC LIMIT 1").first();
    if (last && Date.parse(fedAt) < Date.parse(last.fed_at) + GAP_MS) {
      throw fault(409, '距上一餐未滿 3 小時 30 分，請先與家人確認。', 'early');
    }
  }
  const now = new Date().toISOString();
  const lower = new Date(Date.parse(fedAt) - DUPLICATE_MS).toISOString();
  const upper = new Date(Date.parse(fedAt) + DUPLICATE_MS).toISOString();
  try {
    const outcome = await db.prepare(`INSERT INTO feedings (id,milk,amount,fed_at,status,created_at,updated_at,version)
      SELECT ?,?,?,?,'completed',?,?,1
      WHERE NOT EXISTS (SELECT 1 FROM feedings WHERE status='completed' AND fed_at BETWEEN ? AND ?)`)
      .bind(id, milk, amount, fedAt, now, now, lower, upper).run();
    if (!outcome.meta.changes) throw fault(409, '這個時間附近已有餵食紀錄，請先更新畫面確認，避免重複登記。', 'duplicate');
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      const duplicate = await one(db, id);
      if (duplicate) return mapRecord(duplicate);
      throw fault(409, '這個時間附近已有餵食紀錄，請先更新畫面確認。', 'duplicate');
    }
    throw error;
  }
  return mapRecord(await one(db, id));
}

async function edit(db, body) {
  const id = validId(body.id), milk = validMilk(body.milk), amount = validAmount(body.amount), fedAt = validTime(body.fedAt);
  const version = Number(body.expectedVersion);
  if (!Number.isSafeInteger(version) || version < 1) throw fault(400, '紀錄版本不正確。');
  const before = await one(db, id);
  if (!before || before.status !== 'completed' || before.version !== version) throw fault(409, '紀錄已被更動，請更新畫面後再試。', 'conflict');
  const lower = new Date(Date.parse(fedAt) - DUPLICATE_MS).toISOString();
  const upper = new Date(Date.parse(fedAt) + DUPLICATE_MS).toISOString();
  const now = new Date().toISOString();
  const [outcome] = await db.batch([
    db.prepare(`UPDATE feedings SET milk=?,amount=?,fed_at=?,updated_at=?,version=version+1
      WHERE id=? AND status='completed' AND version=?
      AND NOT EXISTS (SELECT 1 FROM feedings other WHERE other.id<>? AND other.status='completed' AND other.fed_at BETWEEN ? AND ?)`)
      .bind(milk, amount, fedAt, now, id, version, id, lower, upper),
    db.prepare(`INSERT INTO feeding_changes (feeding_id,action,before_json,after_json,changed_at)
      SELECT ?,'edit',?,?,? WHERE changes() > 0`)
      .bind(id, JSON.stringify(mapRecord(before)), JSON.stringify({ milk, amount, fedAt }), now)
  ]);
  if (!outcome.meta.changes) throw fault(409, '紀錄已被更動，或這個時間附近已有另一筆紀錄。請更新畫面確認。', 'conflict');
  return mapRecord(await one(db, id));
}

async function voidRecord(db, body) {
  const id = validId(body.id), version = Number(body.expectedVersion);
  if (!Number.isSafeInteger(version) || version < 1) throw fault(400, '紀錄版本不正確。');
  const before = await one(db, id);
  if (!before || before.status !== 'completed' || before.version !== version) throw fault(409, '紀錄已被更動，請更新畫面後再試。', 'conflict');
  const now = new Date().toISOString();
  const [outcome] = await db.batch([
    db.prepare("UPDATE feedings SET status='voided',updated_at=?,version=version+1 WHERE id=? AND status='completed' AND version=?")
      .bind(now, id, version),
    db.prepare(`INSERT INTO feeding_changes (feeding_id,action,before_json,after_json,changed_at)
      SELECT ?,'void',?,NULL,? WHERE changes() > 0`)
      .bind(id, JSON.stringify(mapRecord(before)), now)
  ]);
  if (!outcome.meta.changes) throw fault(409, '紀錄已被更動，請更新畫面後再試。', 'conflict');
  return mapRecord(await one(db, id));
}
