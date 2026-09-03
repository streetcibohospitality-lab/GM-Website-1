BEGIN;

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS notice_given_date date;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS planned_last_working_date date;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS exit_reason text;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS probation_end_date date;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS confirmed_date date;

CREATE TABLE IF NOT EXISTS staff_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES reporting_periods(id),
  overall_rating numeric(3,1) NOT NULL CHECK (overall_rating BETWEEN 0 AND 10),
  attendance_rating numeric(3,1) CHECK (attendance_rating BETWEEN 0 AND 10),
  role_skill_rating numeric(3,1) CHECK (role_skill_rating BETWEEN 0 AND 10),
  teamwork_rating numeric(3,1) CHECK (teamwork_rating BETWEEN 0 AND 10),
  ownership_rating numeric(3,1) CHECK (ownership_rating BETWEEN 0 AND 10),
  strengths text, improvement_points text, review_notes text,
  reviewed_by uuid REFERENCES app_users(id), reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id,period_id)
);
CREATE TABLE IF NOT EXISTS staff_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('joining','probation','confirmation','promotion','transfer','recognition','warning','notice','exit','increment','other')),
  effective_date date NOT NULL,title text NOT NULL,notes text,created_by uuid REFERENCES app_users(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_notice_end ON staff_members(planned_last_working_date) WHERE status='notice';
CREATE INDEX IF NOT EXISTS idx_staff_reviews_period ON staff_performance_reviews(period_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_events_staff_date ON staff_events(staff_id, effective_date DESC);

CREATE OR REPLACE VIEW v_staff_notice_watch AS
SELECT s.id AS staff_id,s.employee_code,s.full_name,s.role_title,o.code AS outlet_code,s.notice_given_date,s.planned_last_working_date,(s.planned_last_working_date-CURRENT_DATE) AS days_remaining
FROM staff_members s LEFT JOIN outlets o ON o.id=s.home_outlet_id
WHERE s.status='notice' AND s.planned_last_working_date IS NOT NULL AND s.planned_last_working_date>=CURRENT_DATE AND s.planned_last_working_date<=CURRENT_DATE+30;
CREATE OR REPLACE VIEW v_staff_latest_performance AS
SELECT DISTINCT ON (r.staff_id) r.staff_id,r.overall_rating,r.period_id,p.year,p.month,r.reviewed_at
FROM staff_performance_reviews r JOIN reporting_periods p ON p.id=r.period_id
ORDER BY r.staff_id,p.year DESC,p.month DESC,r.reviewed_at DESC;

DROP TRIGGER IF EXISTS trg_staff_performance_reviews_touch ON staff_performance_reviews;
CREATE TRIGGER trg_staff_performance_reviews_touch BEFORE UPDATE ON staff_performance_reviews FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_staff_performance_reviews_period_open ON staff_performance_reviews;
CREATE TRIGGER trg_staff_performance_reviews_period_open BEFORE INSERT OR UPDATE OR DELETE ON staff_performance_reviews FOR EACH ROW EXECUTE FUNCTION assert_period_open();
DROP TRIGGER IF EXISTS trg_staff_performance_reviews_audit ON staff_performance_reviews;
CREATE TRIGGER trg_staff_performance_reviews_audit AFTER INSERT OR UPDATE OR DELETE ON staff_performance_reviews FOR EACH ROW EXECUTE FUNCTION audit_business_change();
DROP TRIGGER IF EXISTS trg_staff_events_audit ON staff_events;
CREATE TRIGGER trg_staff_events_audit AFTER INSERT OR UPDATE OR DELETE ON staff_events FOR EACH ROW EXECUTE FUNCTION audit_business_change();
GRANT SELECT,INSERT,UPDATE,DELETE ON staff_performance_reviews,staff_events TO gm_command_runtime;
GRANT SELECT ON v_staff_notice_watch,v_staff_latest_performance TO gm_command_runtime;
COMMIT;
