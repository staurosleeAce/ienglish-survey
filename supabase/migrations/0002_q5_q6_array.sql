-- ============================================================
-- iEnglish 7日英語閱讀口說營 — Migration 0002
-- 將 Q5 / Q6 由單選 text 改為複選 text[]
--
-- 適用：已執行過 0001（舊版 text 欄位）的既有專案。
-- 已是 text[] 的專案直接執行也不會出錯（重複執行安全）。
-- ============================================================

begin;

-- Q5：主要疑慮 → 複選
alter table public.survey_responses
  alter column q5_objection drop default;

alter table public.survey_responses
  alter column q5_objection type text[]
  using case
    when q5_objection is null or q5_objection = '' then '{}'
    else array[q5_objection]
  end;

alter table public.survey_responses
  alter column q5_objection set default '{}';

-- Q6：後續協助需求 → 複選
alter table public.survey_responses
  alter column q6_followup drop default;

alter table public.survey_responses
  alter column q6_followup type text[]
  using case
    when q6_followup is null or q6_followup = '' then '{}'
    else array[q6_followup]
  end;

alter table public.survey_responses
  alter column q6_followup set default '{}';

commit;