import { newEnforcer, Enforcer } from "casbin";
import path from "path";

let enforcer: Enforcer | null = null;

export async function getEnforcer(): Promise<Enforcer> {
  if (!enforcer) {
    const modelPath = path.join(process.cwd(), "casbin", "model.conf");
    const policyPath = path.join(process.cwd(), "casbin", "policy.csv");
    enforcer = await newEnforcer(modelPath, policyPath);
  }
  return enforcer;
}

/**
 * Check if a role has permission to perform an action on a resource.
 * @param role - User role (customer, admin, support)
 * @param resource - Resource being accessed (e.g. "payment-settings", "admin-settings")
 * @param action - Action (e.g. "read", "write", "*")
 */
export async function enforce(
  role: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const e = await getEnforcer();
    return await e.enforce(role, resource, action);
  } catch (err) {
    console.error("Casbin enforce error:", err);
    return false;
  }
}

/**
 * Check if role can perform action on resource. Throws if denied.
 * Use in API routes after auth check.
 */
export async function requirePermission(
  role: string | undefined,
  resource: string,
  action: string
): Promise<void> {
  const r = role || "customer";
  const allowed = await enforce(r, resource, action);
  if (!allowed) {
    throw new Error("Forbidden");
  }
}
