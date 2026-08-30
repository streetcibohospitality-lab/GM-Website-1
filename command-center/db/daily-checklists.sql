BEGIN;

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

DROP TRIGGER IF EXISTS trg_checklist_templates_touch ON checklist_templates;
CREATE TRIGGER trg_checklist_templates_touch BEFORE UPDATE ON checklist_templates FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_checklist_items_touch ON checklist_items;
CREATE TRIGGER trg_checklist_items_touch BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_checklist_templates_audit ON checklist_templates;
CREATE TRIGGER trg_checklist_templates_audit AFTER INSERT OR UPDATE OR DELETE ON checklist_templates FOR EACH ROW EXECUTE FUNCTION audit_business_change();
DROP TRIGGER IF EXISTS trg_checklist_items_audit ON checklist_items;
CREATE TRIGGER trg_checklist_items_audit AFTER INSERT OR UPDATE OR DELETE ON checklist_items FOR EACH ROW EXECUTE FUNCTION audit_business_change();

GRANT SELECT,INSERT,UPDATE,DELETE ON checklist_templates,checklist_items TO gm_command_runtime;

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

COMMIT;
