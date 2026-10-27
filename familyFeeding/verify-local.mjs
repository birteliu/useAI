import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const base = process.env.FEEDING_TEST_URL ?? 'http://127.0.0.1:8788';

async function call(path, body) {
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', Origin: base },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

const page = await fetch(base);
assert.equal(page.status, 200);
assert.match(await page.text(), /爸爸的餵食紀錄/);
const before = await call('/api/state');
assert.equal(before.status, 200);
assert.equal(before.body.version, 2);

const past = new Date(Date.now() - 8 * 3600000).toISOString();
const firstInput = { id: crypto.randomUUID(), milk: '高纖', amount: 'half', fedAt: past };
const first = await call('/api/feedings', firstInput);
assert.equal(first.status, 200);
assert.equal(first.body.result.amount, 'half');
assert.equal((await call('/api/feedings', firstInput)).body.result.id, first.body.result.id, '重試不可新增第二筆');

const duplicate = await call('/api/feedings', { id: crypto.randomUUID(), milk: '一般', amount: 'whole', fedAt: past });
assert.equal(duplicate.status, 409, '同時間不得重複登記');
assert.equal(duplicate.body.code, 'duplicate');

const concurrent = await Promise.all([
  call('/api/feedings', { id: crypto.randomUUID(), milk: '一般', amount: 'whole', confirmEarly: true }),
  call('/api/feedings', { id: crypto.randomUUID(), milk: '雙卡', amount: 'half', confirmEarly: true })
]);
assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409], '同時登記只能成功一筆');
const current = concurrent.find(r => r.status === 200).body.result;
const early = await call('/api/feedings', { id: crypto.randomUUID(), milk: '一般', amount: 'whole' });
assert.equal(early.status, 409);
assert.equal(early.body.code, 'early');

const corrected = await call('/api/edit', { id: first.body.result.id, expectedVersion: first.body.result.version,
  milk: '補體素', amount: 'whole', fedAt: past });
assert.equal(corrected.status, 200);
assert.equal(corrected.body.result.milk, '補體素');
assert.equal(corrected.body.result.amount, 'whole');
assert.equal((await call('/api/edit', { id: first.body.result.id, expectedVersion: first.body.result.version,
  milk: '一般', amount: 'half', fedAt: past })).status, 409, '過期版本不可覆蓋更正');
const voided = await call('/api/void', { id: first.body.result.id, expectedVersion: corrected.body.result.version });
assert.equal(voided.status, 200);
assert.equal(voided.body.result.status, 'voided');

const after = await call('/api/state');
assert.equal(after.status, 200);
assert.equal(after.body.records.some(r => r.id === current.id && r.status === 'completed'), true);
assert.equal(after.body.records.some(r => r.id === voided.body.result.id && r.status === 'voided'), true);
console.log('整合測試通過：免登入、半罐、重試與同時登記去重、間隔提醒、更正衝突、作廢。');
