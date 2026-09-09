export const roles = ["support", "user", "admin", "superadmin"] as const;

export type Role = (typeof roles)[number];

export type AppPage =
  | "Dashboard"
  | "Upload"
  | "Mapping"
  | "Review"
  | "Unclassified Docs"
  | "Audit Trail"
  | "Notifications"
  | "Settings";

export interface RoleDefinition {
  label: string;
  description: string;
  pages: AppPage[];
  canManageRoles: Role[];
}

export type AccessControlConfig = Record<Role, RoleDefinition>;

export const defaultRoleDefinitions: AccessControlConfig = {
  support: {
    label: "Support",
    description: "View audit and monitoring information.",
    pages: ["Audit Trail"],
    canManageRoles: [],
  },
  user: {
    label: "User",
    description: "Monitor activity, run jobs, and classify documents.",
    pages: ["Dashboard", "Upload", "Mapping", "Unclassified Docs", "Audit Trail"],
    canManageRoles: [],
  },
  admin: {
    label: "Admin",
    description: "Full application access and management of support and user roles.",
    pages: ["Dashboard", "Upload", "Mapping", "Review", "Unclassified Docs", "Audit Trail", "Notifications", "Settings"],
    canManageRoles: ["support", "user"],
  },
  superadmin: {
    label: "Super Admin",
    description: "Full application access and management of administrator roles.",
    pages: ["Dashboard", "Upload", "Mapping", "Review", "Unclassified Docs", "Audit Trail", "Notifications", "Settings"],
    canManageRoles: ["support", "user", "admin"],
  },
};

export function canAccessPage(config: AccessControlConfig, role: Role, page: AppPage) {
  return config[role].pages.includes(page);
}

export function canManageRole(config: AccessControlConfig, role: Role, managedRole: Role) {
  return config[role].canManageRoles.includes(managedRole);
}