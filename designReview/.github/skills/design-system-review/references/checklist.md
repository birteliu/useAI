# 設計系統審核 — 完整檢查清單

此清單用於逐項審核設計稿是否符合設計系統基礎規範。

---

## 1. 色彩系統 (Color System)

### 必要項目

- [ ] **主色 (Primary)** 已定義
  - [ ] 包含 light / base / dark 至少 3 個變體
  - [ ] 已標示 HEX / RGB / HSL 色碼
- [ ] **輔助色 (Secondary)** 已定義
  - [ ] 至少 1 組輔助色 + 變體
- [ ] **語意色 (Semantic Colors)** 已定義
  - [ ] Success 成功色（綠色系）
  - [ ] Warning 警告色（黃/橙色系）
  - [ ] Error 錯誤色（紅色系）
  - [ ] Info 資訊色（藍色系）
  - [ ] 每組語意色包含 light / base / dark 變體
- [ ] **灰階 (Neutral / Gray Scale)** 已定義
  - [ ] 至少 5 階灰色
  - [ ] 包含純白 (#FFFFFF 或近白) 與純黑 (#000000 或近黑)
  - [ ] 灰階間有明顯的視覺區隔
- [ ] **背景色 / 前景色配對** 已定義
  - [ ] 每組配對標示用途（如：卡片背景 + 標題文字）

### 建議項目

- [ ] 色彩命名採用語意化命名（如 `color-primary-500` 而非 `blue-500`）
- [ ] 提供深色模式 (Dark Mode) 色彩對照表
- [ ] 色板以階梯式展示（50, 100, 200 ... 900）

---

## 2. 字體系統 (Typography)

### 必要項目

- [ ] **字型家族 (Font Family)** 已定義
  - [ ] 主要字型已指定
  - [ ] 備用字型 (Fallback) 已指定
  - [ ] 中文字型已指定（適用於中文介面）
  - [ ] 英文/數字字型已指定
- [ ] **字級階層 (Type Scale)** 已定義
  - [ ] Display / H1（最大標題）
  - [ ] H2（次標題）
  - [ ] H3（段落標題）
  - [ ] H4 / H5 / H6（小標題）
  - [ ] Body Large（大內文）
  - [ ] Body（標準內文）
  - [ ] Body Small / Caption（小字說明）
  - [ ] Overline / Label（標籤文字）
  - [ ] 每個字級標示 px / rem 數值
- [ ] **字重 (Font Weight)** 已定義
  - [ ] Regular (400)
  - [ ] Medium (500)（建議）
  - [ ] Semi-Bold (600)（建議）
  - [ ] Bold (700)
- [ ] **行高 (Line Height)** 已定義
  - [ ] 每個字級有對應的行高數值
  - [ ] 行高使用倍率標示（如 1.5）或 px 數值

### 建議項目

- [ ] 字間距 (Letter Spacing) 已定義
- [ ] 段落間距 (Paragraph Spacing) 已定義
- [ ] 提供中英文混排的範例

---

## 3. 間距系統 (Spacing)

### 必要項目

- [ ] **基礎單位 (Base Unit)** 已定義（建議 4px 或 8px）
- [ ] **間距比例尺 (Spacing Scale)** 已定義
  - [ ] 至少 6 級間距
  - [ ] 建議刻度：4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
  - [ ] 每級標示 px 數值與 token 名稱
- [ ] **內距 (Padding) 規範** 已說明
- [ ] **外距 (Margin) 規範** 已說明

### 建議項目

- [ ] 提供元件間距的應用範例
- [ ] 區分 inline spacing 與 stack spacing

---

## 4. 圓角 (Border Radius)

### 必要項目

- [ ] **圓角層級** 已定義
  - [ ] `none` — 0px
  - [ ] `small` — 如 2px 或 4px
  - [ ] `medium` — 如 8px
  - [ ] `large` — 如 12px 或 16px
  - [ ] `full` — 9999px 或 50%（膠囊/圓形）
- [ ] 每級標示 px 數值

### 建議項目

- [ ] 標示各圓角層級的適用元件（如按鈕用 medium、卡片用 large）

---

## 5. 陰影 (Shadows / Elevation)

### 必要項目

- [ ] **陰影層級** 已定義
  - [ ] `low` / Level 1（微浮起）
  - [ ] `medium` / Level 2（中等浮起）
  - [ ] `high` / Level 3（明顯浮起）
- [ ] 每級包含完整 CSS box-shadow 參數
  - [ ] `offset-x`
  - [ ] `offset-y`
  - [ ] `blur-radius`
  - [ ] `spread-radius`
  - [ ] `color`（含透明度）

### 建議項目

- [ ] 提供陰影的適用場景說明（如卡片、下拉選單、Modal）
- [ ] 深色模式的陰影替代方案

---

## 6. 按鈕狀態 (Button States)

### 必要項目

針對每種按鈕類型（至少涵蓋 Primary / Secondary）：

- [ ] **Default** — 預設狀態樣式
- [ ] **Hover** — 滑鼠懸停樣式
- [ ] **Active / Pressed** — 點擊中樣式
- [ ] **Focus** — 鍵盤焦點樣式
  - [ ] 有可見的 focus ring / outline
  - [ ] focus ring 與背景有足夠對比
- [ ] **Disabled** — 不可操作樣式
  - [ ] 視覺上明顯降低對比度
  - [ ] 使用 `cursor: not-allowed` 或等效提示

### 按鈕類型應涵蓋

- [ ] **Primary Button** — 主要行動按鈕
- [ ] **Secondary Button** — 次要行動按鈕
- [ ] **Tertiary / Ghost Button** — 低強調按鈕（建議）
- [ ] **Destructive / Danger Button** — 破壞性操作按鈕（建議）
- [ ] **Icon Button** — 純圖示按鈕（建議）

### 建議項目

- [ ] Loading 載入中狀態
- [ ] 不同尺寸（Small / Medium / Large）
- [ ] 按鈕內含圖示的樣式

---

## 7. 表單狀態 (Form States)

### 必要項目

針對所有表單元件（Input / Select / Textarea / Checkbox / Radio）：

- [ ] **Default** — 預設狀態
- [ ] **Focus** — 聚焦中
  - [ ] 有可見的 focus indicator
- [ ] **Filled** — 已填寫內容
- [ ] **Error** — 錯誤狀態
  - [ ] 邊框變色（通常為紅色系）
  - [ ] 錯誤訊息文字樣式已定義
  - [ ] 錯誤圖示已定義（建議）
- [ ] **Disabled** — 不可操作
  - [ ] 背景灰化 / 文字淡化

### 表單元件應涵蓋

- [ ] Text Input（文字輸入框）
- [ ] Password Input（密碼輸入框）（建議）
- [ ] Textarea（多行文字區塊）
- [ ] Select / Dropdown（下拉選單）
- [ ] Checkbox（核取方塊）
- [ ] Radio Button（單選按鈕）
- [ ] Toggle / Switch（開關切換）（建議）

### 建議項目

- [ ] Success 驗證通過狀態
- [ ] Helper text（輔助說明文字）樣式
- [ ] Required field（必填欄位）標示
- [ ] Placeholder 樣式
- [ ] 字數限制提示樣式

---

## 8. 無障礙 (Accessibility — WCAG 2.1 Level A)

### 必要項目

- [ ] **文字對比度** 符合 WCAG 2.1 AA（Level A 不強制對比度，但建議至少達 AA）
  - [ ] 一般文字（< 18pt / < 14pt bold）：對比度 ≥ 4.5:1
  - [ ] 大型文字（≥ 18pt / ≥ 14pt bold）：對比度 ≥ 3:1
- [ ] **Focus indicator** 可見
  - [ ] 所有互動元件在鍵盤焦點時有可見的視覺指示
- [ ] **不僅靠顏色傳達資訊**
  - [ ] 錯誤狀態搭配圖示或文字，不僅用紅色表示
  - [ ] 連結除了顏色外有底線或其他視覺區分
- [ ] **互動元素尺寸**
  - [ ] 觸控目標至少 44×44px（行動裝置）
  - [ ] 桌面互動目標至少 24×24px

### 建議項目

- [ ] 提供每組色彩配對的對比度數值
- [ ] 通過 WCAG 2.1 AA 標準（對比度 ≥ 4.5:1）
- [ ] 提供色盲友善檢查結果

---

## 9. 圖示系統 (Icon System)

### 必要項目

- [ ] **圖示風格** 已定義且統一
  - [ ] Outline（線性）/ Filled（填充）/ Duotone（雙色）擇一
  - [ ] 全系統使用同一風格
- [ ] **圖示尺寸** 已定義
  - [ ] 至少 2-3 種尺寸（如 16px, 24px, 32px）
  - [ ] 標示各尺寸的適用場景
- [ ] **筆畫粗細 (Stroke Width)** 已統一
  - [ ] 全系統使用一致的 stroke width（如 1.5px）
- [ ] **格線系統 (Grid)** 已定義
  - [ ] 圖示繪製基準格線（如 24×24 grid with 2px padding）

### 建議項目

- [ ] 提供圖示命名規範
- [ ] 提供常用圖示清單
- [ ] 圖示包含 Hover / Active 狀態變化說明

---

## 10. 風格一致性 (Visual Consistency)

### 必要項目

- [ ] 所有元件使用同一套色彩 token，無色碼直接硬編碼
- [ ] 圓角使用定義好的層級，無隨意數值
- [ ] 陰影使用定義好的層級
- [ ] 間距使用定義好的比例尺
- [ ] 字型使用統一，無隨意混用不同字型

### 建議項目

- [ ] 提供元件組合範例頁面（如表單頁面、列表頁面）
- [ ] 提供深色模式 / 淺色模式切換範例
- [ ] 提供 RWD 響應式斷點定義
