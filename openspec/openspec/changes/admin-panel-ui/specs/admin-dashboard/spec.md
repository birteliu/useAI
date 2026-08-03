## ADDED Requirements

### Requirement: Dashboard statistics cards
儀表板 SHALL 在頁面上方顯示 4 張統計卡片：最新消息本月/累計則數、活動消息本月/累計則數、照片日記本月/累計篇數、LINE Bot 本月加入/累計人數。

#### Scenario: Display four statistics cards
- **WHEN** 使用者進入儀表板頁面（index.html）
- **THEN** 頁面上方以 4 欄格線顯示統計卡片，每張卡片包含圖示、標題、本月數字、累計數字

### Requirement: Website traffic trend
儀表板 SHALL 在左下區域顯示網站瀏覽人次的月度趨勢，使用 HTML styled div 模擬長條圖。

#### Scenario: Display traffic bar chart
- **WHEN** 使用者查看儀表板左下區域
- **THEN** 顯示近數月的瀏覽人次，每月一列，包含月份標籤、進度條（寬度代表數值）、人次數字

### Requirement: Recent activity list
儀表板 SHALL 在右下區域顯示近期更新動態列表，包含日期、操作類型、內容摘要。

#### Scenario: Display recent updates
- **WHEN** 使用者查看儀表板右下區域
- **THEN** 顯示最近的內容更新紀錄，每筆包含日期與操作描述

### Requirement: Dashboard shared layout
儀表板 SHALL 使用共用的 navbar + offcanvas sidebar 結構，sidebar 包含群組標題（儀表板、前臺管理、系統管理）與對應子項，群組永遠展開。

#### Scenario: Sidebar navigation structure
- **WHEN** 使用者開啟 sidebar
- **THEN** 顯示 Logo、儀表板連結、「前臺管理」群組標題下方有最新消息管理 / 活動消息管理 / 照片日記回顧三個子項、「系統管理」群組標題下方有人員帳號管理子項
