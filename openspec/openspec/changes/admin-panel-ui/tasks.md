## 1. 專案初始化

- [x] 1.1 建立 website/ 資料夾結構（css/、css/vendors/、fonts/、images/、js/）
- [x] 1.2 從 example/ 複製 css/style.css、css/vendors/bootstrap-icons.css、js/bootstrap.bundle.min.js、js/main.js 至 website/
- [x] 1.3 從 example/ 複製 fonts/ 目錄所有字型檔至 website/fonts/
- [x] 1.4 從 example/ 複製 images/favicon.ico、images/logo.png 至 website/images/

## 2. 登入頁面

- [x] 2.1 建立 website/login.html — 置中登入表單（帳號、密碼、驗證碼 + 圖片）、Logo、登入按鈕導向 index.html

## 3. 共用 Sidebar 與 Navbar 結構

- [x] 3.1 定義共用 navbar 結構 — fixed-top navbar 含系統名稱、使用者名稱按鈕、登出按鈕
- [x] 3.2 定義共用 offcanvas sidebar 結構 — Logo、儀表板連結、「前臺管理」群組標題（最新消息/活動消息/照片日記）、「系統管理」群組標題（人員帳號）、群組永遠展開

## 4. 儀表板

- [x] 4.1 建立 website/index.html — 含共用 navbar + sidebar
- [x] 4.2 實作 4 張統計卡片（最新消息、活動消息、照片日記、LINE Bot 加入人數），每張含 icon、標題、本月/累計數字
- [x] 4.3 實作網站瀏覽人次趨勢區域（左下），使用 styled div 模擬月度長條圖
- [x] 4.4 實作近期更新動態列表（右下），含日期與操作描述

## 5. 最新消息管理

- [x] 5.1 建立 website/news.html — 列表頁，含搜尋區（狀態下拉、關鍵字、清除/搜尋按鈕）、資料表格（#/標題/發布日期/狀態badge/置頂/操作）、分頁元件、新增按鈕、刪除確認 Modal
- [x] 5.2 建立 website/news-edit.html — 編輯頁，含標題（必填）、封面圖片上傳預覽、內容 textarea（必填）、發布日期、狀態 radio、置頂 checkbox、排序、底部固定操作列（取消/儲存）

## 6. 活動消息管理

- [x] 6.1 建立 website/events.html — 列表頁，含搜尋區、資料表格（#/標題/活動日期/狀態badge/操作）、分頁元件、新增按鈕、刪除確認 Modal
- [x] 6.2 建立 website/event-edit.html — 編輯頁，含標題（必填）、封面圖片上傳預覽、內容 textarea（必填）、活動日期起迄、活動地點、報名連結、狀態 radio、排序、底部固定操作列

## 7. 照片日記回顧管理

- [x] 7.1 建立 website/photo-diary.html — 卡片格線列表頁，含搜尋區（分類下拉、關鍵字）、4 欄卡片格線（封面圖/標題/日期/狀態badge/編輯刪除按鈕）、分頁元件、新增按鈕、刪除確認 Modal
- [x] 7.2 建立 website/photo-diary-edit.html — 編輯頁，含標題（必填）、描述 textarea、多圖上傳按鈕與圖片預覽格線（each with 刪除按鈕）、日期、分類/標籤、狀態 radio、排序、底部固定操作列

## 8. 人員帳號管理

- [x] 8.1 建立 website/accounts.html — 帳號列表表格（#/姓名/帳號/角色badge/狀態badge/操作）、新增帳號按鈕、新增/編輯 Modal 表單（姓名必填/帳號必填/密碼必填/角色radio/狀態radio）、刪除確認 Modal

## 9. 自訂樣式調整

- [x] 9.1 在 website/css/style.css 頂部追加後台系統所需的自訂 CSS（sidebar 群組標題樣式、統計卡片樣式、狀態 badge 顏色、圖片預覽格線等）
