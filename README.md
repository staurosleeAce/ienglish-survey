# iEnglish 7 日英語閱讀口說營 · 結營問券

一個「7 日學習成果回顧 × 家長需求探索 × 後續協助蒐集」的互動式問券網站。

品牌視覺取自 iEnglish 台灣官方網站（品牌藍 `#1c9ad6` 為主 × 品牌綠 `#35b58a` 背景 × 黃 `#ffc222` 點綴），採 Mobile-first 設計，單頁互動式問券、逐題呈現、全部複選題。

---

## 技術總覽

| 層 | 技術 |
| --- | --- |
| 前端 | React 19 + TypeScript + Vite 8 |
| 路由 | react-router-dom（HashRouter；`/` 問券、`/admin` 後台，後台 `lazy` 分離載入） |
| 資料庫 / Auth / API | Supabase（PostgreSQL + PostgREST + Auth + Row Level Security） |
| 匯出 | SheetJS（xlsx）、手寫 CSV |
| 圖表 | 純 SVG / CSS（無額外 chart 套件） |
| 樣式 | 自訂 CSS（Mobile-first，Design Tokens） |
| 測試 | Vitest（sanitize / lead 分類 / Excel 欄位）+ puppeteer E2E |

> **正式資料來源只有 Supabase**。前端使用 **publishable key**（可公開），一切資料讀寫權限由 Row Level Security 在資料庫端決定。沒有 localStorage / mock / demo data。
> secret key / service_role key 一律只存在 server-side，絕不出現在瀏覽器。

---

## 問券結構（v2）

- **Q1**（複選）哪一個特色最符合孩子目前的需要（+其他）
- **Q2**（複選）7 天後孩子出現的明顯變化（+其他）
- **Q3**（複選）最期待孩子持續使用後做到的事（+其他）
- **Q4**（複選）接下來最希望我們提供哪一項協助（+其他）
- 開放式回饋（選填）→ 完成

> 全部題目皆為**複選**（checkbox）。送出後僅顯示完成彈窗與「離開此頁面」，**不再有 CTA 或 LINE 導流**。

---

## 目錄結構

```
ienglish-survey/
├─ index.html
├─ vite.config.ts                # base: './'（支援子目錄部署）
├─ supabase/
│  └─ migrations/
│     ├─ 0001_create_schema.sql  # 初始 schema + RLS
│     ├─ 0002_q5_q6_array.sql    # （歷史）Q5/Q6 改陣列
│     └─ 0003_survey_v2.sql      # ★ v2：Q1~Q4 全部 text[]、Q4 合併、清空歷史
├─ src/
│  ├─ styles/index.css           # 設計系統（品牌色、元件、動畫）
│  ├─ data/survey.ts             # 4 題題目與選項
│  ├─ types.ts                   # Answers / SurveyRecord
│  ├─ lib/{config,supabase,database.types,api,sanitize,excel}.ts
│  ├─ components/{CompletionModal,ResponseDetail}.tsx
│  └─ pages/{SurveyPage,AdminPage}.tsx
├─ public/
│  ├─ ienglish-logo.png          # 左上角品牌 LOGO
│  └─ xiaoi-hero.png             # 完成彈窗小 i 主視覺
└─ tests/
```

---

## 環境變數（.env）

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

- `VITE_SUPABASE_URL`：Supabase Project URL。
- `VITE_SUPABASE_PUBLISHABLE_KEY`：**publishable key**（可安全放前端；權限由 RLS 決定）。

> ⚠️ **secret key / service_role key 不得放入前端**。本專案前端只使用 publishable key。

---

## 資料庫與 RLS

於 Supabase SQL Editor 依序執行 `supabase/migrations/0001_create_schema.sql` 與 `0003_survey_v2.sql`（全新專案只需 0001 + 0003；0002 為舊版升級用，可略）。

**survey_responses**（v2）
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid | PK |
| created_at | timestamptz | 填寫時間 |
| parent_name / child_name | text | 家長/孩子稱呼 |
| q1_feature | text[] | Q1（複選） |
| q1_other | text | Q1 其他 |
| q2_change / q2_other | text[] / text | Q2（複選）+其他 |
| q3_expectation / q3_other | text[] / text | Q3（複選）+其他 |
| q4_assistance / q4_other | text[] / text | Q4（複選）+其他 |
| feedback | text | 開放式回饋 |
| campaign | text | 固定 `7day_english_camp` |
| batch | text | 活動梯次（如 2026-10-06） |
| source | text | 資料來源（default `line`） |
| followup_status | text | new / contacted / closed / no_response |
| lead_status | text | HIGH / MEDIUM / FOLLOW_UP / LOW |

**survey_admins**：管理員 email 白名單。

**RLS 規則**
- anon / authenticated：只能 `INSERT`（訪客填問券）。
- authenticated + email 在 `survey_admins`：可 `SELECT` / `UPDATE` / `DELETE`。

---

## 後台登入

1. Supabase Dashboard → Authentication → Users → **Add user** 建立帳號。
2. 加入白名單：`insert into public.survey_admins (email) values ('你的email');`
3. 於網站 `#/admin` 以該 email 與密碼登入。

> 建議：Authentication → Providers → Email → 關閉「Allow new users to sign up」。

---

## Lead 分類（後台內部，依 Q4 複選推導）

| 條件（Q4 選項） | lead_status |
| --- | --- |
| 希望專人說明 / 想與客服顧問聊聊 | HIGH |
| 想了解方案費用 / 學習成果 | MEDIUM |
| 想再觀察一段時間 | FOLLOW_UP |
| 其他 | LOW |

**跟進優先排序**（後台徽章）
- 🔥 建議優先聯繫：Q4 含 agent / consult
- 🟡 建議持續培養：Q4 含 plan_cost / results
- 🔵 等待家長需求：Q4 含 observe
- ⚪ 暫不跟進：其餘

---

## 功能一覽

**前台**
- 開場 → 稱呼（不要求真名）→ Q1~Q4 逐題呈現（皆可複選），「第 X / 4 題」進度條。
- 每題選「其他」時動態顯示文字輸入框（必填）。
- 開放式回饋（選填）→「完成問券」送出：loading、防重複提交。
- 完成彈窗：小 i 主視覺 + 成功訊息 + **「離開此頁面」**（無 CTA、無 LINE）。
- `#/?batch=2026-10-06` 可指定梯次。
- Mobile-first（360/375/390/414 / 1280 / 1440）。

**後台（#/admin）**
- Email + 密碼登入（Supabase Auth）。
- Dashboard：總/今日/本週填寫數、希望顧問聯繫數、Q1~Q4 分布長條圖。
- 資料列表：搜尋（含多選內容）、依梯次 / Lead / 跟進狀態篩選、時間排序、單筆完整檢視。
- 匯出 Excel / CSV（多選以「；」串接）。

---

## 常用指令

```bash
npm install
npm run dev       # 本機開發
npm run build     # 型別檢查 + build
npm run preview   # 預覽 build
npm run lint      # oxlint
npm test          # vitest 單元測試
```

---

## 部署

- **GitHub Pages**：repo 已含 `.github/workflows/deploy.yml`（build 時自 GitHub Variables 注入環境變數後部署 Pages）。
- **Netlify**：build `npm run build`、publish `dist`（已附 `public/_redirects`）。
- **Vercel**：Vite preset、output `dist`（已附 `vercel.json`）。

> 記得在部署平台設定 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`。
