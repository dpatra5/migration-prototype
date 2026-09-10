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
  | "User Management"
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
    pages: ["Dashboard", "Upload", "Mapping", "Review", "Unclassified Docs", "Audit Trail", "Notifications", "User Management", "Settings"],
    canManageRoles: ["support", "user"],
  },
  superadmin: {
    label: "Super Admin",
    description: "Full application access and management of administrator roles.",
    pages: ["Dashboard", "Upload", "Mapping", "Review", "Unclassified Docs", "Audit Trail", "Notifications", "User Management", "Settings"],
    canManageRoles: ["support", "user", "admin"],
  },
};

export function canAccessPage(config: AccessControlConfig, role: Role, page: AppPage) {
  return config[role].pages.includes(page);
}

// Merges a persisted config with the current defaults so pages introduced after
// a config was saved to localStorage (e.g. "User Management") still show up.
export function mergeAccessConfig(saved: Partial<AccessControlConfig> | null | undefined): AccessControlConfig {
  if (!saved) {
    return defaultRoleDefinitions;
  }

  const knownPages = new Set<AppPage>(
    Object.values(saved).flatMap((definition) => definition?.pages ?? []),
  );

  const merged = {} as AccessControlConfig;
  for (const role of roles) {
    const savedRole = saved[role];
    const defaultRole = defaultRoleDefinitions[role];
    const newPages = defaultRole.pages.filter((page) => !knownPages.has(page));

    merged[role] = savedRole
      ? { ...defaultRole, ...savedRole, pages: [...savedRole.pages, ...newPages] }
      : defaultRole;
  }
  return merged;
}

export function canManageRole(config: AccessControlConfig, role: Role, managedRole: Role) {
  return config[role].canManageRoles.includes(managedRole);
}