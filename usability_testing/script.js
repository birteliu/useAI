// --- 1. Tab Switching Logic | 分頁切換 ---
function switchTab(tabId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Deactivate all buttons
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Highlight button
    const activeBtn = Array.from(buttons).find(btn => {
        const onClick = btn.getAttribute('onclick');
        return onClick && onClick.includes(tabId);
    });
    if (activeBtn) activeBtn.classList.add('active');
}

// --- 2. Live Update for Sliders | 滑桿數值即時顯示 ---
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

    // 新增：頁面載入時，直接渲染範例資料，讓您可以預覽效果
    renderAnalysisGrid();
    updateDashboard();
});

// --- 3. User Card Carousel Logic | 使用者卡片輪播 ---
let currentCardIndex = 1;
const totalCards = 5;

function updateCardDisplay() {
    // Hide all cards
    for (let i = 1; i <= totalCards; i++) {
        const card = document.getElementById(`card-${i}`);
        if(card) card.classList.remove('active');
    }
    // Show current
    const currentCard = document.getElementById(`card-${currentCardIndex}`);
    if(currentCard) currentCard.classList.add('active');
    
    // Update indicator
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

// --- 4. Data Storage | 資料儲存與管理 ---
// 修改：將原本的 [] 改為包含一筆範例物件
let allTestRecords = [
    {
        id: '範例_阿土伯',
        age: '60 歲以上',
        gender: '男',
        crop: '茶葉',
        device: 'OPPO Reno',
        successCount: 3, // 3/5 成功
        taskNotes: [
            '找不到註冊入口，誤觸廣告 banner', // Task 1
            '掃描 QR Code 時手不太穩，對焦很久', // Task 2
            '-', // Task 3
            '不知道「審核中」是什麼意思，卡住', // Task 4
            '順利完成' // Task 5
        ], 
        q1: 3, // 信心
        q2: 5, // 難易
        q3: 7, // 推薦
        pros: '按鈕很大，綠色看起來很舒服。', 
        cons: '字還是太小了，要一直戴眼鏡。步驟有點多，記不住。', 
        ideas: '能不能用語音說話就好？不要打字。', 
        notes: '操作動作較緩慢，對於輸入文字感到焦慮，需要旁人協助。'
    }
];

// Save Function
function saveData() {
    const form = document.getElementById('testForm');
    if (!form) return;
    
    // --- 1. Basic Info ---
    const userNameInput = form.querySelector('input[placeholder="例如: User_01"]');
    const userName = userNameInput ? userNameInput.value.trim() : '';
    
    if (!userName) {
        alert("⚠️ 請至少填寫受訪者編號 (例如: User_01)");
        if(userNameInput) userNameInput.focus();
        return;
    }

    // Selectors
    const selects = form.querySelectorAll('select');
    const age = selects[0] ? selects[0].value : '-';
    const gender = selects[1] ? selects[1].value : '-';

    const cropInput = form.querySelector('input[placeholder="例如: 水稻、茶葉"]');
    const crop = cropInput ? cropInput.value : '-';
    
    // Attempt to find device input safely
    const deviceInput = form.querySelector('input[placeholder*="iPhone"]') || (form.querySelectorAll('input[type="text"]')[2]);
    const device = deviceInput ? deviceInput.value : '-';
    
    // --- 2. Task Observations (Success & Notes) ---
    const taskCards = document.querySelectorAll('.task-card');
    let successCount = 0;
    let taskNotes = []; // Array to store notes for Task 1-5

    taskCards.forEach((card) => {
        // Checkbox
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) successCount++;

        // Note Textarea
        const textarea = card.querySelector('textarea');
        const note = textarea ? textarea.value.trim() : '';
        taskNotes.push(note || '-'); // Default to hyphen if empty
    });

    // --- 3. Scores ---
    const q1 = document.getElementById('q1') ? document.getElementById('q1').value : 0;
    const q2 = document.getElementById('q2') ? document.getElementById('q2').value : 0;
    const q3 = document.getElementById('q3') ? document.getElementById('q3').value : 0;

    // --- 4. Qualitative Interview Text ---
    const textPros = document.getElementById('text-pros') ? document.getElementById('text-pros').value : '-';
    const textCons = document.getElementById('text-cons') ? document.getElementById('text-cons').value : '-';
    const textIdeas = document.getElementById('text-ideas') ? document.getElementById('text-ideas').value : '-';
    const textNotes = document.getElementById('text-notes') ? document.getElementById('text-notes').value : '-';

    // 5. Create Record Object
    const currentRecord = {
        id: userName,
        age: age,
        gender: gender,
        crop: crop,
        device: device,
        successCount: successCount,
        taskNotes: taskNotes, // Array of 5 strings
        q1: parseInt(q1),
        q2: parseInt(q2),
        q3: parseInt(q3),
        pros: textPros || '-',
        cons: textCons || '-',
        ideas: textIdeas || '-',
        notes: textNotes || '-'
    };

    // 6. Store, Render Table, Update Charts
    allTestRecords.push(currentRecord);
    renderAnalysisGrid(); // 修改函數名稱
    updateDashboard();

    // 7. Feedback
    alert(`🎉 資料已儲存！\n編號: ${userName}\n成功任務: ${successCount} 個`);
}


function renderAnalysisGrid() {
    const gridContainer = document.getElementById('analysisGrid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = ''; // 清空舊資料

    if (allTestRecords.length === 0) {
        gridContainer.innerHTML = `
            <p style="text-align:center; grid-column: 1/-1; color:#666; padding: 20px;">
                尚無資料，請至「測試執行」頁面儲存數據
            </p>`;
        return;
    }

    // 反轉陣列，讓最新的資料顯示在最前面
    // 注意：為了方便刪除，我們需要知道原始 index，這裡我們用 filter 或直接操作原陣列 ID 比較好
    // 這裡改用 forEach 搭配 index 處理
    [...allTestRecords].reverse().forEach((record) => {
        const card = document.createElement('div');
        card.className = 'record-card';
        
        // 判斷成功率顏色
        const badgeColor = record.successCount >= 4 ? 'orange' : (record.successCount >= 3 ? 'yellow' : 'red');

        // 產生任務筆記 HTML
        const taskHtml = record.taskNotes.map((note, index) => `
            <div class="task-item">
                <strong>任務 ${index + 1}:</strong> ${note}
            </div>
        `).join('');

        card.innerHTML = `
            <!-- 新增刪除按鈕 -->
            <div class="card-actions">
                <button class="delete-btn" onclick="deleteRecord('${record.id}')" title="刪除此紀錄">✖</button>
            </div>

            <div class="record-header">
                <h4>${record.id}</h4>
                <span class="badge ${badgeColor}" style="margin-right: 25px;">${record.successCount} / 5 成功</span> 
                <!-- margin-right 是為了避開右上角的刪除按鈕 -->
            </div>
            
            <div class="user-tags">
                <span>${record.age}</span>
                <span>${record.gender}</span>
                <span>${record.crop}</span>
                <span>${record.device}</span>
            </div>

            <div class="score-row">
                <div class="score-item"><span>Q1信心</span>${record.q1}</div>
                <div class="score-item"><span>Q2難易</span>${record.q2}</div>
                <div class="score-item"><span>Q3推薦</span>${record.q3}</div>
            </div>

            <details>
                <summary>任務觀察筆記 (${record.taskNotes.filter(n => n !== '-').length} 則)</summary>
                <div class="detail-content">
                    ${taskHtml}
                </div>
            </details>

            <details>
                <summary>質化訪談回饋</summary>
                <div class="detail-content">
                    <div class="qa-item"><span class="qa-label">優點：</span>${record.pros}</div>
                    <div class="qa-item"><span class="qa-label">改進：</span>${record.cons}</div>
                    <div class="qa-item"><span class="qa-label">想法：</span>${record.ideas}</div>
                    <div class="qa-item"><span class="qa-label">觀察：</span>${record.notes}</div>
                </div>
            </details>
        `;
        
        gridContainer.appendChild(card);
    });
}

// 新增：刪除功能
function deleteRecord(recordId) {
    if(confirm(`確定要刪除「${recordId}」的這筆資料嗎？此動作無法復原。`)) {
        // 使用 filter 移除指定 ID 的資料
        allTestRecords = allTestRecords.filter(record => record.id !== recordId);
        
        // 重新渲染畫面
        renderAnalysisGrid();
        updateDashboard();
    }
}

// Placeholder for missing updateDashboard function
function updateDashboard() {
    console.log("Dashboard updated. Total records:", allTestRecords.length);
    // 此處應放入 Chart.js 的更新邏輯，若之後需要可再補上
}