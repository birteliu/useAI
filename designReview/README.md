# Design System Review — 設計系統審核工具

## 這是什麼？

這是一個 **GitHub Copilot Custom Skill**，用來自動審核網頁／APP 設計稿的設計系統規範完整性。  
它能幫你檢查設計稿是否具備完整的色彩、字體、間距、按鈕狀態、表單狀態、無障礙對比度等基礎規範，並可自動產出 **Design Token JSON** 與 **HTML 展示頁面**。

---

## 前置需求

| 項目 | 說明 |
|------|------|
| **VS Code** | 已安裝 [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) 與 [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) 擴充套件 |
| **Node.js** | v16 以上（用於執行 HTML 頁面產生腳本） |
| **設計稿圖檔** | PNG 或 SVG 格式的設計稿截圖 |

---

## 資料夾結構

```
designReview/
├── README.md                          ← 你正在看的這份文件
├── design-system-tokens.json          ← 審核後產出的 Design Token JSON
├── output/                            ← 產出的 HTML 展示頁面
│   └── design-tokens.html
│
└── .github/
    └── skills/
        └── design-system-review/      ← Skill 本體
            ├── SKILL.md               ← Skill 定義檔（Copilot 讀取用）
            ├── design-specs/          ← 📂 放設計稿圖片的地方
            ├── assets/
            │   └── sample-tokens.json ← Token JSON 範本
            ├── references/            ← 審核參考文件
            │   ├── checklist.md       ← 完整審核清單（10 大類別）
            │   ├── design-tokens.md   ← Token JSON 格式規格
            │   └── wcag-contrast.md   ← WCAG 對比度規範
            └── scripts/
                └── generate-tokens-page.js  ← HTML 展示頁面產生器
```

---

## 使用方式

### 1. 放入設計稿

將你的設計稿圖片（PNG / SVG）放進以下目錄：

```
.github/skills/design-system-review/design-specs/
```

### 2. 用 VS Code 開啟此專案

```bash
code designReview
```

### 3. 開啟 Copilot Chat，直接說出需求

在 Copilot Chat 中輸入你的需求，Skill 會自動被觸發。以下是幾種常見用法：

#### 只做審核（產出 Markdown 報告）

```
請審核 design-specs 資料夾裡的設計稿，檢查設計系統規範是否完整
```

#### 審核 + 產出 Design Token JSON

```
審核設計稿並產出 design-system-tokens.json
```

#### 完整流程（審核 + Token JSON + HTML 展示頁面）

```
審核所有設計稿，產出 tokens JSON 和 HTML 展示頁面
```

### 4. 依照 Copilot 的引導回答

Copilot 會確認：
- 要審核哪些圖檔
- 需要哪些產出（僅報告 / + JSON / + HTML）
- 輸出路徑

確認後它會自動完成審核與檔案產出。

---

## 審核涵蓋項目（10 大類別）

| # | 類別 | 檢查重點 |
|---|------|----------|
| 1 | 色彩系統 | 主色、輔助色、語意色、灰階、背景／前景配對 |
| 2 | 字體系統 | 字型家族、字級階層（H1–H6、Body）、字重、行高 |
| 3 | 間距系統 | 基礎單位（4px/8px）、間距比例尺 |
| 4 | 圓角 | 圓角層級（none → small → medium → large → full） |
| 5 | 陰影 | 陰影層級（low / medium / high） |
| 6 | 按鈕狀態 | Default / Hover / Active / Focus / Disabled / Loading |
| 7 | 表單狀態 | Default / Focus / Error / Disabled / Success |
| 8 | 無障礙 | WCAG 2.1 Level A 色彩對比度（≥ 4.5:1 / ≥ 3:1） |
| 9 | 圖示系統 | 風格一致性、尺寸規範、筆畫粗細 |
| 10 | 風格一致性 | 跨元件視覺語言統一性 |

---

## 產出說明

### Design Token JSON

結構遵循 [DTCG 規範](https://tr.designtokens.org/format/)精簡版，包含：

- `$name` / `$version`：專案名稱與版本
- `color`：色彩系統（primary / secondary / semantic / neutral）
- `typography`：字體系統
- `spacing`：間距比例尺
- `borderRadius`：圓角
- `shadow`：陰影
- `$audit`：審核結果（每張設計稿的審核紀錄）

### HTML 展示頁面

產生的 HTML 包含三個頁籤：

1. **審核結果** — 逐稿審核明細，以卡片呈現，紅 / 橙 / 綠邊條標示嚴重度
2. **Design Tokens** — 色票、字體樣本、間距視覺化等 token 展示
3. **審核清單** — 完整檢查清單與通過進度

直接用瀏覽器開啟 `output/design-tokens.html` 即可檢視。

---

## 手動產生 HTML 頁面

如果已有 `design-system-tokens.json`，可直接用指令產生 HTML：

```bash
node .github/skills/design-system-review/scripts/generate-tokens-page.js \
  design-system-tokens.json \
  output/design-tokens.html
```

---

## 常見問題

**Q: 設計稿需要什麼格式？**  
A: PNG 或 SVG，建議解析度清晰可辨識文字與色碼。

**Q: 可以只審核部分圖檔嗎？**  
A: 可以，Copilot 啟動後會詢問你要審核哪些圖檔。

**Q: HTML 頁面上的圖片顯示不出來？**  
A: 確認設計稿圖片放在 `.github/skills/design-system-review/design-specs/` 目錄下，HTML 的圖片路徑是相對於此位置。

**Q: 可以自訂 HTML 頁面的配色嗎？**  
A: 可以，修改 `generate-tokens-page.js` 頂部 `<style>` 裡的 CSS 變數（`--c-primary` 等）即可換色。
