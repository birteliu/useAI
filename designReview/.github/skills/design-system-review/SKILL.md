---
name: design-system-review
description: "審核網頁/APP設計稿的設計系統規範完整性。Use when: reviewing design deliverables, validating design system, checking WCAG contrast, auditing button states, form states, icon system, typography, color system, spacing, shadows, border-radius, design tokens generation. 支援 PNG/SVG 圖檔審核與 JSON token 檔案驗證，審核後可產出 design token 展示頁面。"
argument-hint: "提供設計稿檔案路徑或資料夾進行審核，或直接說明需求"
---

# Design System Review — 設計系統審核 Skill

## 目的

確保每個設計專案在交付前，已建立完整且一致的設計系統基礎規範。此 Skill 定義了設計師在製作設計稿時**至少需要產出的樣式與規範項目**，並提供審核流程與 design token 產出能力。

---

## AI 執行流程

> 依照以下步驟進行，每步驟完成才進入下一步。

### Step 0：探索專案結構（首先執行）

在做任何事之前，先用工具探索專案，取得後續步驟所需的路徑資訊：

```
# 1. 找出本 skill 的 generator 腳本（確認路徑）
file_search("**/generate-tokens-page.js")

# 2. 找出設計稿圖檔（固定位置：{SKILL_DIR}/design-specs/）
file_search("**/.github/skills/design-system-review/design-specs/*.png")

# 3. 找出現有的 token JSON 檔案（如果有）
file_search("**/*token*.json") 或 file_search("**/*design-system*.json")

# 4. 確認輸出目錄是否存在（output/、dist/、docs/ 等）
list_dir(workspace_root)
```

記錄以下變數，供後續步驟使用：
- `SKILL_DIR`：skill 所在目錄（generator 腳本的上一層）
- `CHECKLIST_PATH`：`{SKILL_DIR}/references/checklist.md`
- `SPEC_IMAGES`：找到的設計稿圖檔列表
- `TOKEN_JSON`：現有 token 檔案路徑（若無則為 `null`）
- `OUTPUT_DIR`：選定的輸出目錄（見下方規則）

**OUTPUT_DIR 選取規則**（依優先序）：
1. 使用者明確指定的路徑
2. 已存在的 `output/`、`dist/`、`docs/` 目錄
3. 若以上皆無，預設使用 `output/`（執行時用 `mkdir -p` 建立）

---

### Step 1：確認使用者需求

用**一則訊息**詢問以下資訊（未從對話或引數中取得的項目才問）：

> 我已掃描專案結構，找到以下內容：
> - 設計稿圖檔：`[列出找到的圖檔]`（若無則說「未發現設計稿，請提供路徑」）
> - 現有 Token 檔：`[路徑]`（若無則說「尚無 token 檔」）
>
> 請確認以下事項：
> 1. **要審核哪些設計稿？** 是全部圖檔，還是特定幾張？
> 2. **需要哪些產出？**
>    - (A) 僅審核報告（Markdown 說明）
>    - (B) 審核 + 產出 design-system-tokens.json
>    - (C) 審核 + tokens JSON + HTML 展示頁面（完整流程）
> 3. **輸出路徑**：HTML 和 JSON 儲存到 `[預設 OUTPUT_DIR]`，還是其他位置？

---

### Step 2：讀取設計稿並審核

依使用者確認的圖檔清單，逐張進行視覺審核：

- 圖檔：使用 `view_image` 讀取
- JSON token 檔：使用 `read_file` 讀取
- 載入 `CHECKLIST_PATH` 的完整清單作為審核依據

審核涵蓋以下 **10 大類別**：

| # | 類別 | 關鍵檢查項 |
|---|------|-----------|
| 1 | 色彩系統 (Color System) | 主色系、輔助色、語意色、灰階色階 |
| 2 | 字體系統 (Typography) | 字型家族、字級階層、行高、字重 |
| 3 | 間距系統 (Spacing) | 間距單位、間距比例尺 |
| 4 | 圓角 (Border Radius) | 圓角層級定義 |
| 5 | 陰影 (Shadows / Elevation) | 陰影層級定義 |
| 6 | 按鈕狀態 (Button States) | Default / Hover / Active / Focus / Disabled / Loading |
| 7 | 表單狀態 (Form States) | Default / Focus / Error / Disabled / Success |
| 8 | 無障礙 (Accessibility) | WCAG 2.1 Level A 色彩對比度 |
| 9 | 圖示系統 (Icon System) | 圖示風格一致性、尺寸規範 |
| 10 | 風格一致性 (Consistency) | 跨元件視覺語言統一性 |

每張圖的審核結果記錄為：
```json
{
  "file": "設計稿檔名",
  "type": "component_spec | web_mockup | mobile_mockup | style_guide | other",
  "summary": "一句話摘要",
  "findings": [
    { "s": "pass | warn | fail", "t": "具體說明" }
  ]
}
```

---

### Step 3：產出審核報告（Markdown）

以表格呈現整體結果：

```
| 類別 | 狀態 | 說明 |
|------|------|------|
| 色彩系統 | ✅ 通過 / ⚠️ 部分缺漏 / ❌ 缺少 | 具體說明 |
```

狀態定義：
- ✅ **通過**：該項目完整且符合規範
- ⚠️ **部分缺漏**：有定義但不完整，列出缺少項目
- ❌ **缺少**：完全未定義

---

### Step 4：產出 Design Token JSON（若使用者選 B 或 C）

依據 [Design Token 規格](./references/design-tokens.md) 產出或更新 token 檔案。

- 若已有現有 token 檔（`TOKEN_JSON` 非 null）：讀取後更新，保留已有欄位
- 若無：從範本 `{SKILL_DIR}/assets/sample-tokens.json` 建立新檔

輸出路徑：`{OUTPUT_DIR}/design-system-tokens.json`（或使用者指定路徑）

---

### Step 5：產出 HTML 展示頁面（若使用者選 C）

使用 generator 腳本產生 HTML：

```bash
node {SKILL_DIR}/scripts/generate-tokens-page.js \
  {TOKEN_JSON_PATH} \
  {OUTPUT_DIR}/design-tokens.html
```

> `{SKILL_DIR}` 為 Step 0 探索到的腳本所在目錄的上一層，請替換為實際路徑。
> 若 `{OUTPUT_DIR}` 不存在，先執行 `mkdir -p {OUTPUT_DIR}`（Linux/macOS）或 `New-Item -ItemType Directory {OUTPUT_DIR}`（Windows PowerShell）。

完成後告知使用者 HTML 檔案的完整路徑，可直接在瀏覽器開啟。

#### HTML 產出結構規則（修改 generator 時必須遵守）

修改或客製化 `generate-tokens-page.js` 時，以下結構規則**不得破壞**：

1. **Design Tokens 頁籤的每個大項目區塊**，內容必須用 `.section-card` 包覆：
   ```html
   <section id="colors">
     <h2>Color System</h2>
     <div class="section-card">
       <!-- 色票、表格等內容 -->
     </div>
   </section>
   ```
   `.section-card` 提供白色底色、大圓角、柔和陰影，讓各 token 類別有清楚的視覺分群。**h2 標題在卡片外側**，作為錨點標題。

2. **審核結果頁籤**：每張設計稿用 `.spec-card` 呈現，點擊 header 可展開／收合。依審核結果在卡片左側加上彩色邊條（`.spec-card-has-fail` / `has-warn` / `all-pass`）。

3. **頁籤切換**：三個頁籤（審核結果 / Design Tokens / 審核清單）用 `.tab-bar` 膠囊列呈現，active 狀態為主色背景白字，不得改為底線或其他切換方式。

#### 設計稿圖片放置規則

設計稿圖片必須放在 **skill 資料夾內的 `design-specs/`**：

```
.github/
└── skills/
    └── design-system-review/
        ├── design-specs/        ← 設計稿圖片放這裡
        │   ├── Colors.png
        │   ├── WEB_首頁.png
        │   └── ...
        ├── assets/
        ├── references/
        └── scripts/
```

generator 產生的 HTML 在 `output/`，圖片的相對路徑已硬編碼為 `../.github/skills/design-system-review/design-specs/`，**資料夾名稱與位置不得改變**。

token JSON 的 `$audit.specs[].file` 欄位只填**檔名**，不含路徑：

```json
{ "file": "WEB_首頁.png", "type": "web_mockup", "summary": "...", "findings": [] }
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

---

## 產出網頁視覺規範

`generate-tokens-page.js` 產生的 HTML 展示頁面使用以下設計系統，若要調整外觀，只需修改腳本頂部的 `<style>` 區塊。

### CSS 自訂變數（`:root`）

| 變數 | 預設值 | 用途 |
|------|--------|------|
| `--c-primary` | `#2E7D5B` | 主色（頁籤 active、h2 底線、checkbox 等） |
| `--c-primary-light` | `#E8F5EE` | 主色極淡（表格 th 背景、hover 背景） |
| `--c-primary-soft` | `#D4EDDA` | 主色柔和（h2 底線、漸層結束色） |
| `--c-accent` | `#D4853A` | 強調色（裝飾圖形） |
| `--c-bg` | `#FAFBF9` | 頁面底色 |
| `--c-surface` | `#FFFFFF` | 卡片底色 |
| `--c-text` | `#333333` | 主要文字 |
| `--c-text-secondary` | `#6B7280` | 次要文字、說明文字 |
| `--c-border` | `#E8ECE6` | 分隔線、表格邊框 |
| `--c-danger` | `#DC3D5A` | 錯誤/失敗狀態 |
| `--c-warning` | `#E65100` | 警告狀態 |
| `--c-success` | `#2E7D32` | 通過狀態 |
| `--radius-sm` | `12px` | 小圓角（audit notes、badge 等） |
| `--radius-md` | `20px` | 中圓角（表格、sub-nav） |
| `--radius-lg` | `32px` | 大圓角（卡片） |
| `--radius-pill` | `9999px` | 膠囊形（頁籤、按鈕） |
| `--shadow-soft` | `0 2px 16px rgba(0,0,0,.05)` | 細緻陰影 |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,.06)` | 卡片陰影 |
| `--shadow-hover` | `0 8px 32px rgba(0,0,0,.10)` | hover 時加深陰影 |
| `--section-gap` | `3.5rem` | 各區塊間距（目前僅 `.meta` 使用） |

### 字型

Google Fonts **Noto Sans TC**（400 / 500 / 700），備用：`Inter`、`system-ui`。

若專案不使用 Noto Sans TC，可將 generator 腳本裡的 `<link>` 行與 `font-family` 換成目標字型。

### 頁面結構

```
<h1>  專案名稱
<p.page-subtitle>  設計系統基礎規範與檢核
<p.meta>  版本 · 產出日期
<div.tab-bar>  膠囊頁籤列（審核結果 / Design Tokens / 審核清單）
  <div#tab-audit>   審核結果頁籤
    摘要卡片 (.audit-card) + 逐稿審核 (.spec-card × N)
  <div#tab-tokens>  Design Tokens 頁籤
    各區塊 section > h2 + .section-card > 內容
  <div#tab-checklist>  審核清單頁籤
    進度卡片 (.checklist-progress) + 各節 (.checklist-section × N)
```

### 主要元件 class

| Class | 說明 |
|-------|------|
| `.section-card` | Design Tokens 頁籤的白色底色包覆區塊（`--radius-lg` + `--shadow-card`） |
| `.token-group` | section-card 內的子群組（margin-bottom: 2.5rem） |
| `.audit-card` | 審核摘要白色卡片 |
| `.spec-card` | 逐稿審核卡片，點擊 header 可展開/收合 |
| `.spec-card-has-fail / has-warn / all-pass` | 卡片左側彩色邊條（紅/橙/綠） |
| `.tab-btn.active` | 膠囊頁籤 active 狀態（主色背景 + 白字） |
| `.checklist-progress` | 清單頁籤頂部進度卡片（進度條 + 統計數字） |

### 調色（換色）方式

只需修改 `:root` 裡的 `--c-primary` 系列與 `--c-accent`，其餘元件會自動跟著改變。

```css
/* 範例：換成藍色主題 */
--c-primary: #1565C0;
--c-primary-light: #E3F2FD;
--c-primary-soft: #BBDEFB;
--c-accent: #F57C00;
```
