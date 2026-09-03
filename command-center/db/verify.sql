SELECT current_database() AS database_name, current_user AS connected_role;

SELECT COUNT(*) AS required_tables
FROM information_schema.tables
WHERE table_schema='public' AND table_name = ANY(ARRAY[
  'owner_access_registry','app_users','outlets','user_outlet_access','reporting_periods','outlet_monthly_financials',
  'daily_sales','sales_channels','channel_sales','expense_categories','expenses','staff_members',
  'attendance_monthly','outlet_targets','menu_items','menu_performance_monthly','inventory_items',
  'inventory_snapshots','vendors','purchases','purchase_items','cash_reconciliations','documents',
  'alerts','tasks','data_import_jobs','access_logs','security_events','approved_devices','active_sessions',
  'mfa_recovery_codes','mfa_session_verifications','rate_limit_buckets','audit_log',
  'staff_performance_reviews','staff_events','staff_salary_history','customer_experience_monthly',
  'equipment_assets','maintenance_incidents','outlet_audits_monthly','checklist_templates','checklist_items'
]);

SELECT email,display_name,active,(clerk_user_id IS NOT NULL) AS identity_bound
FROM owner_access_registry
ORDER BY email;

SELECT conname,pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid='app_users'::regclass AND contype='c'
ORDER BY conname;

SELECT
  has_table_privilege('gm_command_runtime','owner_access_registry','SELECT') AS registry_select,
  has_table_privilege('gm_command_runtime','owner_access_registry','INSERT') AS registry_insert,
  has_table_privilege('gm_command_runtime','owner_access_registry','DELETE') AS registry_delete,
  has_column_privilege('gm_command_runtime','owner_access_registry','clerk_user_id','UPDATE') AS bind_clerk_id_update,
  has_column_privilege('gm_command_runtime','owner_access_registry','email','UPDATE') AS registry_email_update,
  has_column_privilege('gm_command_runtime','owner_access_registry','active','UPDATE') AS registry_active_update;

SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee='gm_command_runtime' AND table_name IN ('audit_log','security_events')
ORDER BY table_name, privilege_type;

SELECT COUNT(*) AS business_audit_triggers
FROM information_schema.triggers
WHERE trigger_schema='public' AND trigger_name LIKE 'trg_%_audit';

SELECT table_name
FROM information_schema.views
WHERE table_schema='public' AND table_name IN ('v_outlet_month_summary','v_staff_by_outlet')
ORDER BY table_name;


SELECT
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_alerts_dedupe' AND indexdef NOT ILIKE '% WHERE %') AS full_alert_dedupe_index,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='reliability_pct') AS vendor_reliability_ready,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='fill_rate_pct') AS vendor_fill_rate_ready;
