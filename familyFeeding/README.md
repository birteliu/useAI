# 老爸ａ餵食記錄網頁

三位家人共用的手機網頁。餵完後選奶品與罐數（一罐為預設，或選半罐），按儲存就以當下時間記錄；忘記即時登記可補記實際餵完時間。毋須輸入開始時間、結束時間或餵食人員。

首頁顯示上一餐，以及「上一餐餵完後 3 小時 30 分」的下一餐最早參考時間。每天可餵三餐、四餐或依實際狀況調整；高纖、補體素、雙卡、一般可重複，也可某天完全不選。時間提醒只是依家中提供的最少間隔計算，實際餵食依照護安排決定。

## 功能

- 網頁開啟即可查看同一份資料，無登入或家庭代碼。
- 快速記錄、補記、更正、作廢；更正及作廢會在資料庫留存變更紀錄。
- 今天總餐數與各奶品次數，不強制每日四餐或四種奶各一次。
- 未滿 3.5 小時提醒確認，仍可記錄實際發生的餵食。
- 重試不會重複新增；同時間附近已有紀錄時阻止重複登記。
- 每 15 秒同步，切回網頁也會同步；斷線時提示不能確認最新狀態。

舊版有開始／結束時間、餵食人員欄位的測試資料保存在 `records` 表作為封存，不會進入新版餐數或下一餐時間計算。新版資料儲存在 `feedings` 表。

## 本機預覽

電腦需有 Node.js 20 以上。在專案資料夾執行：

```powershell
npm.cmd install
npm.cmd run db:local
npm.cmd run dev
```

開啟 `http://127.0.0.1:8787`。這是本機預覽，外出時不能使用。整合測試會寫入資料，建議先以獨立資料庫啟動 8788 測試服務後再執行 `node verify-local.mjs`。

## 線上共用

GitHub 可保存程式碼，但 [GitHub Pages 只提供靜態網站](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)，不能單獨提供三人共用且可寫入的資料庫。本專案使用 Cloudflare Workers 提供網頁與 API、Cloudflare D1 保存紀錄。Cloudflare 可以[連接 GitHub 專案自動部署](https://developers.cloudflare.com/workers/ci-cd/builds/)。

目前只有本機版，尚未建立雲端資料庫或公開網址。上線需要 Cloudflare 帳號：

1. 在 GitHub 建立倉庫並上傳程式碼；不要上傳 `.wrangler`、`node_modules` 等本機檔案。
2. 在專案資料夾執行 `npx wrangler login`。
3. 執行 `npx wrangler d1 create family-feeding-db`，將回傳的 `database_id` 填入 `wrangler.jsonc`。
4. 執行 `npm.cmd run db:remote` 建立線上資料表。
5. 執行 `npm.cmd run deploy`，以部署後的 HTTPS 網址在不同手機測試。

這個版本沒有登入機制。正式公開後，任何拿到網址的人都能查看及修改紀錄；請在上線前確認這符合家人的使用方式。建議定期[匯出 D1 資料庫備份](https://developers.cloudflare.com/d1/wrangler-commands/#d1-export)。
