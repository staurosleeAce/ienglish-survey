-- ============================================================
-- iEnglish 7日英語閱讀口說營 · 結營問券 — Supabase 完整 Setup
-- 適用：Dashboard → SQL Editor → New query → 貼上全部 → Run
--
-- ⚠️ 此版本會先 DROP 再重建 survey_responses / survey_admins。
--    僅限「尚未有正式資料」的設定階段使用。
--    若已有真實資料，請改用 migration_002（without drop）。
-- ============================================================

begin;

-- ---------- 清理殘留（設定階段安全） ----------
drop table if exists public.survey_responses cascade;
drop table if exists public.survey_admins cascade;

-- ---------- 延伸模組 ----------
create extension if not exists "pgcrypto";

-- ---------- 問券回應表 ----------
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  parent_name text not null,
  child_name text not null,
  q1_feature text not null,
  q2_change text not null,
  q2_other text,
  q3_expectation text not null,
  q3_other text,
  q4_purchase_intent text not null,
  q5_objection text[] not null default '{}',
  q5_other text,
  q6_followup text[] not null default '{}',
  feedback text,
  campaign text not null default '7day_english_camp',
  batch text not null,
  source text default 'line',
  followup_status text not null default 'new',
  lead_status text not null default 'MEDIUM'
);

-- 防重複提交
create unique index survey_responses_dedup_idx
  on public.survey_responses (parent_name, child_name, batch);

-- 索引：後台常用篩選與排序
create index survey_responses_created_at_idx
  on public.survey_responses (created_at desc);
create index survey_responses_batch_idx
  on public.survey_responses (batch);
create index survey_responses_q4_idx
  on public.survey_responses (q4_purchase_intent);

-- ---------- 管理員帳號表 ----------
create table public.survey_admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- ---------- 管理員判斷函式 ----------
-- security definer：以 owner（postgres）權限執行，內部查詢不受 RLS 影響，
-- 避免「survey_admins 的 SELECT policy 查 survey_admins」造成的無限遞迴。
create or replace function public.is_survey_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.survey_admins a
    where a.email = auth.jwt() ->> 'email'
  );
$$;

-- ---------- Row Level Security ----------
alter table public.survey_responses enable row level security;
alter table public.survey_admins enable row level security;

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

-- 白名單表：僅管理員能讀取（用函式，不自我參照）
drop policy if exists "survey_admins_admin_select" on public.survey_admins;
create policy "survey_admins_admin_select"
  on public.survey_admins
  for select
  to authenticated
  using (public.is_survey_admin());

-- 只有白名單管理員能 DELETE（後台清理測試資料用）
drop policy if exists "survey_admin_delete" on public.survey_responses;
create policy "survey_admin_delete"
  on public.survey_responses
  for delete
  to authenticated
  using (public.is_survey_admin());

-- ---------- 管理員白名單 ----------
insert into public.survey_admins (email)
values ('stauroslee@gmail.com')
on conflict (email) do nothing;

commit;