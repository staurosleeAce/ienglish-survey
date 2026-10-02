# iEnglish 7 日英語閱讀口說營 · 結營問券

一個「7 日學習成果回顧 × 家長需求探索 × 購買意願蒐集 × 後續諮詢轉換」的互動式問券網站。

品牌視覺取自 iEnglish 台灣官方網站（天空藍 `#1c9ad6` + 暖陽黃 `#ffc222`），採 Mobile-first 設計，單頁互動式問券、逐題呈現、自動前進、完成後依回答顯示不同 CTA。

---

## 技術總覽

| 層 | 技術 |
| --- | --- |
| 前端 | React 19 + TypeScript + Vite 8 |
| 路由 | react-router-dom（`/` 問券、`/admin` 後台；`/admin` 以 `lazy` 分離載入） |
| 資料庫 / Auth / API | Supabase（PostgreSQL + PostgREST + Auth + Row Level Security） |
| 匯出 | SheetJS（xlsx）、手寫 CSV |
| 圖表 | 純 SVG / CSS（無額外 chart 套件） |
| 樣式 | 自訂 CSS（Mobile-first，無 UI 框架） |
| 測試 | Vitest（sanitize / lead 分類 / Excel 欄位）+ puppeteer E2E |

> **正式資料來源只有 Supabase**。前端使用 **publishable key**（可公開），一切資料讀寫權限由 Row Level Security 在資料庫端決定。沒有 localStorage / mock / demo data。
> secret key / service_role key 一律只存在 server-side（後端 / 部署平台環境變數），絕不出現在瀏覽器。

---

## 目錄結構

```
ienglish-survey/
├─ index.html
├─ vite.config.ts
├─ vitest.config.ts
├─ vercel.json               # SPA rewrite（Vercel）
├─ public/_redirects         # SPA rewrite（Netlify）
├─ .env.example
├─ supabase/
│  └─ migrations/0001_create_schema.sql   # 建置 schema + RLS
├─ src/
│  ├─ main.tsx / App.tsx
│  ├─ styles/index.css       # 設計系統（品牌色、元件、動畫）
│  ├─ data/survey.ts         # 問券題目、選項、icon、梯次、LINE URL
│  ├─ types.ts               # Answers / SurveyRecord / 列舉
│  ├─ lib/
│  │  ├─ config.ts           # 環境變數
│  │  ├─ supabase.ts         # Supabase client
│  │  ├─ database.types.ts   # 資料表 TS 型別
│  │  ├─ api.ts              # submit / admin auth / fetch / lead 分類
│  │  ├─ sanitize.ts         # 清潔與防注入
│  │  └─ excel.ts            # Excel / CSV 匯出
│  ├─ components/
│  │  ├─ CompletionModal.tsx # 完成畫面 + 動態 CTA
│  │  └─ ResponseDetail.tsx  # 後台單筆檢視
│  └─ pages/
│     ├─ SurveyPage.tsx      # 前台問券（Landing → 身份 → Q1..Q6 → 回饋 → 完成）
│     └─ AdminPage.tsx       # 後台（登入 → Dashboard → 列表 → 匯出）
└─ tests/                    # Vitest 單元測試
```

---

## 環境變數（.env）

複製 `.env.example` 為 `.env`：

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_LINE_OFFICIAL_URL=https://lin.ee/dXPhchf
```

- `VITE_SUPABASE_URL`：Supabase Project URL（Project Settings → API）。
- `VITE_SUPABASE_PUBLISHABLE_KEY`：**publishable key**（舊稱 anon key），可安全放在前端；權限由 RLS 決定。（相容舊命名 `VITE_SUPABASE_ANON_KEY`。）
- `VITE_LINE_OFFICIAL_URL`：完成頁 CTA 按鈕導向的官方 LINE（正式上線時改這裡即可）。
- 擴充：不同活動梯次可用 `VITE_LINE_URL_BATCH_2026-10-06` 覆寫個別 CTA 網址（未設定則回退官方 URL）。

> ⚠️ **secret key / service_role key 不得放入前端**。本專案前端只使用 publishable key；若要伺服器端後續處理（e.g. 匯出、通知），請讓 secret 只存在於 server-side（後端 / Edge Function / 部署平台環境變數）。

---

## 資料庫與 RLS

執行 `supabase/migrations/0001_create_schema.sql`（Supabase Dashboard → SQL Editor，或 Supabase CLI）。

建立兩張表：

**survey_responses**（問券回應）
| 欄位 | 說明 |
| --- | --- |
| id uuid | PK |
| created_at | 填寫時間 |
| parent_name / child_name | 家長/孩子稱呼 |
| q1_feature | Q1 最符合需求的特色 |
| q2_change / q2_other | Q2 變化 + 其他 |
| q3_expectation / q3_other | Q3 期待 + 其他 |
| q4_purchase_intent | Q4 購買意願（info / compare / questions / want_results / not_now） |
| q5_objection / q5_other | Q5 疑慮 + 其他 |
| q6_followup | Q6 後續需求 |
| feedback | 開放式回饋 |
| campaign | 固定 `7day_english_camp` |
| batch | 活動梯次（如 2026-10-06） |
| source | 資料來源（default `line`） |
| followup_status | new / contacted / closed / no_response |
| lead_status | HIGH / MEDIUM / FOLLOW_UP / LOW |

**survey_admins**（管理員 email 白名單）

**RLS 規則**
- anon / authenticated：只能 `INSERT`（訪客填寫問券）。
- authenticated + email 在 `survey_admins`：可 `SELECT` / `UPDATE`（後台）。
- 一般訪客即使註冊也無法讀取問券資料。

---

## 後台登入

1. Supabase Dashboard → Authentication → Users → **Add user** 建立帳號（例如 `admin@ienglishtw.com`）。
2. 將該 email 插入白名單：
   ```sql
   insert into public.survey_admins (email) values ('admin@ienglishtw.com');
   ```
3. 於網站 `/admin` 以該 email 與密碼登入（走 Supabase Auth，RLS 只允許白名單帳號讀取）。

> 建議：Supabase Dashboard → Authentication → Providers → Email → 關閉「Allow new users to sign up」，避免陌生人自行註冊後台帳號。

---

## Lead 分類（後台內部，不顯示給家長）

| 條件（Q4） | lead_status |
| --- | --- |
| 想進一步了解正式使用方式 | HIGH |
| 有興趣，但想比較看看 / 有疑問 | MEDIUM |
| 想先看 7 日成果 | FOLLOW_UP |
| 目前先不考慮 | LOW |

**跟進優先排序**（後台徽章）
- 🔥 建議優先聯繫：Q4=info 或 Q6=agent/consult
- 🟡 建議持續培養：Q4=compare/questions
- 🔵 等待家長需求：Q4=want_results 或 Q6=results/plan
- ⚪ 暫不跟進：其餘

---

## 功能一覽

**前台**
- 開場 → 稱呼（不要求真名）→ Q1..Q6 逐題呈現，選項點擊後自動前進（手機友善），有 「第 X / 6 題」進度條。
- Q2/Q3/Q5 選「其他」時動態顯示文字輸入框（必填）。
- 開放式回饋（選填）→ 「完成問券」送出：顯示 loading、防重複提交。
- 完成 Modal：依 Q4 / Q6 顯示不同 CTA 並導向官方 LINE；暫不考慮者不強迫推銷。
- 錯誤處理：提交失敗保留內容並提示重試；網路不穩有提示。
- `?batch=2026-10-06` 可指定活動梯次（未來不同梯次共用同一套問券）。
- Mobile-first（360/375/390/414px 與 1280/1440px 均正常）。

**後台（/admin）**
- Email + 密碼登入（Supabase Auth）。
- Dashboard：總/今日/本週填寫數、希望顧問聯繫數、Q4 購買意願 donut、各題分布長條圖。
- 資料列表：搜尋、依梯次 / 購買意願 / 跟進狀態篩選、時間排序、單筆完整檢視。
- 跟進狀態快速更新（寫回 Supabase）。
- 匯出 Excel / CSV（中文欄位，含 Lead 分類與跟進優先）。

---

## 常用指令

```bash
npm install
npm run dev       # 本機開發（http://localhost:5173）
npm run build     # 型別檢查 + 正式 build
npm run preview   # 預覽正式 build
npm run lint      # oxlint
npm test          # vitest 單元測試
```

---

## 部署

**方案 A：Netlify**
- Build command：`npm run build`
- Publish directory：`dist`
- 已附 `public/_redirects`（SPA fallback），`/admin` 可直接存取。

**方案 B：Vercel**
- Framework preset：Vite
- Build command：`npm run build`
- Output directory：`dist`
- 已附 `vercel.json` 做 rewrite。

**方案 C：Supabase 靜態託管**
- Supabase Dashboard → Storage → 開啟 bucket，上傳 `dist/`，或使用 `supabase deploy` 搭配 CI。

> 記得在部署平台設定與 `.env` 相同的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`、`VITE_LINE_OFFICIAL_URL`。

---

## 測試紀錄

已執行並通過：
- `npm run build`：型別檢查 + build 成功（lazy loading 分離後台 chunk）。
- `npm run lint`：0 warnings / 0 errors。
- `npm test`：**18 個測試全部通過**（sanitize 4、lead 11、excel 3）。
- E2E（需正式 Supabase creds）：`node tests/e2e.mjs`，走「家長填寫 → Submit → 寫入 Supabase → 後台登入 → 讀取資料 → 篩選/搜尋/單筆檢視」。

### 設定正式環境測試

```bash
# Windows PowerShell
$env:E2E_SUPABASE_URL="https://xxxx.supabase.co"
$env:E2E_SUPABASE_PUBLISHABLE_KEY="eyJ..."
$env:E2E_ADMIN_EMAIL="admin@ienglishtw.com"
$env:E2E_ADMIN_PASSWORD="密碼"
node tests/e2e.mjs
```