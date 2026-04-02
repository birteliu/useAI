# 前台網站 Sitemap

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

## 活動類別

- 社區活動
- 講座
- 文化節慶
