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
        cloudStatus('另一台裝置已更新，本次變更尚未同步。', 'reload');
        return;
      }
      if (!response.ok) throw new Error('Unable to save progress');
      revision = (await response.json()).revision;
      if (pendingSnapshot === snapshot) pendingSnapshot = null;
    }
    cloudStatus('已同步');
  } catch {
    cloudStatus('尚未同步，請重試。', 'retry');
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
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){persisted=false;toast('瀏覽器無法儲存進度。');}}function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>$('#toast').style.display='none',4000);}function nextDay(){return lessons.find(l=>!state.done.includes(l.day))?.day||30;}
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
function phraseCard(p){return `<div class="phrase"><div class="phrase-line"><div><div class="thai" lang="th">${esc(p.th)}</div><div class="roman">${esc(p.roman)}</div></div><button class="star" data-action="favorite" data-id="${p.id}" aria-label="${state.favorites.includes(p.id)?'取消收藏':'收藏'}${esc(p.zh)}" aria-pressed="${state.favorites.includes(p.id)}">${state.favorites.includes(p.id)?'★':'☆'}</button></div><p class="translation">${esc(p.zh)}</p><div class="actions"><button class="btn small" data-action="speak" data-id="${p.id}">▷ 聽發音</button><button class="btn small" data-action="slow" data-id="${p.id}">慢速</button><button class="btn small" data-action="master" data-id="${p.id}" data-value="again" aria-pressed="${state.mastery[p.id]==='again'}">${state.mastery[p.id]==='again'?'● ':''}再練一次</button><button class="btn small" data-action="master" data-id="${p.id}" data-value="ok" aria-pressed="${state.mastery[p.id]==='ok'}">${state.mastery[p.id]==='ok'?'✓ ':''}我會了</button></div></div>`;}
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
function quizMarkup(ps){return quizData(ps).map((q,i)=>`<div><p>${i+1}. <span lang="th" class="thai" style="font-size:24px">${esc(q.p.th)}</span> <span class="roman">(${esc(q.p.roman)})</span> 是什麼意思？</p>${q.options.map(o=>`<button class="btn quiz-option ${quizAnswers[i]===o?'chosen':''}" data-action="answer" data-index="${i}" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}</div>`).join('')+`<button class="btn" data-action="check" style="margin-top:15px">確認答案</button>${quizChecked?`<p class="feedback" role="status">${quizData(ps).every((q,i)=>quizAnswers[i]===q.p.zh)?'✓ 兩題都答對了！可以完成今天的學習。':'再試一次，看看上方的意思，也可以重新聽一遍。'}</p>`:''}`;}
function today() {
  const lesson = lessons[current - 1];
  const phrases = displayPhrases(lesson);
  const completed = state.done.includes(current);
  return `
    <section class="daily-head">
      <div class="daily-meta"><span>第 ${current} 天 · ${lesson.category}</span><a href="#progress">完成 ${state.done.length} / 30 天</a></div>
      <h1>${lesson.title}</h1>
      <div class="daily-tools">
        <div class="timer-controls" aria-label="十分鐘計時">
          <span id="clock">${formatTime(remaining)}</span>
          <button class="btn small" data-action="timer" id="timer-btn">${timer?'暫停':'開始計時'}</button>
          <button class="btn small" data-action="reset-timer">重設</button>
        </div>
        <a class="btn small" href="#quiz" data-action="jump-quiz">跳到測驗</a>
      </div>
    </section>
    <article class="card">
      <h2>聽一聽，跟著念</h2>
      ${current > 1 ? `<details id="warmup" class="lesson-disclosure">
        <summary>複習前一天</summary>
        ${displayPhrases(lessons[current-2]).slice(0,2).map(p=>`<p><span lang="th">${p.th}</span> · ${p.zh}
          <button class="btn small" data-action="speak" data-id="${p.id}">聽</button></p>`).join('')}
      </details>` : ''}
      ${phrases.map(phraseCard).join('')}
      <details id="pronunciation" class="lesson-disclosure">
        <summary>發音與轉寫說明</summary>
        <p class="note">轉寫未完整標示聲調與母音長短。播放使用裝置的泰語合成語音。</p>
        ${current === 1 ? '<p>常見禮貌句尾為 ครับ，女性陳述用 ค่ะ、問句用 คะ。<a href="https://thailandfoundation.or.th/how-to-use-krub-and-kha-in-the-thai-language/" target="_blank" rel="noopener">句尾用法</a></p>' : ''}
      </details>
    </article>
    <article class="card culture">
      <h2>泰國小常識</h2>
      <p>${lesson.culture}</p>
      ${current === 25 ? '<a class="source" href="https://thailand.go.th/useful-information-detail/009_138?hl=en" target="_blank" rel="noopener">泰國官方參訪指南</a>' : ''}
    </article>
    <article class="card">
      <h2>旅伴練習</h2><p>${lesson.role}</p>
      <a class="btn" href="#practice/${current}">開啟角色卡</a>
    </article>
    <article class="card" id="quiz" tabindex="-1">
      <h2>今日測驗</h2>${quizMarkup(phrases)}
      <div class="divider"></div>
      <div class="actions complete-actions">
        <button class="btn primary" data-action="complete">${completed ? '✓ 已完成' : '完成學習'}</button>
        ${current < 30 ? `<a class="btn" href="${dayLink(current + 1)}">下一天</a>` : ''}
      </div>
    </article>`;
}
function journey(){return `<h1>30 天課表</h1><div class="actions"><a class="btn primary" href="${dayLink(nextDay())}">繼續我的學習</a><span class="muted">已完成 ${state.done.length} / 30 天</span></div>${[[1,7,'第一週 · 勇敢開口'],[8,14,'第二週 · 吃一口泰國'],[15,21,'第三週 · 自在移動'],[22,28,'第四週 · 探索與應變'],[29,30,'出發前 · 旅行總演練']].map(([a,b,t])=>`<div class="section-head"><h2>${t}</h2></div><div class="day-grid">${lessons.filter(l=>l.day>=a&&l.day<=b).map(l=>`<a class="day-card ${state.done.includes(l.day)?'done':''}" href="${dayLink(l.day)}"><span class="day-number">DAY ${String(l.day).padStart(2,'0')}</span>${state.done.includes(l.day)?'<span class="checkmark">✓</span>':''}<h3>${l.title}</h3></a>`).join('')}</div>`).join('')}`;}
function practice(){const l=lessons[current-1];return `<h1>旅伴練習</h1><div class="card"><label for="practice-day">選擇情境 </label><select id="practice-day">${lessons.map(l=>`<option value="${l.day}" ${l.day===current?'selected':''}>Day ${l.day} · ${l.title}</option>`).join('')}</select><p class="prompt" style="margin-top:20px">${l.role}</p><div class="actions"><button class="btn primary" data-action="swap">交換角色</button><button class="btn" data-action="hints">${hints?'隱藏':'顯示'}句子提示</button></div></div><div class="two"><article class="card"><h2>${roleSwap?'旅伴 B':'旅伴 A'} · 旅客</h2><p>主動提出需求，試著說出今天的句子。卡住時用「可以說慢一點嗎？」接續。</p></article><article class="card"><h2>${roleSwap?'旅伴 A':'旅伴 B'} · 在地人</h2><p>用手勢、數字或學過的短語回應。不知道怎麼回答時，一起查看提示。</p><p lang="th">ได้ · 可以　／　ไม่ได้ · 不可以</p></article></div>${hints?`<div class="card"><h2>可以用這幾句開始</h2>${displayPhrases(l).map(phraseCard).join('')}</div>`:'<div class="card empty">提示已收起，想不起來再打開。</div>'}<a class="btn" href="${dayLink(current)}">回到這一天的課程</a>`;}
function pocketCards(){const ps=allPhrases().filter(p=>(filter==='全部'||filter==='我的收藏'&&state.favorites.includes(p.id)||filter==='再練一次'&&state.mastery[p.id]==='again'||filter===p.category)&&(!search||[p.zh,p.th,p.roman].some(t=>t.toLowerCase().includes(search.toLowerCase()))));return ps.length?ps.map(p=>`<article class="card"><span class="pill">${p.category} · DAY ${p.day}</span>${phraseCard(p)}<button class="btn small" data-action="show" data-id="${p.id}" style="margin-top:16px">放大給對方看</button></article>`).join(''):'<div class="empty">這裡還沒有句子，試試其他分類或收藏。</div>';}
function pocket(){return `<h1>旅行口袋卡</h1><label for="search" class="side-title">搜尋中文、泰文或轉寫</label><input class="search" id="search" placeholder="例如：謝謝、廁所、飯店" value="${esc(search)}"><label class="pocket-filter" for="pocket-filter">分類<select id="pocket-filter">${['全部','我的收藏','再練一次','暖身','美食','交通','住宿','購物','文化','行程','求助'].map(c=>`<option ${filter===c?'selected':''}>${c}</option>`).join('')}</select></label><p class="note" style="margin-bottom:20px">過敏或醫療情境請另備完整的個人需求翻譯，簡短句子無法涵蓋所有細節。</p><div class="pocket-grid" id="pocket-results">${pocketCards()}</div>`;}
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
    ? `<ul class="history-list">${rows.join('')}</ul>`
    : '<p class="muted">完成第一堂課後，這裡會顯示課程與完成時間。</p>'}</section>`;
}
function progress() {
  const weekly = [[1,7,'開口'],[8,14,'點餐'],[15,21,'移動'],[22,28,'探索']];
  return `<h1>學習進度</h1>
    <article class="card">
      <h2>${esc(state.name)}</h2>
      <div class="stat-row">
        <div><div class="big">${state.done.length} / 30</div><span class="muted">已完成</span></div>
        <div><div class="big">${Object.values(state.mastery).filter(v=>v==='ok').length}</div><span class="muted">熟悉句子</span></div>
        <div><div class="big">${state.favorites.length}</div><span class="muted">收藏</span></div>
      </div>
      <div class="progressbar"><div style="width:${state.done.length/30*100}%"></div></div>
      <p class="note">${useCloud ? '進度同步到目前身分。' : '進度存於這個瀏覽器。'}</p>
    </article>
    ${learningHistory()}
    <details class="card" id="weekly-stamps">
      <summary>每週印章</summary>
      <div class="stat-row">${weekly.map(([a,b,t])=>{
        const done = Array.from({length:b-a+1},(_,i)=>a+i).every(day=>state.done.includes(day));
        return `<div><div class="stamp ${done?'':'locked'}"><strong>${done?'✓':'ท'}</strong>${t}旅人</div><p class="note" style="text-align:center">第 ${a}–${b} 天</p></div>`;
      }).join('')}</div>
    </details>
    <details class="card" id="progress-settings">
      <summary>護照名稱</summary>
      <label class="field">護照名稱<input id="name" value="${esc(state.name)}" maxlength="30"></label>
      <button class="btn" data-action="save-name">儲存名稱</button>
    </details>
    <details class="card" id="course-notes">
      <summary>教材與參考資料</summary>
      <p>轉寫為發音提示，語音來自裝置的泰語合成語音。教材可離線開啟，語音能否離線播放依裝置而定。</p>
      <p><a href="https://thailandfoundation.or.th/how-to-use-krub-and-kha-in-the-thai-language/" target="_blank" rel="noopener">禮貌句尾</a> · <a href="https://thailand.go.th/useful-information-detail/009_138?hl=en" target="_blank" rel="noopener">寺廟禮儀</a></p>
    </details>`;
}
function render(keep=false){if(useCloud&&!cloudReady)return;const parts=(location.hash.slice(1)||'today').split('/'),page=['today','journey','practice','pocket','progress'].includes(parts[0])?parts[0]:'today';if(parts[1]&&Number.isInteger(+parts[1])&&+parts[1]>=1&&+parts[1]<=30)current=+parts[1];document.querySelectorAll('nav a').forEach(a=>{a.classList.toggle('active',a.hash==='#'+page);if(a.hash==='#'+page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});const y=scrollY;const openPanels=keep?Array.from(document.querySelectorAll('#app details[open][id]'),panel=>panel.id):[];$('#app').innerHTML=({today,journey,practice,pocket,progress}[page])();if(!persisted)$('#app').insertAdjacentHTML('afterbegin','<p class="feedback" role="status">目前無法儲存進度，關閉頁面可能會遺失這次的紀錄。</p>');for(const id of openPanels){const panel=document.getElementById(id);if(panel)panel.open=true;}window.scrollTo(0,keep?y:0);}
function formatTime(n){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}function clockUpdate(){if($('#clock'))$('#clock').textContent=formatTime(remaining);if($('#timer-btn'))$('#timer-btn').textContent=timer?'暫停':'開始計時';}function stopTimer(){clearInterval(timer);timer=null;clockUpdate();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;if(a==='jump-quiz'){
  e.preventDefault();
  const quiz=$('#quiz');
  quiz.focus({preventScroll:true});
  quiz.scrollIntoView({block:'start'});
}
else if(a==='load-cloud')void loadCloud();
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
else if(a==='reload-cloud'){if(confirm('重讀雲端會捨棄本次尚未同步的變更。要繼續嗎？')){pendingSnapshot=null;location.reload();}}
else if(a==='speak'||a==='slow')speak(id,a==='slow');else if(a==='favorite'){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();render(true);}else if(a==='master'){state.mastery[id]=b.dataset.value;save();render(true);}else if(a==='answer'){quizAnswers[+b.dataset.index]=b.dataset.answer;quizChecked=false;render(true);}else if(a==='check'){quizChecked=true;render(true);}else if(a==='complete'){if(state.done.includes(current)){toast('這一天已完成，可以繼續複習。');return;}if(!quizChecked||!quizData(displayPhrases(lessons[current-1])).every((q,i)=>quizAnswers[i]===q.p.zh)){toast('先完成並確認兩題測驗，再為今天蓋章。');return;}state.done.push(current);state.completedAt[current]=new Date().toISOString();save();render(true);toast('今天的學習，完成！');}else if(a==='swap'){roleSwap=!roleSwap;render(true);}else if(a==='hints'){hints=!hints;render(true);}else if(a==='show'){const p=findPhrase(id),d=document.createElement('dialog');d.className='modal';d.innerHTML=`<div class="thai" lang="th">${esc(p.th)}</div><p>${esc(p.zh)}</p><button class="btn" data-action="close">關閉</button>`;document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();}else if(a==='close')b.closest('dialog').close();else if(a==='timer'){if(timer){remaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));stopTimer();}else{if(!remaining)remaining=600;timerEnd=Date.now()+remaining*1000;timer=setInterval(()=>{remaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));if(!remaining){stopTimer();toast('十分鐘到了，今天也有好好練習。');}clockUpdate();},250);clockUpdate();}}else if(a==='reset-timer'){stopTimer();remaining=600;clockUpdate();}else if(a==='save-name'){state.name=$('#name').value.trim().slice(0,30)||'我的旅程';save();render(true);toast('名字已儲存。');}});
document.addEventListener('input',e=>{if(e.target.id==='search'){search=e.target.value;$('#pocket-results').innerHTML=pocketCards();}});document.addEventListener('change',e=>{if(e.target.id==='pocket-filter'){filter=e.target.value;$('#pocket-results').innerHTML=pocketCards();}if(e.target.id==='practice-day')location.hash='#practice/'+e.target.value;});window.addEventListener('hashchange',()=>{quizAnswers={};quizChecked=false;activeQuiz=null;if(location.hash==='#today')current=nextDay();render();});if(useCloud){restoreCloudProfile();void loadCloud();}else render();
