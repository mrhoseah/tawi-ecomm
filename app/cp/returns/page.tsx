"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { ADMIN_PATH } from "@/lib/constants";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/cp/PageHeader";
import { getColumns, type OrderReturn } from "./columns";

export default function AdminReturnsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<OrderReturn[]>([]);

  useEffect(() => {
    fetch("/api/order-returns")
      .then((r) => r.json())
      .then(setReturns)
      .catch(() => showToast("Failed to load returns", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const updateStatus = useCallback(
    async (id: string, newStatus: string) => {
      try {
        const res = await fetch(`/api/order-returns/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error("Failed");
        showToast("Return updated", "success");
        setReturns((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      } catch {
        showToast("Failed to update", "error");
      }
    },
    [showToast]
  );

  const role = (session?.user as { role?: string })?.role;
  const canWrite = role === "admin";

  const columns = useMemo(
    () => getColumns(canWrite, updateStatus),
    [canWrite, updateStatus]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Order Returns" icon={RotateCcw} description="Review and process return requests" />

          <DataTable
            columns={columns}
            data={returns}
            filterColumn="reason"
            filterPlaceholder="Filter by reason..."
          />
    </div>
  );
}
