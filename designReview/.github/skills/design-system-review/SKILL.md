---
name: design-system-review
description: "審核網頁/APP設計稿的設計系統規範完整性。Use when: reviewing design deliverables, validating design system, checking WCAG contrast, auditing button states, form states, icon system, typography, color system, spacing, shadows, border-radius, design tokens generation. 支援 PNG/SVG 圖檔審核與 JSON token 檔案驗證，審核後可產出 design token 展示頁面。"
argument-hint: "提供設計稿檔案路徑 (PNG/SVG/JSON) 進行審核"
---

# Design System Review — 設計系統通用基礎規範審核

## 目的

確保每個設計專案在交付前，已建立完整且一致的設計系統基礎規範。此 Skill 定義了設計師在製作設計稿時**至少需要產出的樣式與規範項目**，並提供審核流程與 design token 產出能力。

## 適用時機

- 設計師提交設計稿進行審核時
- 建立新專案的設計系統時
- 檢查現有設計系統的完整性時
- 需要產出 design token 頁面時

## 支援的輸入格式

| 格式 | 用途 |
|------|------|
| **PNG / SVG** | 設計稿截圖或匯出圖檔，透過視覺檢查審核 |
| **JSON** | Design token 定義檔，透過結構化驗證審核 |

---

## 審核流程

### Step 1：接收設計稿

請使用者提供以下任一格式的設計稿：
- 設計稿圖檔（PNG / SVG）
- Design token JSON 檔案

如果是圖檔，使用 `view_image` 工具讀取；如果是 JSON，使用 `read_file` 讀取。

### Step 2：依據檢查清單逐項審核

載入 [完整檢查清單](./references/checklist.md) 進行逐項審核。

審核涵蓋以下 **10 大類別**：

| # | 類別 | 關鍵檢查項 |
|---|------|-----------|
| 1 | 🎨 色彩系統 (Color System) | 主色系、輔助色、語意色、灰階色階 |
| 2 | 🔤 字體系統 (Typography) | 字型家族、字級階層、行高、字重 |
| 3 | 📐 間距系統 (Spacing) | 間距單位、間距比例尺 |
| 4 | 🔲 圓角 (Border Radius) | 圓角層級定義 |
| 5 | 🌑 陰影 (Shadows / Elevation) | 陰影層級定義 |
| 6 | 🔘 按鈕狀態 (Button States) | Default / Hover / Active / Focus / Disabled / Loading |
| 7 | 📝 表單狀態 (Form States) | Default / Focus / Error / Disabled / Success |
| 8 | ♿ 無障礙 (Accessibility) | WCAG 2.1 Level A 色彩對比度 |
| 9 | 🖼️ 圖示系統 (Icon System) | 圖示風格一致性、尺寸規範 |
| 10 | 🧩 風格一致性 (Consistency) | 跨元件視覺語言統一性 |

### Step 3：產出審核報告

以 Markdown 表格呈現審核結果：

```
| 類別 | 狀態 | 說明 |
|------|------|------|
| 色彩系統 | ✅ 通過 / ⚠️ 部分缺漏 / ❌ 缺少 | 具體說明 |
```

狀態定義：
- ✅ **通過**：該項目完整且符合規範
- ⚠️ **部分缺漏**：有定義但不完整，列出缺少項目
- ❌ **缺少**：完全未定義

### Step 4：產出 Design Token

審核完成後，根據設計稿內容產出 design token。參考 [Design Token 規格](./references/design-tokens.md)。

使用 [Token 頁面產生器](./scripts/generate-tokens-page.js) 產出可瀏覽的 HTML 展示頁面。

執行方式：
```
node .github/skills/design-system-review/scripts/generate-tokens-page.js <token-json-path> <output-html-path>
```

---

## 審核標準摘要

### 色彩系統 (Color System)

必須定義：
- **主色 (Primary)**：品牌主色 + 至少 3 個深淺變體（light / base / dark）
- **輔助色 (Secondary)**：至少 1 組輔助色 + 變體
- **語意色 (Semantic)**：Success（綠）、Warning（黃/橙）、Error（紅）、Info（藍）
- **灰階 (Neutral / Gray)**：至少 5 階灰色（含白與黑或近黑）
- **背景色 / 前景色配對**：明確標示哪些顏色用於背景、哪些用於文字

### 字體系統 (Typography)

必須定義：
- **字型家族 (Font Family)**：主要字型 + 備用字型（中英文分別指定）
- **字級階層 (Font Size Scale)**：至少定義 H1–H6、Body、Caption、Overline
- **字重 (Font Weight)**：至少 Regular (400) + Bold (700)
- **行高 (Line Height)**：每個字級對應的行高

### 間距系統 (Spacing)

必須定義：
- **基礎單位**：4px 或 8px base unit
- **間距比例尺**：至少 6 級（如 4, 8, 12, 16, 24, 32, 48, 64）

### 圓角 (Border Radius)

必須定義：
- 至少 3 級：`none (0)`, `small`, `medium`, `large`, `full (9999px / 50%)`

### 陰影 (Shadows)

必須定義：
- 至少 3 級高度：`low`, `medium`, `high`
- 每級包含 `offset-x`, `offset-y`, `blur`, `spread`, `color`

### 按鈕狀態 (Button States)

每種按鈕類型（Primary / Secondary / Tertiary / Destructive）必須涵蓋：
- `default` — 預設狀態
- `hover` — 滑鼠懸停
- `active / pressed` — 點擊中
- `focus` — 鍵盤焦點（需有可見 focus ring）
- `disabled` — 不可操作
- `loading` — 載入中（可選但建議）

### 表單狀態 (Form States)

所有表單元件（Input / Select / Textarea / Checkbox / Radio）必須涵蓋：
- `default` — 預設狀態
- `focus` — 聚焦中（需有可見 focus indicator）
- `filled` — 已填寫
- `error` — 錯誤狀態（含錯誤訊息樣式）
- `disabled` — 不可操作
- `success` — 驗證通過（可選但建議）

### 無障礙 — WCAG 2.1 Level A

參考 [WCAG 對比度規範](./references/wcag-contrast.md)。

關鍵要求：
- **一般文字**（< 18pt / < 14pt bold）：對比度 ≥ **4.5:1**
- **大型文字**（≥ 18pt / ≥ 14pt bold）：對比度 ≥ **3:1**
- 所有互動元件的焦點指示器需清晰可見
- 不得僅依賴顏色傳達資訊（需搭配圖示或文字）

### 圖示系統 (Icon System)

必須定義：
- **風格**：線性 (Outline) / 填充 (Filled) / 雙色 (Duotone)，全系統統一一種
- **尺寸規範**：至少定義 2-3 種尺寸（如 16px, 24px, 32px）
- **筆畫粗細**：統一的 stroke width（如 1.5px 或 2px）
- **格線系統**：圖示繪製的基準格線（如 24×24 grid）

### 風格一致性 (Consistency)

檢查項目：
- 所有元件是否使用同一套色彩 token
- 圓角、陰影、間距是否來自定義好的比例尺
- 字型使用是否統一（無隨意混用字型）
- 圖示風格是否全系統一致
