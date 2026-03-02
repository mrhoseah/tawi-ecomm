/**
 * Central role definitions for the application.
 * Used across admin UI, API authorization, and Casbin policies.
 */

export const ROLE_KEYS = ["admin", "support", "customer"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export interface RoleDefinition {
  key: RoleKey;
  label: string;
  description: string;
  variant: "default" | "secondary" | "outline";
  permissions: string[];
  isStaff: boolean;
}

export const ROLES: Record<RoleKey, RoleDefinition> = {
  admin: {
    key: "admin",
    label: "Administrator",
    description: "Full access to all admin features, settings, and user management.",
    variant: "default",
    isStaff: true,
    permissions: [
      "Payment & bank settings",
      "Orders & returns",
      "Users & roles",
      "Coupons",
      "Teams, FAQs, Pages",
      "SEO & featured match",
      "Site configuration",
    ],
  },
  support: {
    key: "support",
    label: "Support Staff",
    description: "View orders, manage FAQs, teams, pages, and returns. Cannot modify settings or manage users.",
    variant: "secondary",
    isStaff: true,
    permissions: [
      "View orders & returns",
      "Edit teams, FAQs, pages",
      "View payment settings",
      "View users (read-only)",
      "View SEO settings",
    ],
  },
  customer: {
    key: "customer",
    label: "Customer",
    description: "Standard site access: browse, order, manage account.",
    variant: "outline",
    isStaff: false,
    permissions: ["Cart", "Orders (own)", "Account"],
  },
};

export function getRole(key: string): RoleDefinition | undefined {
  return ROLE_KEYS.includes(key as RoleKey) ? ROLES[key as RoleKey] : undefined;
}

export function getRoleLabel(key: string): string {
  return getRole(key)?.label ?? key;
}

export function isStaffRole(role: string): boolean {
  return role === "admin" || role === "support";
}
