BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE ROLE gm_command_runtime NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS owner_access_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  display_name text NOT NULL,
  clerk_user_id text UNIQUE,
  active boolean NOT NULL DEFAULT true,
  bound_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO owner_access_registry(email,display_name,active) VALUES
  ('mueen.ahmed1922@gmail.com','Mueen Ahmed',TRUE),
  ('reachafridi@gmail.com','Mohammed Afridi',TRUE),
  ('md.hisham29@gmail.com','Mohammed Hisham',TRUE)
ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name,active=TRUE,updated_at=NOW();

CREATE OR REPLACE FUNCTION prevent_owner_identity_rebind() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.clerk_user_id IS NOT NULL AND NEW.clerk_user_id IS DISTINCT FROM OLD.clerk_user_id THEN
    RAISE EXCEPTION 'owner_identity_binding_is_immutable';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_owner_identity_immutable ON owner_access_registry;
CREATE TRIGGER trg_owner_identity_immutable
BEFORE UPDATE OF clerk_user_id ON owner_access_registry
FOR EACH ROW EXECUTE FUNCTION prevent_owner_identity_rebind();

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role = 'owner'),
  active boolean NOT NULL DEFAULT false,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret_encrypted text,
  mfa_enrolled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outlets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  legal_name text,
  city text NOT NULL DEFAULT 'Bengaluru',
  address text,
  opening_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','temporarily_closed','closed')),
  manager_user_id uuid REFERENCES app_users(id),
  monthly_revenue_target numeric(14,2),
  monthly_profit_target numeric(14,2),
  food_cost_target_pct numeric(6,3),
  labour_cost_target_pct numeric(6,3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_outlet_access (
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  can_view_financials boolean NOT NULL DEFAULT false,
  can_edit_operations boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, outlet_id)
);

CREATE TABLE IF NOT EXISTS reporting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closing','closed')),
  closed_at timestamptz,
  closed_by uuid REFERENCES app_users(id),
  close_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);

CREATE TABLE IF NOT EXISTS outlet_monthly_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  gross_revenue numeric(14,2) NOT NULL DEFAULT 0,
  net_revenue numeric(14,2) NOT NULL DEFAULT 0,
  total_orders int NOT NULL DEFAULT 0,
  discounts numeric(14,2) NOT NULL DEFAULT 0,
  refunds numeric(14,2) NOT NULL DEFAULT 0,
  food_cost numeric(14,2) NOT NULL DEFAULT 0,
  packaging_cost numeric(14,2) NOT NULL DEFAULT 0,
  payroll_cost numeric(14,2) NOT NULL DEFAULT 0,
  rent_cost numeric(14,2) NOT NULL DEFAULT 0,
  utilities_cost numeric(14,2) NOT NULL DEFAULT 0,
  aggregator_commission numeric(14,2) NOT NULL DEFAULT 0,
  marketing_cost numeric(14,2) NOT NULL DEFAULT 0,
  maintenance_cost numeric(14,2) NOT NULL DEFAULT 0,
  other_operating_cost numeric(14,2) NOT NULL DEFAULT 0,
  gross_profit numeric(14,2) NOT NULL DEFAULT 0,
  operating_profit numeric(14,2) NOT NULL DEFAULT 0,
  net_profit numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','csv','integration','calculated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outlet_id, period_id)
);

CREATE TABLE IF NOT EXISTS daily_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  business_date date NOT NULL,
  gross_sales numeric(14,2) NOT NULL DEFAULT 0,
  net_sales numeric(14,2) NOT NULL DEFAULT 0,
  orders int NOT NULL DEFAULT 0,
  discounts numeric(14,2) NOT NULL DEFAULT 0,
  refunds numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outlet_id, business_date)
);

CREATE TABLE IF NOT EXISTS sales_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  commission_pct numeric(6,3) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

INSERT INTO sales_channels(code,name,commission_pct) VALUES
  ('DINE_IN','Dine-in',0),('TAKEAWAY','Takeaway',0),('DIRECT','Direct',0),('SWIGGY','Swiggy',0),('ZOMATO','Zomato',0),('OTHER','Other',0)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS channel_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  business_date date NOT NULL,
  channel_id uuid NOT NULL REFERENCES sales_channels(id),
  gross_sales numeric(14,2) NOT NULL DEFAULT 0,
  net_sales numeric(14,2) NOT NULL DEFAULT 0,
  orders int NOT NULL DEFAULT 0,
  commission numeric(14,2) NOT NULL DEFAULT 0,
  discounts numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outlet_id, business_date, channel_id)
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  financial_bucket text NOT NULL CHECK (financial_bucket IN ('food','packaging','payroll','rent','utilities','commission','marketing','maintenance','other')),
  active boolean NOT NULL DEFAULT true
);

INSERT INTO expense_categories(code,name,financial_bucket) VALUES
 ('FOOD','Food & Ingredients','food'),('PACKAGING','Packaging','packaging'),('PAYROLL','Payroll','payroll'),('RENT','Rent','rent'),('UTILITIES','Utilities','utilities'),('COMMISSION','Aggregator Commission','commission'),('MARKETING','Marketing','marketing'),('MAINTENANCE','Maintenance','maintenance'),('OTHER','Other Operating','other')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  expense_date date NOT NULL,
  category_id uuid NOT NULL REFERENCES expense_categories(id),
  vendor_name text,
  reference_no text,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  description text,
  attachment_key text,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text UNIQUE,
  full_name text NOT NULL,
  preferred_name text,
  role_title text NOT NULL,
  employment_type text NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contract','intern')),
  home_outlet_id uuid REFERENCES outlets(id),
  joining_date date,
  leaving_date date,
  notice_given_date date,
  planned_last_working_date date,
  exit_reason text,
  probation_end_date date,
  confirmed_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','leave','notice','inactive')),
  CHECK (planned_last_working_date IS NULL OR joining_date IS NULL OR planned_last_working_date >= joining_date),
  manager_staff_id uuid REFERENCES staff_members(id),
  monthly_cost numeric(14,2),
  current_monthly_salary numeric(14,2) CHECK (current_monthly_salary IS NULL OR current_monthly_salary >= 0),
  salary_effective_from date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_salary_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  effective_from date NOT NULL,
  monthly_salary numeric(14,2) NOT NULL CHECK (monthly_salary >= 0),
  previous_monthly_salary numeric(14,2) CHECK (previous_monthly_salary IS NULL OR previous_monthly_salary >= 0),
  change_type text NOT NULL CHECK (change_type IN ('joining','increment','adjustment','correction')),
  notes text,
  changed_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_outlet_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  start_date date NOT NULL,
  end_date date,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id),
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  scheduled_days numeric(6,2) NOT NULL DEFAULT 0,
  present_days numeric(6,2) NOT NULL DEFAULT 0,
  absent_days numeric(6,2) NOT NULL DEFAULT 0,
  leave_days numeric(6,2) NOT NULL DEFAULT 0,
  late_count int NOT NULL DEFAULT 0,
  overtime_hours numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, period_id)
);

CREATE TABLE IF NOT EXISTS staff_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  overall_rating numeric(3,1) NOT NULL CHECK (overall_rating BETWEEN 0 AND 10),
  attendance_rating numeric(3,1) CHECK (attendance_rating BETWEEN 0 AND 10),
  role_skill_rating numeric(3,1) CHECK (role_skill_rating BETWEEN 0 AND 10),
  teamwork_rating numeric(3,1) CHECK (teamwork_rating BETWEEN 0 AND 10),
  ownership_rating numeric(3,1) CHECK (ownership_rating BETWEEN 0 AND 10),
  strengths text,
  improvement_points text,
  review_notes text,
  reviewed_by uuid REFERENCES app_users(id),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, period_id)
);

CREATE TABLE IF NOT EXISTS staff_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('joining','probation','confirmation','promotion','transfer','recognition','warning','notice','exit','increment','other')),
  effective_date date NOT NULL,
  title text NOT NULL,
  notes text,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outlet_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  revenue_target numeric(14,2),
  profit_target numeric(14,2),
  orders_target int,
  food_cost_pct_target numeric(6,3),
  labour_cost_pct_target numeric(6,3),
  aov_target numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, period_id)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE,
  name text NOT NULL,
  category text,
  active boolean NOT NULL DEFAULT true,
  kitchen_recipe_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_performance_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  quantity_sold int NOT NULL DEFAULT 0,
  net_sales numeric(14,2) NOT NULL DEFAULT 0,
  estimated_food_cost numeric(14,2),
  contribution_margin numeric(14,2),
  refunds int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, period_id, menu_item_id)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE,
  name text NOT NULL,
  unit text NOT NULL,
  category text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  item_id uuid NOT NULL REFERENCES inventory_items(id),
  snapshot_date date NOT NULL,
  on_hand_qty numeric(14,3) NOT NULL DEFAULT 0,
  unit_cost numeric(14,4) NOT NULL DEFAULT 0,
  reorder_point numeric(14,3),
  wastage_qty numeric(14,3) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, item_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  payment_terms text,
  category text,
  reliability_pct numeric(5,2) CHECK (reliability_pct IS NULL OR reliability_pct BETWEEN 0 AND 100),
  fill_rate_pct numeric(5,2) CHECK (fill_rate_pct IS NULL OR fill_rate_pct BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  vendor_id uuid REFERENCES vendors(id),
  purchase_date date NOT NULL,
  invoice_no text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','partial','paid','disputed')),
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES inventory_items(id),
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 0,
  unit_cost numeric(14,4) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  business_date date NOT NULL,
  expected_cash numeric(14,2) NOT NULL DEFAULT 0,
  counted_cash numeric(14,2) NOT NULL DEFAULT 0,
  banked_cash numeric(14,2) NOT NULL DEFAULT 0,
  variance numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  reconciled_by uuid REFERENCES app_users(id),
  reconciled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, business_date)
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid REFERENCES outlets(id),
  document_type text NOT NULL,
  title text NOT NULL,
  storage_key text NOT NULL,
  expires_on date,
  confidential boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid REFERENCES outlets(id),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','watch','high','critical')),
  title text NOT NULL,
  detail text,
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved','dismissed')),
  detected_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_by uuid REFERENCES app_users(id),
  acknowledged_at timestamptz,
  resolved_by uuid REFERENCES app_users(id),
  resolved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid REFERENCES outlets(id),
  alert_id uuid REFERENCES alerts(id),
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','blocked','done','cancelled')),
  assigned_user_id uuid REFERENCES app_users(id),
  due_at timestamptz,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK(code ~ '^[a-z0-9_]+$'),
  name text NOT NULL,
  description text,
  schedule_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES app_users(id),
  updated_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  item_order int NOT NULL CHECK(item_order > 0),
  label text NOT NULL CHECK(length(btrim(label)) >= 2),
  detail text,
  required boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES app_users(id),
  updated_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id,item_order)
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_template_order ON checklist_items(template_id,item_order);

INSERT INTO checklist_templates(code,name,description,schedule_time,timezone,active)
VALUES
  ('opening','Daily Opening','Complete before the outlet begins normal service.','10:00','Asia/Kolkata',true),
  ('closing','Daily Closing','Complete after service and before the outlet is secured.','23:00','Asia/Kolkata',true)
ON CONFLICT(code) DO NOTHING;

WITH defaults(code,item_order,label,detail,required) AS (
  VALUES
    ('opening',1,'Premises and kitchen cleaned and ready','Confirm prep, counters, floors and food-contact surfaces are ready for service.',true),
    ('opening',2,'Chiller and freezer temperatures checked','Record any out-of-range temperature as a failed check and escalate immediately.',true),
    ('opening',3,'Staff attendance, uniform and grooming checked','Confirm the opening team is present and presentation standards are met.',true),
    ('opening',4,'Opening stock and critical items verified','Check key ingredients, packaging and fast-moving items before service starts.',true),
    ('opening',5,'POS, cash float and delivery tablets ready','Confirm billing, payment and aggregator systems are online.',true),
    ('closing',1,'Closing stock and critical variances recorded','Record closing stock or any material variance before leaving the outlet.',true),
    ('closing',2,'Wastage and spoilage entered','Log food wastage, spoilage and exceptional loss for the day.',true),
    ('closing',3,'Cash, POS and aggregator reconciliation completed','Confirm expected collections match recorded collections and flag variances.',true),
    ('closing',4,'Kitchen and equipment cleaned and safely shut down','Complete cleaning and shut down only equipment that should not remain powered.',true),
    ('closing',5,'Waste disposed and outlet secured','Confirm waste handling, doors, utilities and final security checks are complete.',true)
)
INSERT INTO checklist_items(template_id,item_order,label,detail,required,active)
SELECT t.id,d.item_order,d.label,d.detail,d.required,true
FROM defaults d JOIN checklist_templates t ON t.code=d.code
WHERE NOT EXISTS (SELECT 1 FROM checklist_items i WHERE i.template_id=t.id)
ON CONFLICT(template_id,item_order) DO NOTHING;

CREATE TABLE IF NOT EXISTS customer_experience_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  google_rating numeric(3,2) CHECK (google_rating IS NULL OR google_rating BETWEEN 0 AND 5),
  swiggy_rating numeric(3,2) CHECK (swiggy_rating IS NULL OR swiggy_rating BETWEEN 0 AND 5),
  zomato_rating numeric(3,2) CHECK (zomato_rating IS NULL OR zomato_rating BETWEEN 0 AND 5),
  complaints_received int NOT NULL DEFAULT 0 CHECK (complaints_received >= 0),
  complaints_unresolved int NOT NULL DEFAULT 0 CHECK (complaints_unresolved >= 0),
  owner_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, period_id),
  CHECK (complaints_unresolved <= complaints_received)
);

CREATE TABLE IF NOT EXISTS equipment_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  asset_code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'operational' CHECK(status IN ('operational','attention','down','retired')),
  installed_on date,
  last_service_on date,
  next_service_due date,
  vendor_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  asset_id uuid REFERENCES equipment_assets(id),
  reported_at timestamptz NOT NULL DEFAULT now(),
  priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','critical')),
  issue text NOT NULL,
  vendor_name text,
  estimated_cost numeric(14,2) CHECK(estimated_cost IS NULL OR estimated_cost >= 0),
  actual_cost numeric(14,2) CHECK(actual_cost IS NULL OR actual_cost >= 0),
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','cancelled')),
  resolved_at timestamptz,
  resolution_notes text,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outlet_audits_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  audit_date date NOT NULL DEFAULT CURRENT_DATE,
  hygiene numeric(4,2) NOT NULL CHECK(hygiene BETWEEN 0 AND 10),
  food_quality numeric(4,2) NOT NULL CHECK(food_quality BETWEEN 0 AND 10),
  service numeric(4,2) NOT NULL CHECK(service BETWEEN 0 AND 10),
  stock_discipline numeric(4,2) NOT NULL CHECK(stock_discipline BETWEEN 0 AND 10),
  staff_presentation numeric(4,2) NOT NULL CHECK(staff_presentation BETWEEN 0 AND 10),
  equipment_condition numeric(4,2) NOT NULL CHECK(equipment_condition BETWEEN 0 AND 10),
  compliance numeric(4,2) NOT NULL CHECK(compliance BETWEEN 0 AND 10),
  overall_score numeric(5,2) NOT NULL CHECK(overall_score BETWEEN 0 AND 100),
  notes text,
  reviewed_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, period_id)
);

CREATE TABLE IF NOT EXISTS data_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type text NOT NULL,
  outlet_id uuid REFERENCES outlets(id),
  period_id uuid REFERENCES reporting_periods(id),
  original_filename text NOT NULL,
  storage_key text,
  status text NOT NULL DEFAULT 'uploaded' CHECK(status IN ('uploaded','validating','ready','imported','failed','rolled_back')),
  row_count int,
  accepted_count int,
  rejected_count int,
  error_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);


CREATE TABLE IF NOT EXISTS access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES app_users(id),
  clerk_user_id text NOT NULL,
  email text,
  display_name text,
  role text,
  event_type text NOT NULL CHECK(event_type IN ('login','logout','access_denied')),
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS access_logs_one_login_logout_per_session_idx
  ON access_logs(session_id,event_type) WHERE event_type IN ('login','logout');
CREATE INDEX IF NOT EXISTS access_logs_user_idx ON access_logs(clerk_user_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count int NOT NULL DEFAULT 0 CHECK(request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limit_buckets_updated_idx ON rate_limit_buckets(updated_at);

CREATE TABLE IF NOT EXISTS security_events (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES app_users(id),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK(severity IN ('info','watch','high','critical')),
  session_id text,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approved_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  device_token_hash text NOT NULL,
  label text,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','denied','revoked')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES app_users(id),
  approved_at timestamptz,
  revoked_at timestamptz,
  UNIQUE(user_id, device_token_hash)
);

CREATE TABLE IF NOT EXISTS active_sessions (
  session_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES approved_devices(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoke_reason text
);
CREATE UNIQUE INDEX IF NOT EXISTS active_sessions_one_live_per_user_idx ON active_sessions(user_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mfa_session_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verification_method text NOT NULL DEFAULT 'totp' CHECK (verification_method IN ('totp','recovery')),
  last_totp_counter bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES app_users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  outlet_id uuid REFERENCES outlets(id),
  request_id text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monthly_financials_period ON outlet_monthly_financials(period_id, outlet_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_outlet_date ON daily_sales(outlet_id, business_date DESC);
CREATE INDEX IF NOT EXISTS idx_channel_sales_outlet_date ON channel_sales(outlet_id, business_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_outlet_period ON expenses(outlet_id, period_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_staff_outlet_status ON staff_members(home_outlet_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_notice_end ON staff_members(planned_last_working_date) WHERE status='notice';
CREATE INDEX IF NOT EXISTS idx_staff_reviews_period ON staff_performance_reviews(period_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_events_staff_date ON staff_events(staff_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_staff_salary_history_staff_date ON staff_salary_history(staff_id,effective_from DESC,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshot_outlet_date ON inventory_snapshots(outlet_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_outlet_date ON purchases(outlet_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON alerts(status, severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assigned_user_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_customer_experience_period ON customer_experience_monthly(period_id,outlet_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assets_outlet_status ON equipment_assets(outlet_id,status,next_service_due);
CREATE INDEX IF NOT EXISTS idx_maintenance_open ON maintenance_incidents(outlet_id,status,priority,reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_outlet_audits_period ON outlet_audits_monthly(period_id,outlet_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_created ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_outlet_date ON purchases(outlet_id,purchase_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_purchases_invoice ON purchases(outlet_id,vendor_id,purchase_date,invoice_no) WHERE invoice_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_sales_period ON daily_sales(business_date,outlet_id);
CREATE INDEX IF NOT EXISTS idx_channel_sales_period ON channel_sales(business_date,outlet_id);
CREATE INDEX IF NOT EXISTS idx_expenses_period_outlet ON expenses(period_id,outlet_id,expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_latest ON inventory_snapshots(outlet_id,item_id,snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON tasks(status,due_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON alerts(status,severity,detected_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_dedupe ON alerts(dedupe_key);


CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['app_users','outlets','outlet_monthly_financials','daily_sales','channel_sales','expenses','staff_members','staff_performance_reviews','attendance_monthly','outlet_targets','menu_items','menu_performance_monthly','inventory_items','vendors','purchases','customer_experience_monthly','equipment_assets','maintenance_incidents','outlet_audits_monthly','tasks','checklist_templates','checklist_items'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_touch ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION assert_period_open() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p_status text;
BEGIN
  SELECT status INTO p_status FROM reporting_periods WHERE id = COALESCE(NEW.period_id, OLD.period_id);
  IF p_status = 'closed' THEN
    RAISE EXCEPTION 'Reporting period is closed';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['outlet_monthly_financials','expenses','attendance_monthly','staff_performance_reviews','outlet_targets','menu_performance_monthly','customer_experience_monthly','outlet_audits_monthly'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_period_open ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_period_open BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION assert_period_open()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION audit_business_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid;
  req text;
  outlet uuid;
  entity text;
  entity_id text;
BEGIN
  BEGIN actor := nullif(current_setting('app.actor_user_id', true),'')::uuid; EXCEPTION WHEN others THEN actor := NULL; END;
  req := nullif(current_setting('app.request_id', true),'');
  entity := TG_TABLE_NAME;
  entity_id := COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(OLD)->>'id'));
  BEGIN outlet := COALESCE((to_jsonb(NEW)->>'outlet_id')::uuid,(to_jsonb(OLD)->>'outlet_id')::uuid); EXCEPTION WHEN others THEN outlet := NULL; END;
  INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,outlet_id,request_id,old_values,new_values)
  VALUES(actor,lower(TG_OP),entity,entity_id,outlet,req,CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END);
  RETURN COALESCE(NEW,OLD);
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['outlets','outlet_monthly_financials','daily_sales','channel_sales','expenses','staff_members','staff_outlet_history','staff_performance_reviews','staff_events','staff_salary_history','attendance_monthly','outlet_targets','menu_items','menu_performance_monthly','inventory_snapshots','vendors','purchases','cash_reconciliations','documents','customer_experience_monthly','equipment_assets','maintenance_incidents','outlet_audits_monthly','checklist_templates','checklist_items','alerts','tasks','data_import_jobs','approved_devices','owner_access_registry'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_audit ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_business_change()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE VIEW v_outlet_month_summary AS
SELECT
  f.outlet_id,
  o.code AS outlet_code,
  o.name AS outlet_name,
  p.year,
  p.month,
  p.status AS period_status,
  f.net_revenue,
  f.total_orders,
  CASE WHEN f.total_orders > 0 THEN round(f.net_revenue / f.total_orders, 2) ELSE 0 END AS average_order_value,
  f.food_cost,
  CASE WHEN f.net_revenue > 0 THEN round((f.food_cost/f.net_revenue)*100,2) ELSE 0 END AS food_cost_pct,
  f.payroll_cost,
  CASE WHEN f.net_revenue > 0 THEN round((f.payroll_cost/f.net_revenue)*100,2) ELSE 0 END AS labour_cost_pct,
  f.operating_profit,
  f.net_profit,
  CASE WHEN f.net_revenue > 0 THEN round((f.net_profit/f.net_revenue)*100,2) ELSE 0 END AS net_margin_pct
FROM outlet_monthly_financials f
JOIN outlets o ON o.id=f.outlet_id
JOIN reporting_periods p ON p.id=f.period_id;

CREATE OR REPLACE VIEW v_staff_by_outlet AS
SELECT o.id AS outlet_id,o.code AS outlet_code,o.name AS outlet_name,count(s.id) FILTER (WHERE s.status='active') AS active_staff
FROM outlets o LEFT JOIN staff_members s ON s.home_outlet_id=o.id
GROUP BY o.id,o.code,o.name;

CREATE OR REPLACE VIEW v_staff_notice_watch AS
SELECT s.id AS staff_id,s.employee_code,s.full_name,s.role_title,o.code AS outlet_code,
       s.notice_given_date,s.planned_last_working_date,
       (s.planned_last_working_date - CURRENT_DATE) AS days_remaining
FROM staff_members s
LEFT JOIN outlets o ON o.id=s.home_outlet_id
WHERE s.status='notice' AND s.planned_last_working_date IS NOT NULL
  AND s.planned_last_working_date >= CURRENT_DATE
  AND s.planned_last_working_date <= CURRENT_DATE + 30;

CREATE OR REPLACE VIEW v_staff_latest_performance AS
SELECT DISTINCT ON (r.staff_id) r.staff_id,r.overall_rating,r.period_id,p.year,p.month,r.reviewed_at
FROM staff_performance_reviews r
JOIN reporting_periods p ON p.id=r.period_id
ORDER BY r.staff_id,p.year DESC,p.month DESC,r.reviewed_at DESC;


CREATE OR REPLACE VIEW v_customer_experience_latest AS
SELECT c.outlet_id,o.code AS outlet_code,o.name AS outlet_name,p.year,p.month,
       c.google_rating,c.swiggy_rating,c.zomato_rating,c.complaints_received,c.complaints_unresolved,
       round(((coalesce(c.google_rating,0)+coalesce(c.swiggy_rating,0)+coalesce(c.zomato_rating,0)) /
         nullif((CASE WHEN c.google_rating IS NULL THEN 0 ELSE 1 END + CASE WHEN c.swiggy_rating IS NULL THEN 0 ELSE 1 END + CASE WHEN c.zomato_rating IS NULL THEN 0 ELSE 1 END),0))::numeric,2) AS average_rating
FROM customer_experience_monthly c JOIN outlets o ON o.id=c.outlet_id JOIN reporting_periods p ON p.id=c.period_id;

CREATE OR REPLACE VIEW v_maintenance_open AS
SELECT m.id,m.outlet_id,o.code AS outlet_code,o.name AS outlet_name,a.asset_code,a.name AS asset_name,
       m.priority,m.issue,m.status,m.reported_at,m.estimated_cost,m.actual_cost,
       floor(extract(epoch from (now()-m.reported_at))/3600)::int AS open_hours
FROM maintenance_incidents m JOIN outlets o ON o.id=m.outlet_id LEFT JOIN equipment_assets a ON a.id=m.asset_id
WHERE m.status IN ('open','in_progress');

CREATE OR REPLACE VIEW v_outlet_audit_latest AS
SELECT a.outlet_id,o.code AS outlet_code,o.name AS outlet_name,p.year,p.month,a.audit_date,a.overall_score,
       a.hygiene,a.food_quality,a.service,a.stock_discipline,a.staff_presentation,a.equipment_condition,a.compliance
FROM outlet_audits_monthly a JOIN outlets o ON o.id=a.outlet_id JOIN reporting_periods p ON p.id=a.period_id;

REVOKE ALL ON audit_log, security_events FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO gm_command_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO gm_command_runtime;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO gm_command_runtime;
GRANT SELECT ON v_outlet_month_summary,v_staff_by_outlet,v_staff_notice_watch,v_staff_latest_performance,v_customer_experience_latest,v_maintenance_open,v_outlet_audit_latest TO gm_command_runtime;
REVOKE ALL ON owner_access_registry FROM gm_command_runtime;
GRANT SELECT ON owner_access_registry TO gm_command_runtime;
GRANT UPDATE(clerk_user_id,bound_at,updated_at) ON owner_access_registry TO gm_command_runtime;
REVOKE UPDATE,DELETE,TRUNCATE ON audit_log,security_events FROM gm_command_runtime;
GRANT SELECT,INSERT ON audit_log,security_events TO gm_command_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO gm_command_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE,SELECT ON SEQUENCES TO gm_command_runtime;

COMMIT;
