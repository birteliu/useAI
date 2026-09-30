const $ = id => document.getElementById(id);
const milks = ['高纖', '補體素', '雙卡', '一般'];
const amountLabel = amount => amount === 'half' ? '半罐' : '一罐';
let state = null;
let editing = null;
let requestId = null;
let busy = false;
let serverClockOffset = 0;

function showNotice(message, error = false) {
  const box = $('notice');
  box.textContent = message;
  box.classList.toggle('error', error);
  box.hidden = false;
}
function clearNotice() { $('notice').hidden = true; }
function dateTime(iso) {
  return new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}
function timeOnly(iso) {
  return new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}
function localInput(iso) {
  const d = new Date(iso), pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function inputIso(id) {
  const d = new Date($(id).value);
  if (!Number.isFinite(d.getTime())) throw new Error('請輸入正確的餵完時間。');
  return d.toISOString();
}
function sameDay(iso) { return new Date(iso).toDateString() === new Date().toDateString(); }
function completed() {
  return [...state.records].filter(r => r.status === 'completed')
    .sort((a, b) => Date.parse(b.fedAt) - Date.parse(a.fedAt));
}

async function api(path, data) {
  const options = data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
  let response;
  try { response = await fetch(`/api/${path}`, { cache: 'no-store', ...options }); }
  catch { throw new Error('無法連線，尚未確認紀錄是否儲存。請更新畫面後確認。'); }
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || '操作失敗。');
    error.code = result.code; error.status = response.status;
    throw error;
  }
  return result;
}

async function refresh(silent = false) {
  try {
    state = await api('state');
    serverClockOffset = Date.parse(state.serverTime) - Date.now();
    $('appPanel').hidden = false;
    render();
    $('syncStatus').textContent = `已同步 ${timeOnly(new Date().toISOString())}`;
    if (!silent) clearNotice();
  } catch (error) {
    $('syncStatus').textContent = '同步失敗，請勿依舊畫面判斷';
    showNotice(error.message, true);
  }
}

function render() {
  const records = completed(), last = records[0];
  if (last) {
    const earliest = new Date(Date.parse(last.fedAt) + state.minGapMs);
    $('earliest').textContent = sameDay(earliest.toISOString()) ? timeOnly(earliest.toISOString()) : dateTime(earliest.toISOString());
    const remaining = earliest.getTime() - (Date.now() + serverClockOffset);
    $('countdown').textContent = remaining > 0
      ? `上一餐 ${timeOnly(last.fedAt)}；還需等待約 ${Math.ceil(remaining / 60000)} 分鐘`
      : `上一餐 ${timeOnly(last.fedAt)}；已滿 3 小時 30 分`;
    $('lastDate').textContent = dateTime(last.fedAt);
    $('lastRecord').textContent = `${last.milk} · ${amountLabel(last.amount)}`;
  } else {
    $('earliest').textContent = '尚無紀錄';
    $('countdown').textContent = '記錄第一餐後會顯示下一餐參考時間';
    $('lastDate').textContent = '';
    $('lastRecord').textContent = '尚無餵食紀錄';
  }

  const today = records.filter(r => sameDay(r.fedAt));
  $('todayTotal').textContent = `${today.length} 餐`;
  $('milkCounts').replaceChildren();
  for (const milk of milks) {
    const tile = document.createElement('div'); tile.className = 'milk-tile';
    const count = document.createElement('strong'); count.textContent = String(today.filter(r => r.milk === milk).length);
    const label = document.createElement('span'); label.textContent = `${milk} · 次`;
    tile.append(count, label); $('milkCounts').append(tile);
  }

  $('historyList').replaceChildren();
  const history = [...state.records].sort((a, b) => Date.parse(b.fedAt) - Date.parse(a.fedAt)).slice(0, 30);
  if (!history.length) {
    const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = '還沒有餵食紀錄。';
    $('historyList').append(empty);
  }
  for (const record of history) {
    const row = document.createElement('div'); row.className = 'history-item';
    const info = document.createElement('div'); info.className = 'history-main';
    const title = document.createElement('strong');
    title.textContent = `${record.milk} · ${amountLabel(record.amount)}${record.status === 'voided' ? ' · 已作廢' : ''}`;
    const detail = document.createElement('small'); detail.textContent = dateTime(record.fedAt);
    info.append(title, detail); row.append(info);
    if (record.status === 'completed') {
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'text-button'; edit.textContent = '更正';
      edit.addEventListener('click', () => openRecord(record)); row.append(edit);
    }
    $('historyList').append(row);
  }
}

function openEntry() {
  requestId = crypto.randomUUID();
  $('milkChoices').replaceChildren();
  const today = completed().filter(r => sameDay(r.fedAt));
  for (const milk of milks) {
    const label = document.createElement('label'), radio = document.createElement('input');
    radio.type = 'radio'; radio.name = 'milk'; radio.value = milk; radio.required = true;
    const copy = document.createElement('span');
    const name = document.createElement('strong'); name.textContent = milk;
    const count = document.createElement('small'); count.textContent = `今天 ${today.filter(r => r.milk === milk).length} 次`;
    copy.append(name, count);
    label.append(radio, copy);
    $('milkChoices').append(label);
  }
  document.querySelector('input[name="amount"][value="whole"]').checked = true;
  $('entryDialog').showModal();
}
function openRecord(record = null) {
  editing = record;
  requestId = record ? null : crypto.randomUUID();
  $('recordTitle').textContent = record ? '更正紀錄' : '補記餵食';
  $('recordSubmit').textContent = record ? '儲存更正' : '儲存補記';
  $('voidRecord').hidden = !record;
  $('recordMilk').value = record?.milk ?? '高纖';
  $('recordAmount').value = record?.amount ?? 'whole';
  $('recordTime').value = localInput(record?.fedAt ?? new Date().toISOString());
  $('recordDialog').showModal();
}

async function perform(action) {
  if (busy) return;
  busy = true;
  try {
    const saved = await action();
    if (saved === false) return;
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    await refresh();
  } catch (error) {
    showNotice(error.message, true);
    if (error.status === 409) await refresh(true);
  } finally { busy = false; }
}

$('refresh').addEventListener('click', () => refresh());
$('addButton').addEventListener('click', openEntry);
$('backfillButton').addEventListener('click', () => openRecord());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
$('entryForm').addEventListener('submit', event => {
  event.preventDefault();
  const milk = document.querySelector('input[name="milk"]:checked')?.value;
  const amount = document.querySelector('input[name="amount"]:checked')?.value;
  if (!milk || !amount) { showNotice('請選擇奶品和罐數。', true); return; }
  perform(async () => {
    try { await api('feedings', { id: requestId, milk, amount }); }
    catch (error) {
      if (error.code !== 'early') throw error;
      if (!window.confirm(`${error.message}\n\n如果已依照護安排確認現在要餵，按「確定」保留真實紀錄。`)) return false;
      await api('feedings', { id: requestId, milk, amount, confirmEarly: true });
    }
    return true;
  });
});
$('recordForm').addEventListener('submit', event => {
  event.preventDefault();
  perform(async () => {
    const payload = { milk: $('recordMilk').value, amount: $('recordAmount').value, fedAt: inputIso('recordTime') };
    if (editing) await api('edit', { id: editing.id, expectedVersion: editing.version, ...payload });
    else await api('feedings', { id: requestId, ...payload });
    return true;
  });
});
$('voidRecord').addEventListener('click', () => {
  if (editing && window.confirm('確認作廢這筆紀錄？它會從餐數和時間計算中排除。')) {
    perform(() => api('void', { id: editing.id, expectedVersion: editing.version }));
  }
});

refresh(true);
setInterval(() => { if (state && !document.hidden) refresh(true); }, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(true); });
