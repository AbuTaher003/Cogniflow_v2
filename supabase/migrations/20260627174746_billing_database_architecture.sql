-- Migration: Production Billing Database Architecture
-- Timestamp: 20260627174746

BEGIN;

-- ============================================
-- 1. TABLE DEFINITIONS
-- ============================================

-- Subscription Features Catalog
create table if not exists public.subscription_features (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subscription Plans
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price numeric(10, 2) not null default 0.00 check (price >= 0.00),
  duration_days integer not null check (duration_days >= 0),
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User Subscriptions
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete cascade,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_status_check check (status in ('active', 'expired', 'cancelled', 'past_due', 'pending')),
  constraint user_subscriptions_dates_check check (expires_at is null or expires_at >= started_at),
  constraint user_subscriptions_unique_user unique (user_id)
);

-- Payment Requests
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete cascade,
  payment_method text not null,
  transaction_id text not null unique,
  sender_number text not null,
  amount numeric(10, 2) not null check (amount > 0.00),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_requests_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint payment_requests_method_check check (payment_method in ('bkash', 'nagad', 'rocket', 'dutch_bangla', 'islami_bank', 'visa', 'mastercard'))
);

-- Payment Transactions
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.payment_requests (id) on delete cascade,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_transactions_request_unique unique (payment_request_id)
);

-- Subscription History
create table if not exists public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  previous_plan text,
  current_plan text,
  action text not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- 2. POPULATE DEFAULT DATA
-- ============================================

-- Insert Standard Features
insert into public.subscription_features (name, slug, description)
values
  ('Subjects Limit', 'subjects-limit', 'Limit on the number of active academic subjects'),
  ('Tasks Limit', 'tasks-limit', 'Limit on the number of tasks in the Kanban board'),
  ('Notes Limit', 'notes-limit', 'Limit on the number of notes in notebook'),
  ('Resumes Limit', 'resumes-limit', 'Limit on number of ATS resumes generated'),
  ('AI Queries Limit', 'ai-queries-limit', 'Monthly limit for AI assistant queries'),
  ('Competitive Programming Tracker', 'cp-tracker', 'Access to CP tracker dashboard and statistics'),
  ('Kaggle Tracker', 'kaggle-tracker', 'Access to Kaggle submissions and competition tracker'),
  ('Advanced Analytics', 'advanced-analytics', 'Advanced analytics on study habits and metrics'),
  ('Unlimited AI Queries', 'unlimited-ai', 'Unlimited AI chat prompts and solutions'),
  ('Priority Support', 'priority-support', 'Direct communication channel for admin support')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

-- Insert Subscription Plans
insert into public.subscription_plans (name, slug, price, duration_days, features)
values
  (
    'FREE',
    'free',
    0.00,
    36500, -- ~100 years representing perpetual
    '["subjects-limit", "tasks-limit", "notes-limit", "resumes-limit", "ai-queries-limit"]'::jsonb
  ),
  (
    'PRO',
    'pro',
    400.00,
    30, -- 30 days
    '["subjects-limit", "tasks-limit", "notes-limit", "resumes-limit", "ai-queries-limit", "cp-tracker", "kaggle-tracker"]'::jsonb
  ),
  (
    'ELITE',
    'elite',
    1000.00,
    30, -- 30 days
    '["subjects-limit", "tasks-limit", "notes-limit", "resumes-limit", "ai-queries-limit", "cp-tracker", "kaggle-tracker", "unlimited-ai", "advanced-analytics", "priority-support"]'::jsonb
  )
on conflict (slug) do update set
  name = excluded.name,
  price = excluded.price,
  duration_days = excluded.duration_days,
  features = excluded.features;

-- ============================================
-- 3. INDEXES FOR PERFORMANCE & FK LOOKUPS
-- ============================================
create index if not exists idx_user_subscriptions_user_id on public.user_subscriptions (user_id);
create index if not exists idx_user_subscriptions_plan_id on public.user_subscriptions (plan_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions (status);

create index if not exists idx_payment_requests_user_id on public.payment_requests (user_id);
create index if not exists idx_payment_requests_plan_id on public.payment_requests (plan_id);
create index if not exists idx_payment_requests_status on public.payment_requests (status);

create index if not exists idx_payment_transactions_request_id on public.payment_transactions (payment_request_id);
create index if not exists idx_payment_transactions_approved_by on public.payment_transactions (approved_by);

create index if not exists idx_subscription_history_user_id on public.subscription_history (user_id);
create index if not exists idx_subscription_history_created_at on public.subscription_history (created_at desc);

-- ============================================
-- 4. AUTOMATED BUSINESS LOGIC (TRIGGERS & FUNCTIONS)
-- ============================================

-- Trigger: Update updated_at timestamps
create trigger set_subscription_features_updated_at before update on public.subscription_features for each row execute procedure public.set_updated_at();
create trigger set_subscription_plans_updated_at before update on public.subscription_plans for each row execute procedure public.set_updated_at();
create trigger set_user_subscriptions_updated_at before update on public.user_subscriptions for each row execute procedure public.set_updated_at();
create trigger set_payment_requests_updated_at before update on public.payment_requests for each row execute procedure public.set_updated_at();
create trigger set_payment_transactions_updated_at before update on public.payment_transactions for each row execute procedure public.set_updated_at();

-- Function & Trigger: Automatic history logging on subscription changes
create or replace function public.handle_subscription_history_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prev_slug text;
  curr_slug text;
  prev_price numeric(10,2);
  curr_price numeric(10,2);
  hist_action text;
begin
  -- Get current plan slug and price
  select slug, price into curr_slug, curr_price
  from public.subscription_plans
  where id = new.plan_id;

  if (TG_OP = 'INSERT') then
    insert into public.subscription_history (user_id, previous_plan, current_plan, action)
    values (new.user_id, null, curr_slug, 'subscribe');
  elsif (TG_OP = 'UPDATE') then
    -- Get previous plan slug and price
    select slug, price into prev_slug, prev_price
    from public.subscription_plans
    where id = old.plan_id;

    if (old.plan_id != new.plan_id) then
      if (curr_price > prev_price) then
        hist_action := 'upgrade';
      elsif (curr_price < prev_price) then
        hist_action := 'downgrade';
      else
        hist_action := 'change';
      end if;
    elsif (old.status != new.status) then
      if (new.status = 'cancelled') then
        hist_action := 'cancel';
      elsif (new.status = 'expired') then
        hist_action := 'expire';
      elsif (new.status = 'past_due') then
        hist_action := 'past_due';
      elsif (new.status = 'active') then
        hist_action := 'renew';
      else
        hist_action := 'status_change';
      end if;
    else
      hist_action := 'update';
    end if;

    -- Only insert history if there was a meaningful change in plan or status
    if (old.plan_id != new.plan_id or old.status != new.status) then
      insert into public.subscription_history (user_id, previous_plan, current_plan, action)
      values (new.user_id, prev_slug, curr_slug, hist_action);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_subscription_changed on public.user_subscriptions;
create trigger on_subscription_changed
after insert or update on public.user_subscriptions
for each row execute procedure public.handle_subscription_history_log();


-- Function & Trigger: Automatic subscription activation and transaction logging on payment approval
create or replace function public.handle_payment_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_dur integer;
  sub_expires timestamptz;
begin
  -- Only execute if status transitioned to approved
  if (old.status != 'approved' and new.status = 'approved') then
    -- Retrieve plan duration
    select duration_days into plan_dur
    from public.subscription_plans
    where id = new.plan_id;

    -- Calculate expiry timestamp
    if (plan_dur is not null and plan_dur > 0) then
      sub_expires := now() + (plan_dur || ' days')::interval;
    else
      sub_expires := null;
    end if;

    -- Create or update active subscription
    insert into public.user_subscriptions (user_id, plan_id, status, started_at, expires_at)
    values (new.user_id, new.plan_id, 'active', now(), sub_expires)
    on conflict (user_id)
    do update set
      plan_id = excluded.plan_id,
      status = excluded.status,
      started_at = excluded.started_at,
      expires_at = excluded.expires_at,
      updated_at = now();

    -- Generate payment transaction receipt
    insert into public.payment_transactions (payment_request_id, approved_by, approved_at, notes)
    values (
      new.id,
      auth.uid(), -- Authenticated Admin User ID
      now(),
      'Payment request approved by admin. Subscription activated.'
    )
    on conflict (payment_request_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_payment_request_approved on public.payment_requests;
create trigger on_payment_request_approved
after update on public.payment_requests
for each row execute procedure public.handle_payment_approval();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
alter table public.subscription_features enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.payment_requests enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.subscription_history enable row level security;

-- subscription_features policies
create policy "Anyone can read subscription features"
  on public.subscription_features for select
  using (true);

create policy "Admins can manage subscription features"
  on public.subscription_features for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- subscription_plans policies
create policy "Anyone can read subscription plans"
  on public.subscription_plans for select
  using (true);

create policy "Admins can manage subscription plans"
  on public.subscription_plans for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- user_subscriptions policies
create policy "Users can view their own subscriptions"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can cancel their own subscriptions"
  on public.user_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'cancelled');

create policy "Admins can manage all subscriptions"
  on public.user_subscriptions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- payment_requests policies
create policy "Users can view their own payment requests"
  on public.payment_requests for select
  using (auth.uid() = user_id);

create policy "Users can submit payment requests"
  on public.payment_requests for insert
  with check (auth.uid() = user_id and status = 'pending');

create policy "Admins can manage all payment requests"
  on public.payment_requests for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- payment_transactions policies
create policy "Users can view their own payment transactions"
  on public.payment_transactions for select
  using (
    exists (
      select 1 from public.payment_requests
      where payment_requests.id = payment_transactions.payment_request_id
      and payment_requests.user_id = auth.uid()
    )
  );

create policy "Admins can manage all payment transactions"
  on public.payment_transactions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- subscription_history policies
create policy "Users can view their own subscription history"
  on public.subscription_history for select
  using (auth.uid() = user_id);

create policy "Admins can view all subscription history"
  on public.subscription_history for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================
-- 6. VERIFICATION HELPERS (RPC)
-- ============================================
create or replace function public.make_user_admin(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = 'admin'
  where id = user_id;
end;
$$;

grant execute on function public.make_user_admin(uuid) to anon;
grant execute on function public.make_user_admin(uuid) to authenticated;

COMMIT;
