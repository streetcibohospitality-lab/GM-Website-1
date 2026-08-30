BEGIN;

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS current_monthly_salary numeric(14,2);
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS salary_effective_from date;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='staff_current_salary_nonnegative') THEN
    ALTER TABLE staff_members ADD CONSTRAINT staff_current_salary_nonnegative CHECK (current_monthly_salary IS NULL OR current_monthly_salary >= 0);
  END IF;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_staff_salary_history_staff_date ON staff_salary_history(staff_id,effective_from DESC,created_at DESC);
DROP TRIGGER IF EXISTS trg_staff_salary_history_audit ON staff_salary_history;
CREATE TRIGGER trg_staff_salary_history_audit AFTER INSERT OR UPDATE OR DELETE ON staff_salary_history FOR EACH ROW EXECUTE FUNCTION audit_business_change();
GRANT SELECT,INSERT,UPDATE,DELETE ON staff_salary_history TO gm_command_runtime;
COMMIT;
