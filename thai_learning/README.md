# 泰語旅伴

30 天、每天 10 分鐘的旅行泰語學習網頁，繁體中文介面，無須安裝套件。

## 開啟

用 Chrome、Safari 或 Edge 開啟 index.html，保留同資料夾的 styles.css、app.js、lessons.js。

也可在此資料夾執行 `python3 -m http.server 8026 --bind 127.0.0.1`，再開啟 http://127.0.0.1:8026 。

## 功能

30 天課程、每週複習、常識卡、兩題測驗、雙人情境與角色交換、收藏與熟悉度、口袋卡搜尋與放大、十分鐘計時、進度與印章、匯出備份與匯入朋友快照。

「學習護照」會顯示每堂課首次完成的日期與時間，匯出進度時會一併備份。舊進度依然會列出，未曾保存的完成日期會標示為無完成時間。

## 限制

- 本機版沒有帳號、雲端同步或邀請連結，朋友間需手動交換進度 JSON 檔。
- 裝置需要安裝泰語聲音才能播放。這是合成語音，不是真人音檔，是否離線依裝置而定。
- 教材可離線開啟，Google 字型與來源連結需要網路，字型無法載入會使用系統字型。
- 請固定使用相同瀏覽器與開啟方式，清除網站資料、無痕模式、移動資料夾或變更網址可能影響進度。請定期匯出。
- 簡化轉寫沒有完整聲調及母音長短標記，尚未經泰語教師審校。正式教學前建議母語者校對並補上真人錄音。
- 過敏及醫療需求請另備完整、適合個人的翻譯資訊，簡短句子無法涵蓋所有細節。

## 檔案

index.html（入口）、styles.css（樣式）、lessons.js（課程資料）、app.js（互動）。

## 參考

https://thailandfoundation.or.th/how-to-use-krub-and-kha-in-the-thai-language/

https://thailand.go.th/useful-information-detail/009_138?hl=en

## Cloudflare 雙人版

開啟 GitHub Pages 後，選擇「旅伴 A」或「旅伴 B」即可開始。兩份紀錄分開存在 D1。這兩個身分無需驗證，知道網址的人可以查看或修改兩份紀錄。

既有的 D1 綁定及 progress 資料表可繼續使用。更新 GitHub 的 main 分支後，確認 GitHub Pages 和 Cloudflare Worker 都完成部署。若在新環境部署，先建立 D1，將資料庫 ID 填入 wrangler.toml，再執行 migrations/0001_progress.sql，最後部署 Worker。

要保留本機進度，可先在選擇身分頁匯出 JSON，再選擇對應身分，由「學習護照」匯入。匯入會取代該身分目前的紀錄。
