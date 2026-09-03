-- Final production hardening step after all three immutable Clerk IDs are pre-bound.
-- The application runtime becomes read-only on the Owner registry.
BEGIN;
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM owner_access_registry WHERE active AND clerk_user_id IS NOT NULL) <> 3 THEN
    RAISE EXCEPTION 'cannot_lock_owner_registry_until_all_three_ids_are_bound';
  END IF;
END $$;
REVOKE UPDATE(clerk_user_id,bound_at,updated_at) ON owner_access_registry FROM gm_command_runtime;
COMMIT;
