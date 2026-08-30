BEGIN;


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

CREATE INDEX IF NOT EXISTS idx_customer_experience_period ON customer_experience_monthly(period_id,outlet_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assets_outlet_status ON equipment_assets(outlet_id,status,next_service_due);
CREATE INDEX IF NOT EXISTS idx_maintenance_open ON maintenance_incidents(outlet_id,status,priority,reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_outlet_audits_period ON outlet_audits_monthly(period_id,outlet_id);

DROP TRIGGER IF EXISTS trg_customer_experience_monthly_touch ON customer_experience_monthly;
CREATE TRIGGER trg_customer_experience_monthly_touch BEFORE UPDATE ON customer_experience_monthly FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_equipment_assets_touch ON equipment_assets;
CREATE TRIGGER trg_equipment_assets_touch BEFORE UPDATE ON equipment_assets FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_maintenance_incidents_touch ON maintenance_incidents;
CREATE TRIGGER trg_maintenance_incidents_touch BEFORE UPDATE ON maintenance_incidents FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_outlet_audits_monthly_touch ON outlet_audits_monthly;
CREATE TRIGGER trg_outlet_audits_monthly_touch BEFORE UPDATE ON outlet_audits_monthly FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_customer_experience_monthly_period_open ON customer_experience_monthly;
CREATE TRIGGER trg_customer_experience_monthly_period_open BEFORE INSERT OR UPDATE OR DELETE ON customer_experience_monthly FOR EACH ROW EXECUTE FUNCTION assert_period_open();
DROP TRIGGER IF EXISTS trg_outlet_audits_monthly_period_open ON outlet_audits_monthly;
CREATE TRIGGER trg_outlet_audits_monthly_period_open BEFORE INSERT OR UPDATE OR DELETE ON outlet_audits_monthly FOR EACH ROW EXECUTE FUNCTION assert_period_open();
DROP TRIGGER IF EXISTS trg_customer_experience_monthly_audit ON customer_experience_monthly;
CREATE TRIGGER trg_customer_experience_monthly_audit AFTER INSERT OR UPDATE OR DELETE ON customer_experience_monthly FOR EACH ROW EXECUTE FUNCTION audit_business_change();
DROP TRIGGER IF EXISTS trg_equipment_assets_audit ON equipment_assets;
CREATE TRIGGER trg_equipment_assets_audit AFTER INSERT OR UPDATE OR DELETE ON equipment_assets FOR EACH ROW EXECUTE FUNCTION audit_business_change();
DROP TRIGGER IF EXISTS trg_maintenance_incidents_audit ON maintenance_incidents;
CREATE TRIGGER trg_maintenance_incidents_audit AFTER INSERT OR UPDATE OR DELETE ON maintenance_incidents FOR EACH ROW EXECUTE FUNCTION audit_business_change();
DROP TRIGGER IF EXISTS trg_outlet_audits_monthly_audit ON outlet_audits_monthly;
CREATE TRIGGER trg_outlet_audits_monthly_audit AFTER INSERT OR UPDATE OR DELETE ON outlet_audits_monthly FOR EACH ROW EXECUTE FUNCTION audit_business_change();

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

GRANT SELECT,INSERT,UPDATE,DELETE ON customer_experience_monthly,equipment_assets,maintenance_incidents,outlet_audits_monthly TO gm_command_runtime;
GRANT SELECT ON v_customer_experience_latest,v_maintenance_open,v_outlet_audit_latest TO gm_command_runtime;
COMMIT;
