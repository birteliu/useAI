# Design Token 規格定義

## Token 結構

Design Token 採用 JSON 格式，遵循 [Design Token Community Group (DTCG)](https://tr.designtokens.org/format/) 草案規範的精簡版本。

## JSON 結構範例

```json
{
  "$name": "My Project Design Tokens",
  "$version": "1.0.0",
  "color": {
    "primary": {
      "light": { "$value": "#E3F2FD", "$type": "color" },
      "base": { "$value": "#1976D2", "$type": "color" },
      "dark": { "$value": "#0D47A1", "$type": "color" }
    },
    "secondary": {
      "light": { "$value": "#F3E5F5", "$type": "color" },
      "base": { "$value": "#7B1FA2", "$type": "color" },
      "dark": { "$value": "#4A148C", "$type": "color" }
    },
    "semantic": {
      "success": { "$value": "#2E7D32", "$type": "color" },
      "warning": { "$value": "#ED6C02", "$type": "color" },
      "error": { "$value": "#D32F2F", "$type": "color" },
      "info": { "$value": "#0288D1", "$type": "color" }
    },
    "neutral": {
      "0": { "$value": "#FFFFFF", "$type": "color" },
      "100": { "$value": "#F5F5F5", "$type": "color" },
      "200": { "$value": "#EEEEEE", "$type": "color" },
      "300": { "$value": "#E0E0E0", "$type": "color" },
      "400": { "$value": "#BDBDBD", "$type": "color" },
      "500": { "$value": "#9E9E9E", "$type": "color" },
      "600": { "$value": "#757575", "$type": "color" },
      "700": { "$value": "#616161", "$type": "color" },
      "800": { "$value": "#424242", "$type": "color" },
      "900": { "$value": "#212121", "$type": "color" },
      "1000": { "$value": "#000000", "$type": "color" }
    }
  },
  "typography": {
    "fontFamily": {
      "primary": { "$value": "'Inter', 'Noto Sans TC', sans-serif", "$type": "fontFamily" },
      "mono": { "$value": "'Fira Code', 'Noto Sans Mono CJK TC', monospace", "$type": "fontFamily" }
    },
    "fontSize": {
      "display": { "$value": "3rem", "$type": "dimension" },
      "h1": { "$value": "2.25rem", "$type": "dimension" },
      "h2": { "$value": "1.875rem", "$type": "dimension" },
      "h3": { "$value": "1.5rem", "$type": "dimension" },
      "h4": { "$value": "1.25rem", "$type": "dimension" },
      "h5": { "$value": "1.125rem", "$type": "dimension" },
      "h6": { "$value": "1rem", "$type": "dimension" },
      "bodyLarge": { "$value": "1.125rem", "$type": "dimension" },
      "body": { "$value": "1rem", "$type": "dimension" },
      "bodySmall": { "$value": "0.875rem", "$type": "dimension" },
      "caption": { "$value": "0.75rem", "$type": "dimension" },
      "overline": { "$value": "0.625rem", "$type": "dimension" }
    },
    "fontWeight": {
      "regular": { "$value": 400, "$type": "fontWeight" },
      "medium": { "$value": 500, "$type": "fontWeight" },
      "semibold": { "$value": 600, "$type": "fontWeight" },
      "bold": { "$value": 700, "$type": "fontWeight" }
    },
    "lineHeight": {
      "tight": { "$value": 1.25, "$type": "number" },
      "normal": { "$value": 1.5, "$type": "number" },
      "relaxed": { "$value": 1.75, "$type": "number" }
    }
  },
  "spacing": {
    "unit": { "$value": "4px", "$type": "dimension", "$description": "Base unit" },
    "scale": {
      "1": { "$value": "4px", "$type": "dimension" },
      "2": { "$value": "8px", "$type": "dimension" },
      "3": { "$value": "12px", "$type": "dimension" },
      "4": { "$value": "16px", "$type": "dimension" },
      "5": { "$value": "20px", "$type": "dimension" },
      "6": { "$value": "24px", "$type": "dimension" },
      "8": { "$value": "32px", "$type": "dimension" },
      "10": { "$value": "40px", "$type": "dimension" },
      "12": { "$value": "48px", "$type": "dimension" },
      "16": { "$value": "64px", "$type": "dimension" },
      "20": { "$value": "80px", "$type": "dimension" },
      "24": { "$value": "96px", "$type": "dimension" }
    }
  },
  "borderRadius": {
    "none": { "$value": "0px", "$type": "dimension" },
    "small": { "$value": "4px", "$type": "dimension" },
    "medium": { "$value": "8px", "$type": "dimension" },
    "large": { "$value": "16px", "$type": "dimension" },
    "full": { "$value": "9999px", "$type": "dimension" }
  },
  "shadow": {
    "low": {
      "$value": "0px 1px 3px 0px rgba(0, 0, 0, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.08)",
      "$type": "shadow"
    },
    "medium": {
      "$value": "0px 4px 6px -1px rgba(0, 0, 0, 0.12), 0px 2px 4px -1px rgba(0, 0, 0, 0.08)",
      "$type": "shadow"
    },
    "high": {
      "$value": "0px 10px 15px -3px rgba(0, 0, 0, 0.12), 0px 4px 6px -2px rgba(0, 0, 0, 0.06)",
      "$type": "shadow"
    }
  }
}
```

## Token 命名規範

### 層級結構

```
{category}.{group}.{variant}

範例：
color.primary.base
color.neutral.500
typography.fontSize.h1
spacing.scale.4
borderRadius.medium
shadow.low
```

### 命名原則

1. **語意化**：使用用途命名而非外觀（`color.primary` 而非 `color.blue`）
2. **小寫駝峰式 (camelCase)**：`fontSize`、`fontWeight`、`lineHeight`
3. **數字作為階層**：灰階色使用 0-1000，間距使用乘數
4. **一致性**：同類別 token 使用相同的命名模式

## Token 類型定義

| `$type` | 說明 | `$value` 範例 |
|---------|------|--------------|
| `color` | 色彩值 | `"#1976D2"`, `"rgba(0,0,0,0.5)"` |
| `dimension` | 尺寸值 | `"16px"`, `"1rem"` |
| `fontFamily` | 字型家族 | `"'Inter', sans-serif"` |
| `fontWeight` | 字重 | `400`, `700` |
| `number` | 純數值 | `1.5` |
| `shadow` | 陰影 | CSS box-shadow 值 |

## 從設計稿提取 Token 的流程

1. **讀取設計稿**：解析 PNG/SVG 圖檔或 JSON 定義
2. **辨識色彩**：提取所有使用的顏色，歸類到 primary / secondary / semantic / neutral
3. **辨識字體**：提取字型、字級、字重、行高
4. **辨識間距**：提取常用間距值，對齊到 4px/8px 網格
5. **辨識圓角**：提取圓角值，歸類到層級
6. **辨識陰影**：提取陰影參數，歸類到層級
7. **組裝 Token JSON**：按照上述結構產出 JSON 檔案
8. **驗證**：確認所有必要 token 都已定義
