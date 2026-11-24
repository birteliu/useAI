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

Workers 僅接受旅伴 A、旅伴 B 的兩組獨立登入金鑰。兩人各自登入同一網址，護照和學習紀錄會分開存入 D1。網站載入時讀取該帳號的紀錄，變更後會自動儲存。若另一台裝置已更新，網站會提示先匯出本次紀錄，再重新讀取，避免直接覆寫。

從本目錄操作。需要先以 Cloudflare 帳戶登入 Wrangler。

1. 執行 `npx wrangler d1 create thai-learning`，將回傳的資料庫 ID 填入 `wrangler.toml`。
2. 執行 `npx wrangler d1 migrations apply thai-learning --remote`。
3. 為每位使用者各產生一組 64 位小寫十六進位金鑰，例如分別執行兩次 `openssl rand -hex 32`，存進密碼管理員。
4. 執行 `npx wrangler deploy`。在兩組金鑰都設定好之前，網站會停在設定提示。
5. 分別執行 `npx wrangler secret put LEARNER_A_KEY` 與 `npx wrangler secret put LEARNER_B_KEY`，依提示輸入各自的金鑰。登入時選擇對應帳號，使用自己的金鑰。更換金鑰會使該帳號舊的登入工作階段失效。

要保留本機進度，先從原網頁匯出 JSON，再登入對應帳號，由「學習護照」匯入。匯入會取代該帳號目前的紀錄。
