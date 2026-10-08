create table if not exists public.survey_responses (
  id uuid primary key,
  created_at timestamptz not null default now(),
  survey_version text not null,
  screened_out boolean not null default false,
  participation text not null check (participation in ('regularmente','a_veces','no')),
  country text not null,
  plan_order jsonb,
  plan_labels jsonb,
  plan_answers jsonb,
  preferred_plan text,
  trust_factors jsonb,
  trust_other text,
  duration_seconds integer not null default 0,
  source text not null default 'direct',
  campaign text not null default ''
);

alter table public.survey_responses enable row level security;

-- No public policies. The Vercel serverless function inserts using the service-role key.
-- Never expose SUPABASE_SECRET_KEY in browser code.

create index if not exists survey_responses_created_at_idx on public.survey_responses (created_at desc);
create index if not exists survey_responses_country_idx on public.survey_responses (country);
