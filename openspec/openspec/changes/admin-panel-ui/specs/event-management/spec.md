## ADDED Requirements

### Requirement: Event list page
活動消息列表頁（events.html）SHALL 提供搜尋區域、資料表格、分頁元件。

#### Scenario: Display event list with search
- **WHEN** 使用者進入 events.html
- **THEN** 頁面顯示搜尋區（狀態下拉選單、關鍵字輸入框、清除按鈕、搜尋按鈕）、資料表格（欄位：#、標題、活動日期、狀態、操作）、底部分頁元件

### Requirement: Event list actions
列表頁 SHALL 提供新增、編輯、刪除操作按鈕。

#### Scenario: Add new event
- **WHEN** 使用者點擊「新增活動」按鈕
- **THEN** 頁面跳轉至 event-edit.html

#### Scenario: Edit existing event
- **WHEN** 使用者點擊某筆活動的「編輯」按鈕
- **THEN** 頁面跳轉至 event-edit.html

#### Scenario: Delete event with confirmation
- **WHEN** 使用者點擊某筆活動的「刪除」按鈕
- **THEN** 彈出確認 Modal 詢問「確定要刪除嗎？」，提供確認與取消按鈕

### Requirement: Event status display
列表中的狀態欄位 SHALL 使用顏色標籤（badge）區分草稿、上架、下架三種狀態。

#### Scenario: Status badge colors
- **WHEN** 使用者查看列表中的狀態欄
- **THEN** 草稿顯示為灰色標籤、上架顯示為主色（teal）標籤、下架顯示為橘色標籤

### Requirement: Event edit form
活動消息編輯頁（event-edit.html）SHALL 提供完整的表單欄位與底部固定操作列。

#### Scenario: Display event edit form
- **WHEN** 使用者進入 event-edit.html
- **THEN** 頁面顯示標題輸入框（必填）、封面圖片上傳區（含預覽）、內容 textarea（必填）、活動日期起始日期選擇、活動日期結束日期選擇、活動地點輸入框、報名連結輸入框、狀態 radio（草稿/上架/下架）、排序輸入框

#### Scenario: Fixed bottom action bar
- **WHEN** 使用者在編輯頁面中
- **THEN** 頁面底部固定顯示「取消」和「儲存」按鈕

### Requirement: Event pagination
列表頁 SHALL 在底部顯示分頁元件，包含目前顯示筆數/總筆數資訊與頁碼按鈕。

#### Scenario: Display pagination
- **WHEN** 使用者查看列表底部
- **THEN** 顯示「顯示 1-10 / 共 N 筆」文字，以及上一頁、頁碼數字、下一頁按鈕
