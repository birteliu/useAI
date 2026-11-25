const $=s=>document.querySelector(s),lessons=window.LESSONS,KEY='thai-together-v1';
function allPhrases(){return lessons.flatMap(l=>l.phrases.map(p=>({...p,category:l.category,day:l.day})));}
function validate(s) {
  const done = Array.isArray(s.done)
    ? [...new Set(s.done.filter(day => Number.isInteger(day) && day >= 1 && day <= lessons.length))]
    : [];
  const completedAt = {};
  for (const day of done) {
    const timestamp = s.completedAt?.[day];
    if (typeof timestamp === 'string' && Number.isFinite(Date.parse(timestamp))) {
      completedAt[day] = new Date(timestamp).toISOString();
    }
  }
  const phraseIds = new Set(allPhrases().map(phrase => phrase.id));
  return {
    name: typeof s.name === 'string' ? s.name.slice(0, 30) : '我的旅程',
    done,
    completedAt,
    favorites: Array.isArray(s.favorites) ? s.favorites.filter(id => phraseIds.has(id)) : [],
    mastery: s.mastery && typeof s.mastery === 'object'
      ? Object.fromEntries(Object.entries(s.mastery).filter(([id, value]) => phraseIds.has(id) && ['again', 'ok'].includes(value)))
      : {},
  };
}
const pagesMode = location.origin === 'https://birteliu.github.io' &&
  ['/useAI/thai_learning/', '/useAI/thai_learning/index.html'].includes(location.pathname);
const workerOrigin = 'https://thai-learning.family-feeding-web.workers.dev';
const cloudProfileKey = 'thai-learning:cloud-profile';
const useCloud = pagesMode || Boolean(document.querySelector('meta[name="thai-cloud"]'));
let selectedProfile = '';

function setCloudProfile(profile) {
  selectedProfile = profile;
  try {
    if (profile) sessionStorage.setItem(cloudProfileKey, profile);
    else sessionStorage.removeItem(cloudProfileKey);
  } catch {}
}

function restoreCloudProfile() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.has('cloud-session')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  try {
    sessionStorage.removeItem('thai-learning:cloud-session');
    const profile = sessionStorage.getItem(cloudProfileKey);
    if (profile === 'a' || profile === 'b') selectedProfile = profile;
  } catch {}
}

function cloudRequest(options = {}) {
  const endpoint = (pagesMode ? workerOrigin : '') + '/api/progress?account=' + selectedProfile;
  return fetch(endpoint, {...options, credentials: 'omit', redirect: 'error'});
}

function renderCloudProfiles() {
  $('#app').innerHTML = `<section class="card">
    <h1>選擇你的旅伴身分</h1>
    <p>選擇 A 或 B，繼續各自的學習進度。</p>
    <div class="actions">
      <button class="btn primary" data-action="select-profile" data-profile="a">旅伴 A</button>
      <button class="btn primary" data-action="select-profile" data-profile="b">旅伴 B</button>
    </div>
    <p class="note">知道網站網址的人都可以查看或修改這兩份紀錄。</p>
    <button class="btn small" data-action="export-offline">匯出這個瀏覽器的舊進度</button>
  </section>`;
}
let cloudReady = false;
let revision = 0;
let pendingSnapshot = null;
let syncing = false;

async function loadCloud() {
  if (cloudReady || !useCloud) return;
  if (!selectedProfile) return renderCloudProfiles();
  const app = $('#app');
  app.innerHTML = '<p role="status">正在讀取學習紀錄…</p>';
  try {
    const response = await cloudRequest({cache: 'no-store'});
    if (!response.ok) throw new Error('Unable to load progress');
    const data = await response.json();
    if (data.account !== selectedProfile) throw new Error('Unexpected profile');
    revision = data.revision;
    state = {...validate(data.state), friend: data.state.friend ? validate(data.state.friend) : null};
    current = nextDay();
    cloudReady = true;
    const profile = document.createElement('div');
    profile.className = 'cloud-profile';
    const accountName = selectedProfile === 'a' ? '旅伴 A' : '旅伴 B';
    profile.innerHTML = '<strong>' + accountName + '</strong><span id="cloud-status" role="status">已同步</span><button class="btn small" data-action="retry-cloud" hidden>重試同步</button><button class="btn small" data-action="reload-cloud" hidden>重讀雲端紀錄</button><button class="btn small" data-action="switch-profile">切換身分</button>';
    app.before(profile);
    render();
  } catch {
    app.innerHTML = '<div class="card"><p role="status">目前無法讀取雲端紀錄。</p><div class="actions"><button class="btn" data-action="load-cloud">再試一次</button><button class="btn" data-action="switch-profile">切換身分</button></div></div>';
  }
}

function cloudStatus(message, action = '') {
  $('#cloud-status').textContent = message;
  $('[data-action="retry-cloud"]').hidden = action !== 'retry';
  $('[data-action="reload-cloud"]').hidden = action !== 'reload';
}

async function syncCloud() {
  if (syncing || !pendingSnapshot) return;
  syncing = true;
  cloudStatus('同步中…');
  try {
    while (pendingSnapshot) {
      const snapshot = pendingSnapshot;
      const response = await cloudRequest({
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({revision, state: snapshot}),
      });
      if (response.status === 409) {
        cloudStatus('另一台裝置已更新。請先到學習護照匯出本次紀錄，再重讀雲端。', 'reload');
        return;
      }
      if (!response.ok) throw new Error('Unable to save progress');
      revision = (await response.json()).revision;
      if (pendingSnapshot === snapshot) pendingSnapshot = null;
    }
    cloudStatus('已同步');
  } catch {
    cloudStatus('尚未同步，請重試或匯出備份。', 'retry');
  } finally {
    syncing = false;
  }
}

if (useCloud) {
  window.addEventListener('beforeunload', event => {
    if (pendingSnapshot) event.preventDefault();
  });
}

let state={...validate({}),friend:null},persisted=true;try{const s=useCloud?null:JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')state={...validate(s),friend:s.friend&&typeof s.friend==='object'?validate(s.friend):null};}catch(e){persisted=false;}
let current=lessons.find(l=>!state.done.includes(l.day))?.day||30,filter='全部',search='',quizAnswers={},quizChecked=false,roleSwap=false,hints=true,timer=null,timerEnd=0,remaining=600;
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}function save(){
  if (useCloud) {
    pendingSnapshot = {...validate(state), friend: state.friend};
    void syncCloud();
    return;
  }
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){persisted=false;toast('無法保存，請匯出進度備份。');}}function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>$('#toast').style.display='none',4000);}function nextDay(){return lessons.find(l=>!state.done.includes(l.day))?.day||30;}
const reviewPhraseIds = {
  7: ['1-0', '3-0', '3-1', '4-0', '4-1', '1-1'],
  14: ['8-0', '9-1', '10-2', '11-1', '13-0', '1-1'],
  21: ['18-0', '15-0', '17-0', '20-0', '20-1'],
  28: ['23-0', '23-1', '25-0', '25-1', '22-2', '27-2'],
  29: ['8-0', '10-2', '13-0', '15-0', '16-3', '20-0'],
  30: ['9-1', '11-1', '17-0', '19-0', '20-0', '20-1'],
};
function displayPhrases(lesson) {
  const ids = reviewPhraseIds[lesson.day];
  return ids ? ids.map(findPhrase) : lesson.phrases;
}
function findPhrase(id){return allPhrases().find(p=>p.id===id);}
let thaiVoices=[];function loadVoices(){thaiVoices=window.speechSynthesis?.getVoices().filter(v=>/^th(-|$)/i.test(v.lang))||[];}if(window.speechSynthesis){loadVoices();window.speechSynthesis.addEventListener('voiceschanged',loadVoices);}
function speak(id,slow){const p=findPhrase(id),s=window.speechSynthesis;if(!p)return;if(!s){toast('此瀏覽器不支援語音播放。');return;}loadVoices();if(!thaiVoices.length){toast('此裝置尚無泰語語音。請先在系統安裝泰語語音，再重新開啟。');return;}s.cancel();const u=new SpeechSynthesisUtterance(p.th);u.lang='th-TH';u.voice=thaiVoices[0];u.rate=slow?.7:1;u.onerror=()=>toast('語音未能播放，請確認裝置語音設定。');s.speak(u);}
const art=`<div class="hero-art" aria-hidden="true"><span class="art-label">LET’S GO<br>THAILAND</span><svg viewBox="0 0 560 230" fill="none"><circle cx="400" cy="69" r="36" fill="#e0a477"/><path d="M0 210Q100 165 220 202T560 188V230H0Z" fill="#b6c6a5"/><path d="M70 230V147h98v83M81 148l38-49 38 49M94 128l25-55 26 55M111 92l8-51 8 51" fill="#346554"/><path d="M194 230v-72h128v72M184 159l74-61 74 61H184ZM205 125l53-45 53 45H205Zm37-35 16-44 16 44" fill="#5f8064"/><path d="M224 230v-50h22v50m25 0v-50h22v50" fill="#e5ebdd"/><path d="M420 230v-80m0 22q-48-56-78-14 47-13 78 14Zm0 0q40-68 78-30-47-3-78 30Zm0-2q-12-70-48-60 35 19 48 60Zm0 0q10-66 44-62-30 24-44 62Z" fill="#346554"/><path d="M0 226h560" stroke="#184e43" stroke-width="3"/><path d="m40 60 28-8-10 19-6-12-12 1Z" fill="#f7f5ed"/></svg></div>`;
function heading(k,t,d){return `<p class="eyebrow">${k}</p><h1>${t}</h1><p class="muted">${d}</p>`;}function phraseCard(p){return `<div class="phrase"><div class="phrase-line"><div><div class="thai" lang="th">${esc(p.th)}</div><div class="roman">${esc(p.roman)}</div></div><button class="star" data-action="favorite" data-id="${p.id}" aria-label="${state.favorites.includes(p.id)?'取消收藏':'收藏'}${esc(p.zh)}" aria-pressed="${state.favorites.includes(p.id)}">${state.favorites.includes(p.id)?'★':'☆'}</button></div><p class="translation">${esc(p.zh)}</p><div class="actions"><button class="btn small" data-action="speak" data-id="${p.id}">▷ 聽發音</button><button class="btn small" data-action="slow" data-id="${p.id}">慢速</button><button class="btn small" data-action="master" data-id="${p.id}" data-value="again" aria-pressed="${state.mastery[p.id]==='again'}">${state.mastery[p.id]==='again'?'● ':''}再練一次</button><button class="btn small" data-action="master" data-id="${p.id}" data-value="ok" aria-pressed="${state.mastery[p.id]==='ok'}">${state.mastery[p.id]==='ok'?'✓ ':''}我會了</button></div></div>`;}
function dayLink(n){return '#today/'+n;}let activeQuiz = null;
function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function quizData(phrases) {
  if (activeQuiz?.day === current) return activeQuiz.questions;
  const pool = allPhrases();
  const questions = shuffle(phrases).slice(0, 2).map(p => {
    const category = pool.find(candidate => candidate.id === p.id).category;
    const alternatives = new Set();
    for (const candidate of shuffle(pool).sort((a, b) =>
      Number(b.category === category) - Number(a.category === category)
    )) {
      if (candidate.zh !== p.zh) alternatives.add(candidate.zh);
      if (alternatives.size === 2) break;
    }
    return {p, options: shuffle([p.zh, ...alternatives])};
  });
  activeQuiz = {day: current, questions};
  return questions;
}
function quizMarkup(ps){return quizData(ps).map((q,i)=>`<div><p>${i+1}. <span lang="th" class="thai" style="font-size:24px">${q.p.th}</span> 是什麼意思？</p>${q.options.map(o=>`<button class="btn quiz-option ${quizAnswers[i]===o?'chosen':''}" data-action="answer" data-index="${i}" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}</div>`).join('')+`<button class="btn" data-action="check" style="margin-top:15px">確認答案</button>${quizChecked?`<p class="feedback" role="status">${quizData(ps).every((q,i)=>quizAnswers[i]===q.p.zh)?'✓ 兩題都答對了！可以完成今天的學習。':'再試一次，看看上方的意思，也可以重新聽一遍。'}</p>`:''}`;}
function today(){const l=lessons[current-1],ps=displayPhrases(l);return `<section class="hero"><div class="hero-copy"><p class="eyebrow">A LITTLE THAI, EVERY DAY</p><h1>每天十分鐘，<br>離泰國更近一點。</h1><p>不用一次學很多。今天和旅伴一起，<br>帶走幾句旅行真正用得上的泰語。</p></div>${art}</section><div class="grid"><section><article class="card"><div class="lesson-top"><span class="pill orange">DAY ${String(current).padStart(2,'0')} / 30</span><span class="muted">今日主題 · ${l.category}</span></div><h2>${l.title}</h2><div class="steps"><span>1′ 複習</span><span>2′ 聽讀</span><span>2′ 換詞</span><span>1′ 常識</span><span>3′ 對話</span><span>1′ 測驗</span></div>${current>1?`<details><summary>暖身：回想之前學過的句子</summary>${displayPhrases(lessons[current-2]).slice(0,2).map(p=>`<p><span lang="th">${p.th}</span> · ${p.zh} <button class="btn small" data-action="speak" data-id="${p.id}">聽</button></p>`).join('')}</details>`:''}${ps.map(phraseCard).join('')}<p class="note">轉寫為簡化讀音提示，未完整標示聲調與母音長短，請以泰語聲音為主。播放使用裝置內建泰語語音，並非真人錄音。</p>${current===1?'<div class="feedback">禮貌句尾：常見男性形式 ครับ；女性形式陳述句 ค่ะ、問句 คะ。先練核心句，再依需要加上句尾。<a class="source" href="https://thailandfoundation.or.th/how-to-use-krub-and-kha-in-the-thai-language/" target="_blank" rel="noopener">用法來源</a></div>':''}</article><article class="card"><p class="eyebrow">TOGETHER IS BETTER</p><h2>換你們開口了</h2><p>${l.role}</p><a class="btn" href="#practice/${current}">開啟雙人角色卡</a></article><article class="card" id="quiz"><p class="eyebrow">A SMALL CHECK-IN</p><h2>最後一分鐘 · 今日小測驗</h2>${quizMarkup(ps)}<div class="divider"></div><div class="actions"><button class="btn primary" data-action="complete">${state.done.includes(current)?'✓ 已完成這一天':'完成今天的學習'}</button>${current<30?`<a class="btn" href="${dayLink(current+1)}">下一天</a>`:''}</div><p class="note">測驗答對兩題後即可完成，所有課程可自由複習。</p></article></section><aside><article class="card"><div class="side-title">我的學習護照</div><div class="big">${state.done.length}<span style="font-size:16px;font-weight:400"> / 30 天</span></div><div class="progressbar"><div style="width:${state.done.length/30*100}%"></div></div><p class="note">不用趕路，每一次開口都算進步。</p><div class="week-dots">${Array.from({length:7},(_,i)=>{const d=Math.floor((current-1)/7)*7+i+1;return d<=30?`<span class="${state.done.includes(d)?'done':''}">${state.done.includes(d)?'✓':d}</span>`:'';}).join('')}</div><a class="source" href="#journey">看看完整旅程</a></article><article class="card culture"><p class="eyebrow">A TINY PIECE OF THAILAND</p><h3>今天的泰國小常識</h3><p>${l.culture}</p>${current===25?'<a class="source" href="https://thailand.go.th/useful-information-detail/009_138?hl=en" target="_blank" rel="noopener">泰國官方參訪指南</a>':''}</article><article class="card"><h3>留十分鐘給自己</h3><div class="big" id="clock">${formatTime(remaining)}</div><div class="actions"><button class="btn small" data-action="timer" id="timer-btn">${timer?'暫停':'開始計時'}</button><button class="btn small" data-action="reset-timer">重設</button></div><p class="note">計時只是陪伴，不影響完成資格。</p></article></aside></div>`;}
function journey(){return `${heading('YOUR 30-DAY JOURNEY','一張通往泰國的學習地圖','從第一聲你好，到一段自在的旅行對話。依自己的步調出發。')}<div class="actions"><a class="btn primary" href="${dayLink(nextDay())}">繼續我的學習</a><span class="muted">已完成 ${state.done.length} / 30 天</span></div>${[[1,7,'第一週 · 勇敢開口'],[8,14,'第二週 · 吃一口泰國'],[15,21,'第三週 · 自在移動'],[22,28,'第四週 · 探索與應變'],[29,30,'出發前 · 旅行總演練']].map(([a,b,t])=>`<div class="section-head"><h2>${t}</h2><span class="muted">${a}–${b} DAY</span></div><div class="day-grid">${lessons.filter(l=>l.day>=a&&l.day<=b).map(l=>`<a class="day-card ${state.done.includes(l.day)?'done':''}" href="${dayLink(l.day)}"><span class="day-number">DAY ${String(l.day).padStart(2,'0')}</span>${state.done.includes(l.day)?'<span class="checkmark">✓</span>':''}<h3>${l.title}</h3><small>${l.category} · 10 分鐘</small></a>`).join('')}</div>`).join('')}`;}
function practice(){const l=lessons[current-1];return `${heading('PRACTICE WITH YOUR TRAVEL BUDDY','一個當旅客，一個當在地人。','看著情境開口，練完交換角色。不同時上線，也可以自己分飾兩角。')}<div class="card"><label for="practice-day">選擇情境 </label><select id="practice-day">${lessons.map(l=>`<option value="${l.day}" ${l.day===current?'selected':''}>Day ${l.day} · ${l.title}</option>`).join('')}</select><p class="prompt" style="margin-top:20px">${l.role}</p><div class="actions"><button class="btn primary" data-action="swap">交換角色</button><button class="btn" data-action="hints">${hints?'隱藏':'顯示'}句子提示</button><span class="pill">建議練習 3 分鐘</span></div></div><div class="two"><article class="card"><p class="role-label">TRAVELER</p><h2>${roleSwap?'旅伴 B':'旅伴 A'} · 旅客</h2><p>主動提出需求，試著說出今天的句子。卡住時用「可以說慢一點嗎？」接續。</p></article><article class="card"><p class="role-label">LOCAL</p><h2>${roleSwap?'旅伴 A':'旅伴 B'} · 在地人</h2><p>用手勢、數字或學過的短語回應。不知道怎麼回答時，一起查看提示。</p><p lang="th">ได้ · 可以　／　ไม่ได้ · 不可以</p></article></div>${hints?`<div class="card"><h2>可以用這幾句開始</h2>${displayPhrases(l).map(phraseCard).join('')}</div>`:'<div class="card empty">提示已收起，想不起來再打開。</div>'}<a class="btn" href="${dayLink(current)}">回到這一天的課程</a>`;}
function pocketCards(){const ps=allPhrases().filter(p=>(filter==='全部'||filter==='我的收藏'&&state.favorites.includes(p.id)||filter==='再練一次'&&state.mastery[p.id]==='again'||filter===p.category)&&(!search||[p.zh,p.th,p.roman].some(t=>t.toLowerCase().includes(search.toLowerCase()))));return ps.length?ps.map(p=>`<article class="card"><span class="pill">${p.category} · DAY ${p.day}</span>${phraseCard(p)}<button class="btn small" data-action="show" data-id="${p.id}" style="margin-top:16px">放大給對方看</button></article>`).join(''):'<div class="empty">這裡還沒有句子，試試其他分類或收藏。</div>';}
function pocket(){return `${heading('YOUR POCKET PHRASEBOOK','把需要的那一句，帶在身上。','按情境找句子，或放大泰文給對方看。所有句子都可以加入收藏。')}<label for="search" class="side-title">搜尋中文、泰文或轉寫</label><input class="search" id="search" placeholder="例如：謝謝、廁所、飯店" value="${esc(search)}"><div class="filters">${['全部','我的收藏','再練一次','暖身','美食','交通','住宿','購物','文化','行程','求助'].map(c=>`<button class="btn small ${filter===c?'active':''}" data-action="filter" data-value="${c}">${c}</button>`).join('')}</div><p class="note" style="margin-bottom:20px">過敏或醫療情境請另備完整的個人需求翻譯，簡短句子無法涵蓋所有細節。</p><div class="pocket-grid" id="pocket-results">${pocketCards()}</div>`;}
function learningHistory() {
  const days = [...state.done].reverse().sort((a, b) =>
    (state.completedAt[b] || '').localeCompare(state.completedAt[a] || '')
  );
  const rows = days.map(day => {
    const timestamp = state.completedAt[day];
    const date = timestamp
      ? `<time datetime="${timestamp}">${new Date(timestamp).toLocaleString('zh-TW', {dateStyle: 'medium', timeStyle: 'short'})}</time>`
      : '舊紀錄 · 無完成時間';
    return `<li><a href="${dayLink(day)}">Day ${day} · ${esc(lessons[day - 1].title)}</a> <span class="muted">（${date}）</span></li>`;
  });
  return `<section class="card"><h2>學習歷程</h2>${rows.length
    ? `<ul>${rows.join('')}</ul>`
    : '<p class="muted">完成第一堂課後，這裡會顯示課程與完成時間。</p>'}</section>`;
}
function progress(){return `${heading('OUR LITTLE LEARNING PASSPORT','你們一起走過的每一步。',useCloud?'進度同步到目前選擇的旅伴。匯出檔案可另外保留備份。':'進度儲存在這個瀏覽器。匯出檔案可備份，也可以交給旅伴交換進度。')}<div class="two"><article class="card"><h2>${esc(state.name)}</h2><label class="field">護照上的名字<input id="name" value="${esc(state.name)}" maxlength="30"></label><button class="btn small" data-action="save-name">儲存名字</button><div class="stat-row"><div><div class="big">${state.done.length}</div><span class="muted">完成天數</span></div><div><div class="big">${Object.values(state.mastery).filter(v=>v==='ok').length}</div><span class="muted">熟悉句子</span></div><div><div class="big">${state.favorites.length}</div><span class="muted">收藏句子</span></div></div><div class="progressbar"><div style="width:${state.done.length/30*100}%"></div></div><button class="btn primary" data-action="export">匯出我的進度</button><label class="field">從備份還原我的進度<input type="file" id="import-self" accept="application/json,.json"></label><p class="note">還原會取代目前的學習紀錄，選檔後會先顯示確認。</p></article><article class="card"><h2>和旅伴交換學習護照</h2><p>把匯出的 JSON 檔案傳給朋友，各自匯入對方的護照，就能看到上次交換時的進度。</p><label class="field">匯入旅伴的進度<input type="file" id="import-friend" accept="application/json,.json"></label>${state.friend?`<div class="feedback"><strong>${esc(state.friend.name)}</strong><p>已完成 ${state.friend.done.length} / 30 天</p><p>共同完成 ${state.done.filter(d=>state.friend.done.includes(d)).length} 天</p><button class="btn small" data-action="remove-friend">移除旅伴快照</button></div>`:'<div class="feedback">旅伴的護照還沒抵達，先邀請對方一起開始吧。</div>'}<p class="note">這是手動交換的旅伴進度快照。</p></article></div>${learningHistory()}<div class="card"><h2>每週一枚旅行印章</h2><div class="stat-row">${[[1,7,'開口'],[8,14,'點餐'],[15,21,'移動'],[22,28,'探索']].map(([a,b,t])=>{const done=Array.from({length:b-a+1},(_,i)=>a+i).every(d=>state.done.includes(d));return `<div><div class="stamp ${done?'':'locked'}"><strong>${done?'✓':'ท'}</strong>${t}旅人</div><p class="note" style="text-align:center">完成 Day ${a}–${b}</p></div>`;}).join('')}</div></div><div class="card"><h3>教材與使用方式</h3><p>旅行口說入門，簡化轉寫未完整標示聲調與母音長短。語音取決於裝置是否安裝泰語聲音，尚未經泰語教師逐句審校，也未加入真人錄音。</p><p><a href="https://thailandfoundation.or.th/how-to-use-krub-and-kha-in-the-thai-language/" target="_blank" rel="noopener">禮貌句尾參考：Thailand Foundation</a><br><a href="https://thailand.go.th/useful-information-detail/009_138?hl=en" target="_blank" rel="noopener">寺廟禮儀參考：泰國政府</a></p><p class="note">保留整個資料夾即可離線開啟教材。外部字型與來源連結需要網路，發音是否離線依裝置而定。清除瀏覽器資料可能遺失進度，請定期匯出。</p></div>`;}
function render(keep=false){if(useCloud&&!cloudReady)return;const parts=(location.hash.slice(1)||'today').split('/'),page=['today','journey','practice','pocket','progress'].includes(parts[0])?parts[0]:'today';if(parts[1]&&Number.isInteger(+parts[1])&&+parts[1]>=1&&+parts[1]<=30)current=+parts[1];document.querySelectorAll('nav a').forEach(a=>{a.classList.toggle('active',a.hash==='#'+page);if(a.hash==='#'+page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});const y=scrollY;$('#app').innerHTML=({today,journey,practice,pocket,progress}[page])();if(!persisted)$('#app').insertAdjacentHTML('afterbegin','<p class="feedback" role="status">目前無法使用瀏覽器儲存，請匯出進度避免遺失。</p>');window.scrollTo(0,keep?y:0);}
function formatTime(n){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}function clockUpdate(){if($('#clock'))$('#clock').textContent=formatTime(remaining);if($('#timer-btn'))$('#timer-btn').textContent=timer?'暫停':'開始計時';}function stopTimer(){clearInterval(timer);timer=null;clockUpdate();}
function exportProgress(snapshot=state){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({schema:'thai-together',version:1,...validate(snapshot),exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}));a.href=url;a.download='thai-learning-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已匯出進度檔案。');}
async function importProgress(file,friend){if(!file)return;if(file.size>1000000){toast('檔案太大，請使用本網頁匯出的進度檔。');return;}try{const s=JSON.parse(await file.text());if(s.schema!=='thai-together'||s.version!==1||!Array.isArray(s.done)||!Array.isArray(s.favorites))throw Error('format');const v=validate(s);if(friend)state.friend={name:v.name,done:v.done};else{if(!confirm(`還原「${v.name}」的 ${v.done.length} 天進度？目前的學習紀錄將被取代。`))return;state={...state,...v};}save();render(true);toast(friend?'已更新旅伴進度快照。':'已還原學習進度。');}catch(e){toast('檔案格式不正確，請選擇本網頁匯出的 JSON 檔。');}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;if(a==='load-cloud')void loadCloud();
else if(a==='export-offline'){
  try {
    const snapshot=JSON.parse(localStorage.getItem(KEY)||'null');
    if(snapshot)exportProgress(snapshot);
    else toast('此瀏覽器沒有舊的學習紀錄。');
  } catch { toast('無法讀取此瀏覽器的舊紀錄。'); }
}
else if(a==='select-profile'){
  const profile=b.dataset.profile;
  if(profile==='a'||profile==='b'){setCloudProfile(profile);void loadCloud();}
}
else if(a==='switch-profile'){
  if(!pendingSnapshot||confirm('本次紀錄尚未同步。確定要切換身分？')){
    pendingSnapshot=null;
    setCloudProfile('');
    location.reload();
  }
}
else if(a==='retry-cloud')void syncCloud();
else if(a==='reload-cloud'){if(confirm('確定已備份本次紀錄並重新讀取雲端？')){pendingSnapshot=null;location.reload();}}
else if(a==='speak'||a==='slow')speak(id,a==='slow');else if(a==='favorite'){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();render(true);}else if(a==='master'){state.mastery[id]=b.dataset.value;save();render(true);}else if(a==='answer'){quizAnswers[+b.dataset.index]=b.dataset.answer;quizChecked=false;render(true);}else if(a==='check'){quizChecked=true;render(true);}else if(a==='complete'){if(state.done.includes(current)){toast('這一天已完成，可以繼續複習。');return;}if(!quizChecked||!quizData(displayPhrases(lessons[current-1])).every((q,i)=>quizAnswers[i]===q.p.zh)){toast('先完成並確認兩題測驗，再為今天蓋章。');return;}state.done.push(current);state.completedAt[current]=new Date().toISOString();save();render(true);toast('今天的學習，完成！');}else if(a==='swap'){roleSwap=!roleSwap;render(true);}else if(a==='hints'){hints=!hints;render(true);}else if(a==='filter'){filter=b.dataset.value;render(true);}else if(a==='show'){const p=findPhrase(id),d=document.createElement('dialog');d.className='modal';d.innerHTML=`<p class="eyebrow">PLEASE TAKE A LOOK</p><div class="thai" lang="th">${esc(p.th)}</div><p>${esc(p.zh)}</p><button class="btn" data-action="close">關閉</button>`;document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();}else if(a==='close')b.closest('dialog').close();else if(a==='timer'){if(timer){remaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));stopTimer();}else{if(!remaining)remaining=600;timerEnd=Date.now()+remaining*1000;timer=setInterval(()=>{remaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));if(!remaining){stopTimer();toast('十分鐘到了，今天也有好好練習。');}clockUpdate();},250);clockUpdate();}}else if(a==='reset-timer'){stopTimer();remaining=600;clockUpdate();}else if(a==='save-name'){state.name=$('#name').value.trim().slice(0,30)||'我的旅程';save();render(true);toast('名字已儲存。');}else if(a==='export')exportProgress();else if(a==='remove-friend'){state.friend=null;save();render(true);}});
document.addEventListener('input',e=>{if(e.target.id==='search'){search=e.target.value;$('#pocket-results').innerHTML=pocketCards();}});document.addEventListener('change',e=>{if(e.target.id==='practice-day')location.hash='#practice/'+e.target.value;if(e.target.id==='import-self')importProgress(e.target.files[0],false);if(e.target.id==='import-friend')importProgress(e.target.files[0],true);});window.addEventListener('hashchange',()=>{quizAnswers={};quizChecked=false;activeQuiz=null;if(location.hash==='#today')current=nextDay();render();});if(useCloud){restoreCloudProfile();void loadCloud();}else render();
