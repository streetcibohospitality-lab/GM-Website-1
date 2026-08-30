export type Role = "owner";

export type Profile = {
  id: string;
  clerk_user_id: string;
  email: string;
  display_name: string;
  role: Role;
  active: boolean;
  mfa_enabled: boolean;
};

export type OutletPermission = {
  outlet_id: string;
  can_view_financials: boolean;
  can_edit_operations: boolean;
};
