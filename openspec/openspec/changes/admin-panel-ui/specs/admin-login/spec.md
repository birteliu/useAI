## ADDED Requirements

### Requirement: Login page layout
系統 SHALL 提供一個置中的登入表單頁面（login.html），不包含 navbar 或 sidebar。

#### Scenario: Display login form
- **WHEN** 使用者開啟 login.html
- **THEN** 頁面顯示置中的登入框，包含 Logo 圖片、「帳號登入」標題、帳號輸入欄、密碼輸入欄、驗證碼輸入欄（含驗證碼圖片）、登入按鈕

### Requirement: Login form fields
登入表單 SHALL 包含帳號（text）、密碼（password）、驗證碼（text + 驗證碼圖片）三個輸入欄位，每個欄位前方帶有對應的 icon 標示。

#### Scenario: Form field structure
- **WHEN** 使用者查看登入表單
- **THEN** 每個輸入欄位使用 input-group 結構，左側顯示 icon 和標籤文字，右側為輸入框

### Requirement: Login button navigation
登入按鈕 SHALL 導向儀表板頁面（index.html）。

#### Scenario: Click login button
- **WHEN** 使用者點擊登入按鈕
- **THEN** 頁面跳轉至 index.html
