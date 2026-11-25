# 泰語旅伴

30 天、每天 10 分鐘的旅行泰語學習網頁，繁體中文介面，無須安裝套件。

## 開啟

用 Chrome、Safari 或 Edge 開啟 index.html，保留同資料夾的 styles.css、app.js、lessons.js。

也可在此資料夾執行 `python3 -m http.server 8026 --bind 127.0.0.1`，再開啟 http://127.0.0.1:8026 。

## 功能

30 天課程、每週複習、常識卡、兩題測驗、雙人情境與角色交換、收藏與熟悉度、口袋卡搜尋與放大、進度與印章。

「學習護照」會顯示每堂課首次完成的日期與時間。舊進度依然會列出，未曾保存的完成日期會標示為無完成時間。

## 限制

- 本機版沒有帳號、雲端同步或邀請連結，朋友間需手動交換進度 JSON 檔。
- 發音留在網站內播放。網站內的 AAC（M4A）或 MP3 音檔優先播放，若該句沒有音檔則使用裝置的泰語語音。
- 教材可離線開啟，Google 字型與來源連結需要網路，字型無法載入會使用系統字型。
- 請固定使用相同瀏覽器與開啟方式，清除網站資料、無痕模式、移動資料夾或變更網址可能影響進度。
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

## 網頁內的泰語音檔

目前的 62 句 AAC（M4A）由 Piper 1.8.0 的 [TSync2 泰語語音](https://huggingface.co/rhasspy/piper-voices/blob/42301ec/th/th_TH/tsync2/medium/MODEL_CARD) 產生，使用 NECTEC TSync2 資料集，資料集授權為 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)，供非商業學習使用。MP3／M4A 由網站直接供應，播放不需任何 Google Cloud 帳號或 API。

若改用 Google Cloud Text-to-Speech 的 Standard 泰語語音，可使用下列備用流程。先在 Google Cloud 專案啟用 Text-to-Speech API 與計費，安裝 Google Cloud CLI 並在本機執行 `gcloud auth application-default login`。在本資料夾執行：

```bash
python3 generate_audio.py --dry-run
python3 generate_audio.py --project YOUR_PROJECT_ID
```

第一行只列出需要產生的音檔和字元數。第二行會將 MP3 和索引寫入 `audio/`。提交該資料夾並推送後，使用者點「聽發音」即可直接播放，播放時不會呼叫 Google Cloud。不要提交任何 Google Cloud 憑證。若日後更新音檔索引，請同步更新 index.html 的 catalog.js 版本參數。
