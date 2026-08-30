SELECT email,display_name,active,(clerk_user_id IS NOT NULL) AS identity_bound
FROM owner_access_registry
ORDER BY email;

SELECT
  has_table_privilege('gm_command_runtime','owner_access_registry','SELECT') AS registry_select,
  has_table_privilege('gm_command_runtime','owner_access_registry','INSERT') AS registry_insert,
  has_table_privilege('gm_command_runtime','owner_access_registry','DELETE') AS registry_delete,
  has_column_privilege('gm_command_runtime','owner_access_registry','clerk_user_id','UPDATE') AS bind_id_update,
  has_column_privilege('gm_command_runtime','owner_access_registry','email','UPDATE') AS registry_email_update,
  has_column_privilege('gm_command_runtime','owner_access_registry','active','UPDATE') AS registry_active_update;
