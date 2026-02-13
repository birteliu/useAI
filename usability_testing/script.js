// --- 1. Firebase Imports (必須在檔案最上方) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    deleteDoc, 
    doc,
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 2. Firebase Config & Init ---

// 請確認這是您剛剛複製的 config
const firebaseConfig = {
  apiKey: "AIzaSyDe3jkHEaIh2mK46Pkk0j9EA5TXl_M5Wfc",
  authDomain: "usability-ca90b.firebaseapp.com",
  projectId: "usability-ca90b",
  storageBucket: "usability-ca90b.firebasestorage.app",
  messagingSenderId: "363915399435",
  appId: "1:363915399435:web:5b8a94660b291172c2120e",
  measurementId: "G-RTESBD3WQF"
};

// 初始化 Firebase (使用上方 CDN 引入的 initializeApp)
// 注意：不要再 import { ... } from "firebase/app"
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DB_COLLECTION = "usability_records";

// 全域變數：用來暫存從雲端抓下來的資料
let allTestRecords = [];

// 全域變數：計時器狀態（移到這裡）
let taskTimers = {
    task1: { seconds: 0, interval: null, running: false },
    task2: { seconds: 0, interval: null, running: false },
    task3: { seconds: 0, interval: null, running: false },
    task4: { seconds: 0, interval: null, running: false },
    task5: { seconds: 0, interval: null, running: false },
    task6: { seconds: 0, interval: null, running: false }
};

// --- 3. 監聽 Cloud Firestore 資料變化 ---
onSnapshot(
    query(collection(db, DB_COLLECTION), orderBy("timestamp", "desc")), 
    (snapshot) => {
        allTestRecords = []; // 清空暫存
        snapshot.forEach((doc) => {
            // 將文件 ID (doc.id) 併入資料中
            allTestRecords.push({ docId: doc.id, ...doc.data() });
        });
        
        console.log("資料庫更新，目前筆數:", allTestRecords.length);
        renderAnalysisGrid();
        updateDashboard();
    }, 
    (error) => {
        console.error("讀取資料失敗:", error);
        // 若出現此錯誤，通常是 Firebase Console 的 Rules 沒設為 Test Mode，或 Config 錯誤
    }
);

// --- 4. UI Logic: Tabs & Carousel ---

// Tab Switching
function switchTab(tabId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(tabId);
    if (targetSection) targetSection.classList.add('active');
    
    // Highlight button
    buttons.forEach(btn => {
        const onClick = btn.getAttribute('onclick');
        if(onClick && onClick.includes(tabId)) btn.classList.add('active');
    });
}

// Carousel Logic
let currentCardIndex = 1;
const totalCards = 6;

function updateCardDisplay() {
    for (let i = 1; i <= totalCards; i++) {
        const card = document.getElementById(`card-${i}`);
        if(card) card.classList.remove('active');
    }
    const currentCard = document.getElementById(`card-${currentCardIndex}`);
    if(currentCard) currentCard.classList.add('active');
    
    const indicator = document.getElementById('card-indicator');
    if(indicator) indicator.textContent = `${currentCardIndex} / ${totalCards}`;
}

function nextCard() {
    if (currentCardIndex < totalCards) {
        currentCardIndex++;
        updateCardDisplay();
    }
}

function prevCard() {
    if (currentCardIndex > 1) {
        currentCardIndex--;
        updateCardDisplay();
    }
}

// Sliders Initialization
document.addEventListener('DOMContentLoaded', () => {
    const sliderIds = ['q1', 'q2', 'q3'];
    sliderIds.forEach(id => {
        const slider = document.getElementById(id);
        const display = document.getElementById(id + '-val');
        if (slider && display) {
            slider.addEventListener('input', function() {
                display.textContent = this.value;
            });
        }
    });

    // 新增：為每個任務卡加入快速標籤
    addQuickTagsToTaskCards();
    
    // 新增：為每個任務卡加入計時器
    addTimersToTaskCards();
});

// 新增函數：為任務卡加入快速標籤
function addQuickTagsToTaskCards() {
    const taskCards = document.querySelectorAll('.task-card');
    const quickTags = [
        '找不到按鈕',
        '不理解詞義',
        '字不明顯',
        '步驟太多',
        '載入太慢',
        '點錯位置',
        '需要協助',
        '順利完成',
        '有疑惑但完成',
        '放棄任務'
    ];

    taskCards.forEach((card) => {
        const textarea = card.querySelector('textarea');
        if (!textarea) return;
        if (card.querySelector('.quick-tags')) return;

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'quick-tags';
        // 移除內聯樣式

        quickTags.forEach(tag => {
            const tagBtn = document.createElement('button');
            tagBtn.type = 'button';
            tagBtn.textContent = tag;
            tagBtn.className = 'quick-tag-btn';
            // 移除內聯樣式

            // 點擊事件 (只處理邏輯與點擊動畫 class)
            tagBtn.addEventListener('click', () => {
                const currentValue = textarea.value.trim();
                
                // 文字處理邏輯
                if (currentValue && !currentValue.endsWith('；') && !currentValue.endsWith('。')) {
                    textarea.value = currentValue + '；' + tag;
                } else if (currentValue) {
                    textarea.value = currentValue + tag;
                } else {
                    textarea.value = tag;
                }
                textarea.focus();
                
                // CSS class 動畫觸發
                tagBtn.classList.add('clicked');
                setTimeout(() => {
                    tagBtn.classList.remove('clicked');
                }, 200);
            });

            // 移除 JS hover 事件，改由 CSS :hover 處理
            tagsContainer.appendChild(tagBtn);
        });

        const observationArea = card.querySelector('.observation-area');
        if (observationArea) {
            observationArea.appendChild(tagsContainer);
        } else {
            textarea.parentElement.appendChild(tagsContainer);
        }
    });
}

// 新增函數：為任務卡加入計時器
function addTimersToTaskCards() {
    const taskCards = document.querySelectorAll('.task-card');
    
    taskCards.forEach((card, index) => {
        const taskId = `task${index + 1}`;
        const taskHeader = card.querySelector('.task-header');
        if (!taskHeader) return;
        if (card.querySelector('.timer-container')) return;

        const timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        // 移除內聯樣式

        const timerDisplay = document.createElement('span');
        timerDisplay.className = 'timer-display';
        timerDisplay.id = `timer-${taskId}`;
        timerDisplay.textContent = '00:00';
        // 移除內聯樣式

        const startBtn = document.createElement('button');
        startBtn.type = 'button';
        startBtn.textContent = '▶';
        startBtn.className = 'timer-btn start-btn';
        // 移除內聯樣式

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.textContent = '⟳';
        resetBtn.className = 'timer-btn reset-btn';
        // 移除內聯樣式

        startBtn.addEventListener('click', () => {
            toggleTimer(taskId, startBtn, timerDisplay);
        });

        resetBtn.addEventListener('click', () => {
            resetTimer(taskId, startBtn, timerDisplay);
        });

        // 移除 JS hover 事件

        timerContainer.appendChild(timerDisplay);
        timerContainer.appendChild(startBtn);
        timerContainer.appendChild(resetBtn);
        
        taskHeader.appendChild(timerContainer);
    });
}

// 計時器控制函數
function toggleTimer(taskId, btn, display) {
    const timer = taskTimers[taskId];
    
    if (timer.running) {
        // 暫停
        clearInterval(timer.interval);
        timer.running = false;
        btn.textContent = '▶';
        
        // 移除 running class 來改變樣式
        btn.classList.remove('running');
        display.classList.remove('running');
    } else {
        // 開始
        timer.running = true;
        btn.textContent = '⏸';
        
        // 加入 running class 來改變樣式
        btn.classList.add('running');
        display.classList.add('running');
        
        timer.interval = setInterval(() => {
            timer.seconds++;
            updateTimerDisplay(taskId, display);
        }, 1000);
    }
}

function resetTimer(taskId, btn, display) {
    const timer = taskTimers[taskId];
    
    if (timer.interval) {
        clearInterval(timer.interval);
    }
    
    timer.seconds = 0;
    timer.running = false;
    btn.textContent = '▶';
    display.textContent = '00:00';
    
    // 重置樣式 class
    btn.classList.remove('running');
    display.classList.remove('running');
}

// 修正 renderAnalysisGrid 中的內聯樣式
function renderAnalysisGrid() {
    const gridContainer = document.getElementById('analysisGrid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';

    if (allTestRecords.length === 0) {
        // 使用 CSS class
        gridContainer.innerHTML = `
            <p class="no-data-msg">
                目前無資料，請等待讀取或新增資料
            </p>`;
        return;
    }

    // 輔助函數：將秒數轉為 MM:SS 格式
    const formatTime = (seconds) => {
        if (seconds === undefined || seconds === null) return '--:--';
        const numSeconds = parseInt(seconds, 10);
        if (isNaN(numSeconds)) return '--:--';
        
        const mins = Math.floor(numSeconds / 60);
        const secs = numSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    allTestRecords.forEach((record) => {
        const card = document.createElement('div');
        card.className = 'record-card';
        
        const badgeColor = record.successCount >= 4 ? 'orange' : (record.successCount >= 3 ? 'yellow' : 'red');

        // 修改：在迴圈中同時讀取筆記、時間與成功狀態
        const taskHtml = record.taskNotes.map((note, index) => {
            // 取得對應任務的時間
            const timeVal = (record.taskTimes && record.taskTimes[index] !== undefined) ? record.taskTimes[index] : 0;
            const timeStr = formatTime(timeVal);
            
            // 根據時間長短設定顏色
            let timeColorStyle = 'color: #999;'; 
            if (timeVal > 180) timeColorStyle = 'color: #d32f2f; font-weight: bold;'; 
            else if (timeVal > 0) timeColorStyle = 'color: #2e7d32; font-weight: bold;'; 

            // 新增：取得任務成功狀態
            // 舊資料可能沒有 taskSuccess 欄位，預設為 null 或 false
            let statusHtml = '';
            if (record.taskSuccess && Array.isArray(record.taskSuccess) && record.taskSuccess[index] !== undefined) {
                const isSuccess = record.taskSuccess[index];
                if (isSuccess) {
                    statusHtml = `<span style="color: #4CAF50; font-weight: bold; font-size: 14px; margin-right: 8px;">成功</span>`;
                } else {
                    statusHtml = `<span style="color: #F44336; font-weight: bold; font-size: 14px; margin-right: 8px;">失敗</span>`;
                }
            } else {
                // 舊資料沒有紀錄個別狀態
                statusHtml = `<span style="color: #ccc; font-size: 12px; margin-right: 8px;">(無狀態)</span>`;
            }

            return `
            <div class="task-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                    <div style="display: flex; align-items: center;">
                        <strong style="color: #444; margin-right: 10px;">任務 ${index + 1}</strong>
                        ${statusHtml}
                    </div>
                    <span style="font-family: 'Courier New', monospace; font-size: 14px; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; ${timeColorStyle}">⏱ ${timeStr}</span>
                </div>
                <div style="color: #666; line-height: 1.5;">${note}</div>
            </div>
            `;
        }).join('');

        // 計算總耗時
        let totalTimeSecs = 0;
        if(record.taskTimes && Array.isArray(record.taskTimes)) {
            totalTimeSecs = record.taskTimes.reduce((a, b) => a + (parseInt(b) || 0), 0);
        }
        const totalTimeStr = formatTime(totalTimeSecs);

        card.innerHTML = `
            <div class="card-actions">
                <button class="delete-btn" onclick="deleteRecord('${record.docId}')" title="刪除">✖</button>
            </div>

            <div class="record-header">
                <h4>${record.id}</h4>
                <span class="badge ${badgeColor}" style="margin-right: 25px;">${record.successCount} / 6 成功</span> 
            </div>
            
            <div class="user-tags">
                <span>${record.age}</span>
                <span>${record.gender}</span>
                <span>${record.crop}</span>
                <span>${record.device}</span>
            </div>

            <div class="score-row">
                <div class="score-item"><span>Q1信心</span>${record.q1 || 0}</div>
                <div class="score-item"><span>Q2難易</span>${record.q2 || 0}</div>
                <div class="score-item"><span>Q3推薦</span>${record.q3 || 0}</div>
                <div class="score-item"><span>總耗時</span>${totalTimeStr}</div>
            </div>

            <details>
                <summary>任務觀察筆記 (${record.taskNotes.filter(n => n !== '-').length} 則)</summary>
                <div class="detail-content">
                    ${taskHtml}
                </div>
            </details>

            <details>
                <summary>訪談回饋</summary>
                <div class="detail-content">
                    <div class="qa-item"><span class="qa-label">優點：</span>${record.pros || '-'}</div>
                    <div class="qa-item"><span class="qa-label">改進：</span>${record.cons || '-'}</div>
                    <div class="qa-item"><span class="qa-label">想法：</span>${record.ideas || '-'}</div>
                    <div class="qa-item"><span class="qa-label">觀察：</span>${record.notes || '-'}</div>
                </div>
            </details>
        `;
        gridContainer.appendChild(card);
    });
}

function updateDashboard() {
    console.log("正在更新儀表板...");

    const totalUsersEl = document.getElementById('total-users');
    const avgQ1El = document.getElementById('avg-q1');
    const avgQ2El = document.getElementById('avg-q2');
    const avgQ3El = document.getElementById('avg-q3');
    const barQ1El = document.getElementById('bar-q1');
    const barQ2El = document.getElementById('bar-q2');
    const barQ3El = document.getElementById('bar-q3');
    
    // 檢查是否有這個容器，如果沒有，請確認 index.html
    const taskChartEl = document.getElementById('task-success-chart'); 

    if (allTestRecords.length === 0) {
        if (totalUsersEl) totalUsersEl.textContent = '0';
        if (avgQ1El) avgQ1El.textContent = '-';
        if (avgQ2El) avgQ2El.textContent = '-';
        if (avgQ3El) avgQ3El.textContent = '-';
        if (barQ1El) barQ1El.style.width = '0%';
        if (barQ2El) barQ2El.style.width = '0%';
        if (barQ3El) barQ3El.style.width = '0%';
        if (taskChartEl) taskChartEl.innerHTML = '<p style="color:#999">尚無資料</p>';
        return;
    }

    const totalTests = allTestRecords.length;
    
    // 計算平均分數
    const avgQ1 = allTestRecords.reduce((sum, r) => sum + (r.q1 || 0), 0) / totalTests;
    const avgQ2 = allTestRecords.reduce((sum, r) => sum + (r.q2 || 0), 0) / totalTests;
    const avgQ3 = allTestRecords.reduce((sum, r) => sum + (r.q3 || 0), 0) / totalTests;

    // --- 計算各任務成功率 ---
    let taskSuccessCounts = [0, 0, 0, 0, 0, 0]; 
    let validTaskRecords = 0; // 有 taskSuccess 欄位的有效資料筆數

    allTestRecords.forEach(record => {
        // 檢查這筆資料是否有個別任務狀態
        if (record.taskSuccess && Array.isArray(record.taskSuccess) && record.taskSuccess.length > 0) {
            validTaskRecords++;
            record.taskSuccess.forEach((isSuccess, idx) => {
                if (isSuccess === true && idx < 6) {
                    taskSuccessCounts[idx]++;
                }
            });
        }
    });

    console.log(`統計完成: 總筆數 ${totalTests}, 包含任務細節的筆數 ${validTaskRecords}`, taskSuccessCounts);

    // 渲染各任務圖表
    if (taskChartEl) {
        if (validTaskRecords === 0) {
            // 這是正常現象，如果是舊資料
            taskChartEl.innerHTML = '<div style="color: #64748b;">目前僅有舊格式資料。<br>請新增一筆測試紀錄，圖表將會自動出現。</div>';
        } else {
            let chartHtml = '';
            const taskNames = ['任務一', '任務二', '任務三', '任務四', '任務五', '任務六'];
            
            taskSuccessCounts.forEach((count, idx) => {
                const percentage = Math.round((count / validTaskRecords) * 100);
                // 顏色邏輯: 80%以上綠色, 50%以上黃色, 以下紅色
                const colorClass = percentage >= 80 ? '#4CAF50' : (percentage >= 50 ? '#FFC107' : '#F44336'); 
                
                chartHtml += `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; color: #333;">
                        <span>${taskNames[idx]}</span>
                        <span style="font-weight: bold;">${percentage}% (${count}/${validTaskRecords}人)</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: ${colorClass}; transition: width 0.5s ease;"></div>
                    </div>
                </div>`;
            });
            taskChartEl.innerHTML = chartHtml;
        }
    } else {
        console.warn("找不到 id='task-success-chart' 的元素，請檢查 index.html");
    }

    // 更新原本的數字顯示
    if (totalUsersEl) totalUsersEl.textContent = totalTests.toString();
    if (avgQ1El) avgQ1El.textContent = avgQ1.toFixed(1);
    if (avgQ2El) avgQ2El.textContent = avgQ2.toFixed(1);
    if (avgQ3El) avgQ3El.textContent = avgQ3.toFixed(1);

    // 更新原本的進度條
    if (barQ1El) barQ1El.style.width = `${(avgQ1 / 5) * 100}%`;
    if (barQ2El) barQ2El.style.width = `${(avgQ2 / 10) * 100}%`;
    if (barQ3El) barQ3El.style.width = `${(avgQ3 / 10) * 100}%`;
}

// --- 6. Export to Window (for HTML onclick) ---
window.switchTab = switchTab;
window.saveData = saveData;
window.deleteRecord = deleteRecord;
window.nextCard = nextCard;
window.prevCard = prevCard;

function updateTimerDisplay(taskId, display) {
    const seconds = taskTimers[taskId].seconds;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// --- 5. Data Handling (Save & Delete) ---

// 儲存資料到 Firebase
async function saveData() {
    const form = document.getElementById('testForm');
    if (!form) return;
    
    // 1. 基本資料
    // 修改：改用 getElementById 來抓取，比較安全
    const userNameInput = document.getElementById('user-id');
    
    // 如果找不到 ID，嘗試用舊方法 (向下相容)，但建議您一定要去改 HTML
    const finalInput = userNameInput || form.querySelector('input[placeholder="例如：User_01"]') || form.querySelector('input[placeholder="例如: User_01"]');
    
    const userName = finalInput ? finalInput.value.trim() : '';
    
    if (!userName) {
        alert("請至少填寫受訪者編號");
        if(finalInput) finalInput.focus();
        return;
    }

    // --- 修改開始：更新讀取邏輯 ---
    
    // 讀取年齡 (原本的第一個 select)
    const ageSelect = form.querySelector('select'); // 因為少了一個 select，現在只剩下年齡是 select
    const age = ageSelect ? ageSelect.value : '-';

    // 讀取性別 (新的 radio button 讀取方式)
    const genderEl = form.querySelector('input[name="gender"]:checked');
    const gender = genderEl ? genderEl.value : '-';

    // --- 修改結束 ---

    const crop = form.querySelector('input[placeholder="例如: 水稻、茶葉"]')?.value || '-';
    
    // --- 修改開始：更新讀取手機型號邏輯 ---
    // 舊的寫法 (依賴順序，容易出錯)：
    // const allInputs = form.querySelectorAll('input[type="text"]');
    // const device = allInputs[2] ? allInputs[2].value : '-';

    // 新的寫法 (明確抓取 ID 並合併)：
    const brandSelect = document.getElementById('phone-brand');
    const modelInput = document.getElementById('phone-model');
    
    let device = '-';
    if (brandSelect && modelInput) {
        const brand = brandSelect.value;
        const model = modelInput.value.trim();
        // 組合字串，例如 "Apple 14 Pro"
        device = (brand && model) ? `${brand} ${model}` : (brand || model || '-');
    }
    // --- 修改結束 ---
    
    // 2. 任務數據 (包含計時器與成功狀態)
    const taskCards = document.querySelectorAll('.task-card');
    let successCount = 0;
    let taskNotes = [];
    let taskTimes = []; 
    let taskSuccess = []; // 新增：記錄每個任務是否成功

    taskCards.forEach((card, index) => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        const isSuccess = checkbox && checkbox.checked;
        
        if (isSuccess) successCount++;
        taskSuccess.push(isSuccess); 
        
        const textarea = card.querySelector('textarea');
        taskNotes.push(textarea ? textarea.value.trim() || '-' : '-');
        
        // 取得計時器時間
        const taskId = `task${index + 1}`;
        if (taskTimers && taskTimers[taskId]) {
            taskTimes.push(taskTimers[taskId].seconds);
        } else {
            taskTimes.push(0);
        }
    });

    // 3. 評分與質化回饋
    const q1 = document.getElementById('q1')?.value || 0;
    const q2 = document.getElementById('q2')?.value || 0;
    const q3 = document.getElementById('q3')?.value || 0;
    const textPros = document.getElementById('text-pros')?.value || '-';
    const textCons = document.getElementById('text-cons')?.value || '-';
    const textIdeas = document.getElementById('text-ideas')?.value || '-';
    const textNotes = document.getElementById('text-notes')?.value || '-';

    // 建立資料物件
    const currentRecord = {
        id: userName,
        age, gender, crop, device,
        successCount,
        taskSuccess, // 新增欄位
        taskNotes,
        taskTimes,
        q1: parseInt(q1),
        q2: parseInt(q2),
        q3: parseInt(q3),
        pros: textPros,
        cons: textCons,
        ideas: textIdeas,
        notes: textNotes,
        timestamp: new Date().toISOString()
    };

    // 上傳到 Firestore
    try {
        const btn = document.querySelector('.cta-btn');
        if(btn) { btn.disabled = true; btn.textContent = "儲存中..."; }

        await addDoc(collection(db, DB_COLLECTION), currentRecord);
        
        // 成功提示後刷新頁面
        alert(`資料已上傳雲端！\n受訪者: ${userName}\n\n點擊確定後將重新整理頁面。`);
        location.reload();
        
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("儲存失敗，請檢查網路連線");
        // 失敗時恢復按鈕狀態
        const btn = document.querySelector('.cta-btn');
        if(btn) { btn.disabled = false; btn.textContent = "儲存本位測試者資料"; }
    }
}

// 刪除資料函數
async function deleteRecord(docId) {
    if(!confirm("確定要刪除這筆資料嗎？")) return;
    
    try {
        await deleteDoc(doc(db, DB_COLLECTION, docId));
        console.log("Document deleted:", docId);
        // UI 更新會由 onSnapshot 自動觸發
    } catch (e) {
        console.error("Error deleting document: ", e);
        alert("刪除失敗");
    }
}

// --- 全螢幕控制功能 ---
function toggleFullScreenMode() {
    const section = document.getElementById('user-cards');
    if (section) {
        section.classList.toggle('fullscreen-mode');
    }
}

// 加入鍵盤監聽：按 ESC 也可以退出全螢幕
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const section = document.getElementById('user-cards');
        if (section && section.classList.contains('fullscreen-mode')) {
            section.classList.remove('fullscreen-mode');
        }
    }
});

// --- 6. Export to Window ---
// 把新的函數加到這裡
window.toggleFullScreenMode = toggleFullScreenMode; 
window.switchTab = switchTab;
window.saveData = saveData;
window.deleteRecord = deleteRecord;
window.nextCard = nextCard;
window.prevCard = prevCard;