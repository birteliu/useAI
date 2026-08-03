## ADDED Requirements

### Requirement: Account list table
人員帳號管理頁面（accounts.html）SHALL 以表格顯示所有帳號，欄位包含 #、姓名、帳號、角色、狀態、操作。

#### Scenario: Display account list
- **WHEN** 使用者進入 accounts.html
- **THEN** 頁面顯示帳號列表表格，每列包含序號、姓名、帳號名稱、角色（管理員/編輯者）、狀態（啟用/停用 badge）、編輯與刪除按鈕

### Requirement: Account modal form
新增與編輯帳號 SHALL 使用 Modal 表單，不跳轉至獨立頁面。

#### Scenario: Open add account modal
- **WHEN** 使用者點擊「新增帳號」按鈕
- **THEN** 彈出 Modal 表單，包含姓名輸入框（必填）、帳號輸入框（必填）、密碼輸入框（必填）、角色 radio（管理員/編輯者）、狀態 radio（啟用/停用）、取消與儲存按鈕

#### Scenario: Open edit account modal
- **WHEN** 使用者點擊某筆帳號的「編輯」按鈕
- **THEN** 彈出 Modal 表單，欄位結構同新增，表單標題顯示「編輯帳號」

### Requirement: Account deletion confirmation
刪除帳號 SHALL 顯示確認 Modal。

#### Scenario: Delete account with confirmation
- **WHEN** 使用者點擊某筆帳號的「刪除」按鈕
- **THEN** 彈出確認 Modal 詢問「確定要刪除嗎？」，提供確認與取消按鈕

### Requirement: Account status badge
帳號狀態 SHALL 使用顏色 badge 區分啟用與停用。

#### Scenario: Status badge display
- **WHEN** 使用者查看帳號列表的狀態欄
- **THEN** 啟用顯示為綠色/teal 標籤、停用顯示為灰色標籤

### Requirement: Account role badge
帳號角色 SHALL 使用 badge 區分管理員與編輯者。

#### Scenario: Role badge display
- **WHEN** 使用者查看帳號列表的角色欄
- **THEN** 管理員顯示為深色標籤、編輯者顯示為淺色標籤
