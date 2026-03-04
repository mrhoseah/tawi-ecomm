import { auth } from "./auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await auth();
  const role = (session?.user as { role?: string }).role;

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!role || !allowedRoles.includes(role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

