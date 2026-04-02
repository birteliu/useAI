## Why

客戶經營個人網站，需要一個後台管理系統讓非技術背景的使用者能自行管理與更新官網前臺所顯示的內容。目前尚無後台介面，所有內容更新都需要技術人員介入，效率低且不具擴展性。

## What Changes

- 新增完整的後台管理系統前端切版（純靜態 HTML），放置於 `website/` 資料夾
- 新增登入頁面，作為後台系統入口
- 新增儀表板首頁，顯示各內容類型的月度統計數據、網站瀏覽人次趨勢、LINE Bot 加入人數、近期更新動態
- 新增最新消息管理（列表頁 + 編輯頁），支援標題、封面圖、內容、發布日期、狀態（草稿/上架/下架）、置頂、排序
- 新增活動消息管理（列表頁 + 編輯頁），支援標題、封面圖、內容、活動日期區間、地點、報名連結、狀態、排序
- 新增照片日記回顧管理（卡片式列表頁 + 編輯頁），支援標題、描述、多圖上傳、日期、分類標籤、狀態、排序
- 新增人員帳號管理頁面，以表格 + Modal 表單方式管理帳號（姓名、帳號、密碼、角色、狀態）
- 沿用 example 資料夾的 UI template 風格（Bootstrap 5.3.7 + Bootstrap Icons + Teal 主色調）
- Sidebar 採用群組標題永遠展開方案：儀表板 / 前臺管理（最新消息、活動消息、照片日記）/ 系統管理（人員帳號）

## Capabilities

### New Capabilities
- `admin-login`: 後台登入頁面，帳號密碼驗證碼輸入表單
- `admin-dashboard`: 儀表板首頁，統計卡片、瀏覽人次趨勢、近期動態列表
- `news-management`: 最新消息管理，含列表搜尋篩選分頁與新增編輯表單
- `event-management`: 活動消息管理，含列表搜尋篩選分頁與新增編輯表單
- `photo-diary-management`: 照片日記回顧管理，含卡片式列表與多圖上傳編輯表單
- `account-management`: 人員帳號管理，表格列表與 Modal 新增編輯表單

### Modified Capabilities

（無既有 capabilities）

## Impact

- 新增 `website/` 資料夾及其下所有靜態資源（HTML、CSS、JS、fonts、images）
- CSS/JS/fonts 資源從 `example/` 複製為基底，再依後台需求調整自訂樣式
- 共 9 個 HTML 頁面：login.html、index.html、news.html、news-edit.html、events.html、event-edit.html、photo-diary.html、photo-diary-edit.html、accounts.html
- 不涉及後端 API 或資料庫，純前端靜態切版
