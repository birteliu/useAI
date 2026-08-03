# WCAG 2.1 色彩對比度規範參考

## 對比度等級要求

| 等級 | 一般文字 | 大型文字 | 非文字元件 |
|------|---------|---------|-----------|
| **Level A** | 無明確對比度要求 | 無明確對比度要求 | — |
| **Level AA** | ≥ 4.5:1 | ≥ 3:1 | ≥ 3:1 |
| **Level AAA** | ≥ 7:1 | ≥ 4.5:1 | — |

> **本規範建議**：即使僅要求 Level A，仍應以 Level AA 的 4.5:1 為最低標準。

## 文字大小定義

| 分類 | 條件 |
|------|------|
| **一般文字 (Normal Text)** | < 18pt (24px) 且 < 14pt (18.66px) bold |
| **大型文字 (Large Text)** | ≥ 18pt (24px) 或 ≥ 14pt (18.66px) bold |

## 對比度計算公式

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)

L = relative luminance
L1 = 較亮顏色的相對亮度
L2 = 較暗顏色的相對亮度
```

### 相對亮度 (Relative Luminance) 計算

```
L = 0.2126 × R_lin + 0.7152 × G_lin + 0.0722 × B_lin

其中：
- 若 sRGB 值 ≤ 0.04045 → C_lin = C_sRGB / 12.92
- 若 sRGB 值 > 0.04045  → C_lin = ((C_sRGB + 0.055) / 1.055) ^ 2.4

C_sRGB = 8-bit value / 255
```

## 常見配對對比度速查

| 前景色 | 背景色 | 對比度 | AA 一般文字 | AA 大型文字 |
|--------|--------|--------|-----------|-----------|
| #000000 (黑) | #FFFFFF (白) | 21:1 | ✅ | ✅ |
| #333333 | #FFFFFF | 12.63:1 | ✅ | ✅ |
| #666666 | #FFFFFF | 5.74:1 | ✅ | ✅ |
| #767676 | #FFFFFF | 4.54:1 | ✅ | ✅ |
| #808080 | #FFFFFF | 3.95:1 | ❌ | ✅ |
| #999999 | #FFFFFF | 2.85:1 | ❌ | ❌ |
| #FFFFFF (白) | #0066CC (藍) | 5.07:1 | ✅ | ✅ |
| #FFFFFF | #FF0000 (紅) | 4.00:1 | ❌ | ✅ |

## WCAG 2.1 Level A 相關成功準則

### 1.1.1 非文字內容 (Non-text Content)
所有非文字內容都需要提供替代文字。

### 1.3.1 資訊與關係 (Info and Relationships)
透過呈現方式傳達的資訊、結構和關係，可以透過程式判讀或以文字提供。

### 1.3.3 感官特性 (Sensory Characteristics)
操作說明不能僅依賴元件的形狀、顏色、大小、視覺位置、方向或聲音。

### 1.4.1 色彩使用 (Use of Color)
**顏色不得作為傳達資訊、指示動作、提示回應或區分視覺元素的唯一手段。**

實作建議：
- 錯誤狀態：紅色邊框 + 錯誤圖示 + 錯誤文字
- 必填欄位：星號 (*) + 文字說明，不僅靠顏色
- 連結：底線 + 顏色，不僅靠顏色
- 圖表：圖案/形狀 + 顏色，不僅靠顏色

### 2.1.1 鍵盤 (Keyboard)
所有功能都可以透過鍵盤操作。

### 2.4.7 焦點可見 (Focus Visible) — Level AA（強烈建議納入）
鍵盤操作的焦點指示器是可見的。

## 審核工具建議

| 工具 | 用途 | 連結 |
|------|------|------|
| WebAIM Contrast Checker | 線上對比度計算 | https://webaim.org/resources/contrastchecker/ |
| Stark (Figma Plugin) | Figma 內直接檢查對比度 | Figma Community |
| axe DevTools | 瀏覽器自動化無障礙測試 | Chrome Extension |
| Colour Contrast Analyser | 桌面端色彩對比度工具 | TPGi |

## 在設計稿中標示對比度的建議

1. 在色彩系統頁面中，每組前景/背景配對旁標示對比度數值
2. 使用 ✅ / ❌ 標記是否通過 AA 標準
3. 建議格式：

```
Primary Text on White Background
#333333 on #FFFFFF
Contrast: 12.63:1 ✅ AA Pass
```
