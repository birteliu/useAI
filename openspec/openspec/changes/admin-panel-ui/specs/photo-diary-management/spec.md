## ADDED Requirements

### Requirement: Photo diary card grid list
照片日記列表頁（photo-diary.html）SHALL 使用卡片格線（4 欄）呈現，每張卡片包含縮圖、標題、日期、狀態標籤、操作按鈕。

#### Scenario: Display photo diary card grid
- **WHEN** 使用者進入 photo-diary.html
- **THEN** 頁面顯示搜尋區（分類下拉選單、關鍵字輸入框、清除按鈕、搜尋按鈕）、卡片格線（每張卡片含封面圖、標題、日期、狀態 badge、編輯/刪除按鈕）、底部分頁元件

### Requirement: Photo diary list actions
列表頁 SHALL 提供新增、編輯、刪除操作。

#### Scenario: Add new photo diary
- **WHEN** 使用者點擊「新增日記」按鈕
- **THEN** 頁面跳轉至 photo-diary-edit.html

#### Scenario: Edit existing photo diary
- **WHEN** 使用者點擊某張卡片的「編輯」按鈕
- **THEN** 頁面跳轉至 photo-diary-edit.html

#### Scenario: Delete photo diary with confirmation
- **WHEN** 使用者點擊某張卡片的「刪除」按鈕
- **THEN** 彈出確認 Modal 詢問「確定要刪除嗎？」，提供確認與取消按鈕

### Requirement: Photo diary edit form with multi-image upload
照片日記編輯頁（photo-diary-edit.html）SHALL 提供多圖上傳區域與完整表單。

#### Scenario: Display photo diary edit form
- **WHEN** 使用者進入 photo-diary-edit.html
- **THEN** 頁面顯示標題輸入框（必填）、描述 textarea、照片上傳按鈕與圖片預覽格線（每張圖可刪除）、日期選擇、分類/標籤輸入框、狀態 radio（草稿/上架/下架）、排序輸入框

#### Scenario: Multi-image preview area
- **WHEN** 使用者查看照片上傳區域
- **THEN** 顯示「選擇圖片」按鈕，下方以格線排列已上傳圖片的縮圖預覽，每張圖片右上角有刪除按鈕（垃圾桶 icon）

#### Scenario: Fixed bottom action bar
- **WHEN** 使用者在編輯頁面中
- **THEN** 頁面底部固定顯示「取消」和「儲存」按鈕

### Requirement: Photo diary status display
卡片上的狀態 SHALL 使用顏色標籤（badge）區分草稿、上架、下架。

#### Scenario: Status badge on cards
- **WHEN** 使用者查看卡片格線
- **THEN** 每張卡片的狀態位置顯示對應顏色的 badge（草稿灰色、上架 teal、下架橘色）

### Requirement: Photo diary pagination
列表頁 SHALL 在底部顯示分頁元件。

#### Scenario: Display pagination
- **WHEN** 使用者查看列表底部
- **THEN** 顯示「顯示 1-8 / 共 N 筆」文字，以及上一頁、頁碼數字、下一頁按鈕
