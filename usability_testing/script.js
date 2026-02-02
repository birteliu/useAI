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
const totalCards = 5;

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
});

// --- 5. Data Logic: Save, Delete, Render ---

// Save to Firebase
async function saveData() {
    const form = document.getElementById('testForm');
    if (!form) return;
    
    // 1. Basic Info
    const userNameInput = form.querySelector('input[placeholder="例如: User_01"]');
    const userName = userNameInput ? userNameInput.value.trim() : '';
    
    if (!userName) {
        alert("⚠️ 請至少填寫受訪者編號");
        if(userNameInput) userNameInput.focus();
        return;
    }

    const selects = form.querySelectorAll('select');
    const age = selects[0] ? selects[0].value : '-';
    const gender = selects[1] ? selects[1].value : '-';
    const crop = form.querySelector('input[placeholder="例如: 水稻、茶葉"]')?.value || '-';
    
    // Attempt to find device input safely
    const allInputs = form.querySelectorAll('input[type="text"]');
    const device = allInputs[2] ? allInputs[2].value : '-';
    
    // 2. Task Stats
    const taskCards = document.querySelectorAll('.task-card');
    let successCount = 0;
    let taskNotes = [];

    taskCards.forEach((card) => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) successCount++;
        const textarea = card.querySelector('textarea');
        taskNotes.push(textarea ? textarea.value.trim() || '-' : '-');
    });

    // 3. Scores & Qualitative
    const q1 = document.getElementById('q1')?.value || 0;
    const q2 = document.getElementById('q2')?.value || 0;
    const q3 = document.getElementById('q3')?.value || 0;

    const textPros = document.getElementById('text-pros')?.value || '-';
    const textCons = document.getElementById('text-cons')?.value || '-';
    const textIdeas = document.getElementById('text-ideas')?.value || '-';
    const textNotes = document.getElementById('text-notes')?.value || '-';

    // Build Record
    const currentRecord = {
        id: userName,
        age, gender, crop, device,
        successCount,
        taskNotes,
        q1: parseInt(q1),
        q2: parseInt(q2),
        q3: parseInt(q3),
        pros: textPros,
        cons: textCons,
        ideas: textIdeas,
        notes: textNotes,
        timestamp: new Date().toISOString()
    };

    // Upload
    try {
        const btn = document.querySelector('.cta-btn');
        if(btn) { btn.disabled = true; btn.textContent = "儲存中..."; }

        await addDoc(collection(db, DB_COLLECTION), currentRecord);
        
        alert(`🎉 資料已上傳雲端！\n編號: ${userName}`);
        // form.reset(); // 可選：清空表單
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("儲存失敗，請檢查網路連線");
    } finally {
        const btn = document.querySelector('.cta-btn');
        if(btn) { btn.disabled = false; btn.textContent = "儲存本位測試者資料"; }
    }
}

// Delete from Firebase
async function deleteRecord(docId) {
    if(!docId) return;
    if(confirm(`確定要從雲端永久刪除這筆資料嗎？`)) {
        try {
            await deleteDoc(doc(db, DB_COLLECTION, docId));
        } catch(e) {
            console.error("刪除失敗", e);
            alert("刪除失敗: " + e.message);
        }
    }
}

// Render Grid
function renderAnalysisGrid() {
    const gridContainer = document.getElementById('analysisGrid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';

    if (allTestRecords.length === 0) {
        gridContainer.innerHTML = `
            <p style="text-align:center; grid-column: 1/-1; color:#666; padding: 20px;">
                目前無資料，請等待讀取或新增資料
            </p>`;
        return;
    }

    allTestRecords.forEach((record) => {
        const card = document.createElement('div');
        card.className = 'record-card';
        
        const badgeColor = record.successCount >= 4 ? 'orange' : (record.successCount >= 3 ? 'yellow' : 'red');

        const taskHtml = record.taskNotes.map((note, index) => `
            <div class="task-item">
                <strong>任務 ${index + 1}:</strong> ${note}
            </div>
        `).join('');

        card.innerHTML = `
            <div class="card-actions">
                <button class="delete-btn" onclick="deleteRecord('${record.docId}')" title="刪除">✖</button>
            </div>

            <div class="record-header">
                <h4>${record.id}</h4>
                <span class="badge ${badgeColor}" style="margin-right: 25px;">${record.successCount} / 5 成功</span> 
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
    console.log("Dashboard update triggered.");
}

// --- 6. Export to Window (for HTML onclick) ---
window.switchTab = switchTab;
window.saveData = saveData;
window.deleteRecord = deleteRecord;
window.nextCard = nextCard;
window.prevCard = prevCard;