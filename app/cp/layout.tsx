import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/cp/DashboardShell";
import { requireRole } from "@/lib/auth-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin", "support"]);
  return <DashboardShell>{children}</DashboardShell>;
}
