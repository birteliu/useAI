# 前台網站 Sitemap

> **設計風格參考**: boco to deco (ていねい通販)
> **設計令牌**: 見 `exampleOne/design-tokens.css`
> **完整風格指南**: 見 `exampleOne/style-guide.md`

## 導航選單

| 順序 | 選單名稱 | 連結目標 |
|------|---------|---------|
| 1 | 首頁 | index.html |
| 2 | 最新消息 | news.html |
| 3 | 活動消息 | events.html |
| 4 | 照片回顧 | diary.html |
| 5 | 募款資訊 | donation.html |

## 頁面清單

| # | 頁面 | 檔案名 | 說明 |
|---|------|--------|------|
| 1 | 首頁 | index.html | 主視覺形象 + 最新消息 + 即時活動 + 募款簡介 + 照片回顧精選 |
| 2 | 最新消息列表 | news.html | 消息卡片列表 + 分頁 |
| 3 | 最新消息詳細 | news-detail.html | 單篇消息完整內容 |
| 4 | 活動消息總覽 | events.html | 篩選 (日期區間 / 類別) + 活動列表 + 外連按鈕，無詳細頁 |
| 5 | 照片回顧列表 | diary.html | 日記風格列表 + 分頁 |
| 6 | 照片回顧詳細 | diary-detail.html | 單篇日記展開，含照片 Gallery |
| 7 | 募款資訊 | donation.html | 理念說明 + 贊助方案 + 匯款資訊 |

## 架構圖

```
首頁 (index.html)
├── § 主視覺形象
├── § 最新消息 ×3~5 → 最新消息列表 (news.html)
│                       └── 消息詳細 (news-detail.html)
├── § 即時活動 ×3~5 → 活動消息總覽 (events.html)
│     (依活動日期排序)     ├── 篩選: 日期區間 / 類別
│                         └── 外連按鈕 → 外部網站
├── § 募款資訊簡介 → 募款資訊 (donation.html)
└── § 照片回顧精選 → 照片回顧列表 (diary.html)
                        └── 日記詳細 (diary-detail.html)
```

## 共用元件

- **Navbar**: Logo/名字 + 5 個選單項目，手機版漢堡選單
- **Footer**: Logo/名字 + Slogan + 快速連結 + 聯絡資訊 + 社群連結 + 版權聲明
- **麵包屑**: 詳細頁使用 (news-detail、diary-detail)

### 🎨 Navbar 視覺規格

| 屬性 | 值 |
|------|-----|
| 背景 | `rgba(255, 255, 255, 0.95)`；`backdrop-filter: blur(8px)` |
| 定位 | `position: sticky; top: 0; z-index: 100` |
| Logo 字色 | `var(--c-text-primary)` → `#69ba00` |
| 選單項目字色 | `var(--c-text-default)` → `#514327` |
| 選單 Hover | 色 `#69ba00` |
| Active 頁面 | 底線色 `#69ba00`；`2px solid` |
| 字級 | `1rem`；Letter-spacing `0.1em` |
| 漢堡選單色 | `var(--c-text-default)` → `#514327` |
| 手機選單背景 | `#ffffff`；全螢幕 slide-down |
| 過渡 | `transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1)` |

### 🎨 Footer 視覺規格

| 屬性 | 值 |
|------|-----|
| 背景 | `var(--c-bg-warm-beige)` → `#f5f1e9` |
| 頂部分隔 | SVG 弧形曲線 |
| Logo 字色 | `var(--c-text-primary)` → `#69ba00` |
| Slogan 字色 | `var(--c-text-tertialy)` → `#a48d48` |
| 連結字色 | `var(--c-text-default)` → `#514327` |
| 連結 Hover | 色 `#69ba00` |
| 聯絡資訊字色 | `var(--c-note)` → `#bab09f` |
| 社群圖示色 | `var(--c-text-secondary)` → `#64b200` |
| 社群圖示 Hover | 色 `#69ba00`；`transform: scale(1.15)` |
| 版權文字色 | `var(--c-note)` → `#bab09f`；字級 `0.8rem` |
| 內距 | 桌面 `4rem 2rem`；手機 `3rem 1.25rem` |

### 🎨 麵包屑視覺規格

| 屬性 | 值 |
|------|-----|
| 文字色 | `var(--c-note)` → `#bab09f` |
| 當前頁面文字色 | `var(--c-text-default)` → `#514327` |
| 連結 Hover | 色 `var(--c-text-primary)` → `#69ba00` |
| 字級 | `0.85rem`；Letter-spacing `0.07em` |
| 分隔符 | `›`；色 `#bab09f` |

## 活動類別

- 社區活動
- 講座
- 文化節慶
