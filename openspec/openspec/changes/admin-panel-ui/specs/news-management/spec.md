## ADDED Requirements

### Requirement: News list page
最新消息列表頁（news.html）SHALL 提供搜尋區域、資料表格、分頁元件。

#### Scenario: Display news list with search
- **WHEN** 使用者進入 news.html
- **THEN** 頁面顯示搜尋區（狀態下拉選單、關鍵字輸入框、清除按鈕、搜尋按鈕）、資料表格（欄位：#、標題、發布日期、狀態、置頂、操作）、底部分頁元件

### Requirement: News list actions
列表頁 SHALL 提供新增、編輯、刪除操作按鈕。

#### Scenario: Add new news
- **WHEN** 使用者點擊「新增消息」按鈕
- **THEN** 頁面跳轉至 news-edit.html

#### Scenario: Edit existing news
- **WHEN** 使用者點擊某筆消息的「編輯」按鈕
- **THEN** 頁面跳轉至 news-edit.html

#### Scenario: Delete news with confirmation
- **WHEN** 使用者點擊某筆消息的「刪除」按鈕
- **THEN** 彈出確認 Modal 詢問「確定要刪除嗎？」，提供確認與取消按鈕

### Requirement: News status display
列表中的狀態欄位 SHALL 使用顏色標籤（badge）區分草稿、上架、下架三種狀態。

#### Scenario: Status badge colors
- **WHEN** 使用者查看列表中的狀態欄
- **THEN** 草稿顯示為灰色標籤、上架顯示為主色（teal）標籤、下架顯示為橘色標籤

### Requirement: News edit form
最新消息編輯頁（news-edit.html）SHALL 提供完整的表單欄位與底部固定操作列。

#### Scenario: Display news edit form
- **WHEN** 使用者進入 news-edit.html
- **THEN** 頁面顯示標題輸入框（必填）、封面圖片上傳區（含預覽）、內容 textarea（必填）、發布日期選擇、狀態 radio（草稿/上架/下架）、置頂 checkbox、排序輸入框

#### Scenario: Fixed bottom action bar
- **WHEN** 使用者在編輯頁面中
- **THEN** 頁面底部固定顯示「取消」和「儲存」按鈕

### Requirement: News pagination
列表頁 SHALL 在底部顯示分頁元件，包含目前顯示筆數/總筆數資訊與頁碼按鈕。

#### Scenario: Display pagination
- **WHEN** 使用者查看列表底部
- **THEN** 顯示「顯示 1-10 / 共 N 筆」文字，以及上一頁、頁碼數字、下一頁按鈕
