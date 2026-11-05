-- iEnglish survey platform: multi-project support
-- Preserves existing records and assigns them to the original project.

begin;

alter table public.survey_responses
  add column if not exists project_id text not null default '7day_english_camp';

alter table public.survey_responses
  add column if not exists super_parent_name text,
  add column if not exists super_line_name text,
  add column if not exists super_child_ages text[] default '{}',
  add column if not exists super_stuck_points text[] default '{}',
  add column if not exists super_source text,
  add column if not exists super_feedback text;

-- The project-specific payload uses its own nullable columns.
alter table public.survey_responses
  alter column parent_name drop not null,
  alter column child_name drop not null,
  alter column q1_feature drop not null,
  alter column q2_change drop not null,
  alter column q3_expectation drop not null,
  alter column q4_assistance drop not null,
  alter column batch drop not null;

drop index if exists public.survey_responses_dedup_idx;
create unique index survey_responses_dedup_idx
  on public.survey_responses (project_id, (coalesce(parent_name, super_parent_name)), batch);

create index if not exists survey_responses_project_idx
  on public.survey_responses (project_id, created_at desc);

commit;
