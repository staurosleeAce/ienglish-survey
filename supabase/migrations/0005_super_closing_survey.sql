-- Super 專案第二份「結束問券」欄位與問券類型隔離

begin;

alter table public.survey_responses
  add column if not exists survey_type text not null default 'start';

alter table public.survey_responses
  add column if not exists closing_child_ages text[] default '{}',
  add column if not exists closing_biggest_gain text[] default '{}',
  add column if not exists closing_expectation text,
  add column if not exists closing_future_interest text,
  add column if not exists closing_next_topic text[] default '{}',
  add column if not exists closing_feedback text,
  add column if not exists closing_action text;

create index if not exists survey_responses_project_type_idx
  on public.survey_responses (project_id, survey_type, created_at desc);

commit;
