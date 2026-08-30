BEGIN;

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

DROP TRIGGER IF EXISTS trg_owner_access_registry_audit ON owner_access_registry;
CREATE TRIGGER trg_owner_access_registry_audit
AFTER INSERT OR UPDATE OR DELETE ON owner_access_registry
FOR EACH ROW EXECUTE FUNCTION audit_business_change();

REVOKE ALL ON owner_access_registry FROM PUBLIC;
REVOKE ALL ON owner_access_registry FROM gm_command_runtime;
GRANT SELECT ON owner_access_registry TO gm_command_runtime;
GRANT UPDATE(clerk_user_id,bound_at,updated_at) ON owner_access_registry TO gm_command_runtime;

ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_owner_only_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_owner_only_check CHECK (role = 'owner');

COMMIT;
