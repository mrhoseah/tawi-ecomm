"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/cp/PageHeader";
import { orderColumns, type AdminOrder } from "./columns";

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    const page = searchParams.get("page") || "1";
    const status = searchParams.get("status") || "";
    setLoading(true);
    const params = new URLSearchParams({ page });
    if (status) params.set("status", status);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Orders"
        icon={Package}
        description="View and manage all orders"
      />
      <DataTable
        columns={orderColumns}
        data={orders}
        filterColumn="orderNumber"
        filterPlaceholder="Search by order number..."
        pageSize={20}
      />
    </div>
  );
}
