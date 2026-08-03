## Context

客戶需要一個後台管理系統的前端切版，用於管理個人網站的前臺內容。目前工作區中有 `example/` 資料夾，內含完整的 Bootstrap 5.3.7 UI template（「純水設備維修保養系統」），提供了 navbar、offcanvas sidebar、表單、表格、Modal 等 UI 元件的樣式基礎。

本次設計基於 example template 的 layout pattern 和 CSS 體系，在 `website/` 資料夾建立一組獨立的靜態 HTML 頁面，不修改 example 原始檔案。

技術約束：
- 純前端靜態切版，無後端 API、無資料庫
- 使用者為非技術背景人員，UI 需直覺易操作
- 沿用 example 的 Bootstrap 5.3.7 + Bootstrap Icons + Teal 配色

## Goals / Non-Goals

**Goals:**
- 建立 9 個完整的靜態 HTML 頁面，涵蓋登入、儀表板、4 種內容管理（最新消息、活動消息、照片日記、帳號）
- 複用 example 的 CSS / JS / fonts 資源作為基底
- 所有內頁（除 login）共享一致的 navbar + offcanvas sidebar 結構
- Sidebar 採用群組標題永遠展開方案（方案 A）
- 表單頁面具備底部固定操作列（取消/儲存）
- 列表頁面具備搜尋區、資料表格/卡片、分頁元件
- 刪除操作提供確認 Modal

**Non-Goals:**
- 不實作後端邏輯、API 串接或資料庫
- 不實作 JavaScript 互動行為（排序、篩選、分頁的實際邏輯）
- 不實作 rich text editor（文字內容區域使用 textarea）
- 不實作圖表庫（儀表板的瀏覽趨勢用 HTML 模擬）
- 不建立 LINE Bot 頁面（僅在儀表板顯示統計佔位）

## Decisions

### 1. 檔案結構：獨立 website/ 資料夾

**選擇**: 在專案根目錄建立 `website/` 資料夾，從 example 複製 css / js / fonts / images 資源。

**理由**: 保持 example 原始範本不被修改，website 為獨立的完整切版專案。

**替代方案**: 在 example 內擴充 → 會混淆原始範本與新功能。

### 2. Sidebar 導航：群組標題永遠展開（方案 A）

**選擇**: Sidebar 使用純文字群組標題（「前臺管理」「系統管理」）搭配分隔線，子選單永遠展開。

**理由**: 目前僅 5 個子項，全部可見更直覺，避免不必要的展開/收合操作。

**替代方案**: Accordion 收合 → 項目太少時反而增加操作步驟。

### 3. 共用結構：Navbar + Sidebar 在每個 HTML 中重複

**選擇**: 每個 HTML 檔案各自包含完整的 navbar + offcanvas sidebar HTML。

**理由**: 純靜態切版無模板引擎，無法抽取共用元件。保持每個頁面獨立可瀏覽。

**替代方案**: 用 JS include → 增加複雜度且與切版目的不符。

### 4. 照片日記列表：卡片格線而非表格

**選擇**: photo-diary.html 使用 Bootstrap card grid（4 欄）呈現，而非 table。

**理由**: 照片日記以圖片為主，卡片格線能直覺呈現縮圖預覽。

**替代方案**: 表格 → 圖片在表格中的視覺效果差。

### 5. 人員帳號管理：Modal 表單而非獨立頁面

**選擇**: accounts.html 使用 Modal 進行新增/編輯，不建立獨立的 account-edit.html。

**理由**: 帳號欄位少（姓名、帳號、密碼、角色、狀態），Modal 操作更快捷。

### 6. 儀表板統計圖表：HTML 模擬

**選擇**: 瀏覽人次趨勢使用 styled div（進度條風格）模擬長條圖，不引入 Chart.js。

**理由**: 純切版階段不需要真正的圖表庫，HTML 模擬足以展示版面配置。未來接入後端時可替換為 Chart.js。

## Risks / Trade-offs

- **重複 HTML 結構** → 修改 navbar/sidebar 需同步更新 8 個檔案。未來可透過模板引擎解決，切版階段可接受。
- **無互動邏輯** → 搜尋、分頁、排序等功能僅有 UI 但無實際行為。前端接入後端時需補上 JS 邏輯。
- **圖片上傳為靜態** → 照片日記的多圖上傳僅呈現 UI，無實際上傳功能。
- **未引入圖表庫** → 儀表板的統計圖為 HTML 模擬，視覺精確度有限。後續整合可替換。
