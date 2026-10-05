-- ============================================================
-- iEnglish 7日英語閱讀口說營 — Migration 0003
-- 問券 v2：Q1~Q4 全部改為複選（text[]），Q4/Q5/Q6 合併為新的 Q4。
--
-- ⚠️ 依需求「直接刪除歷史資料」：此 migration 會 DROP 並重建
--    survey_responses（survey_admins 與 is_survey_admin() 不受影響）。
-- ============================================================

begin;

-- ---------- 清理舊表（歷史資料一併刪除） ----------
drop table if exists public.survey_responses cascade;

-- ---------- 問券回應表（v2） ----------
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  parent_name text not null,
  child_name text not null,

  -- Q1（複選）
  q1_feature text[] not null default '{}',
  q1_other text,

  -- Q2（複選）
  q2_change text[] not null default '{}',
  q2_other text,

  -- Q3（複選）
  q3_expectation text[] not null default '{}',
  q3_other text,

  -- Q4（複選，合併舊 Q4/Q5/Q6）
  q4_assistance text[] not null default '{}',
  q4_other text,

  feedback text,
  campaign text not null default '7day_english_camp',
  batch text not null,
  source text default 'line',
  followup_status text not null default 'new',
  lead_status text not null default 'MEDIUM'
);

-- 防重複提交：同一 parent_name + child_name + batch 只允許一筆
create unique index survey_responses_dedup_idx
  on public.survey_responses (parent_name, child_name, batch);

-- 索引：後台常用篩選與排序
create index survey_responses_created_at_idx
  on public.survey_responses (created_at desc);
create index survey_responses_batch_idx
  on public.survey_responses (batch);

-- ---------- Row Level Security ----------
alter table public.survey_responses enable row level security;

-- 訪客（anon / authenticated）只能 INSERT：填問券
drop policy if exists "survey_anon_insert" on public.survey_responses;
create policy "survey_anon_insert"
  on public.survey_responses
  for insert
  to anon, authenticated
  with check (true);

-- 只有白名單管理員能 SELECT
drop policy if exists "survey_admin_select" on public.survey_responses;
create policy "survey_admin_select"
  on public.survey_responses
  for select
  to authenticated
  using (public.is_survey_admin());

-- 只有白名單管理員能 UPDATE
drop policy if exists "survey_admin_update" on public.survey_responses;
create policy "survey_admin_update"
  on public.survey_responses
  for update
  to authenticated
  using (public.is_survey_admin())
  with check (public.is_survey_admin());

-- 只有白名單管理員能 DELETE
drop policy if exists "survey_admin_delete" on public.survey_responses;
create policy "survey_admin_delete"
  on public.survey_responses
  for delete
  to authenticated
  using (public.is_survey_admin());

commit;