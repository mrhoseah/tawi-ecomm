"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/cp/PageHeader";
import { orderColumns, type AdminOrder } from "./columns";

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get("status") || "");
  const [paymentFilter, setPaymentFilter] = useState<string>(() => searchParams.get("paymentStatus") || "");

  useEffect(() => {
    const page = searchParams.get("page") || "1";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    setLoading(true);
    const params = new URLSearchParams({ page });
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value);
              const params = new URLSearchParams(searchParams.toString());
              if (value) params.set("status", value);
              else params.delete("status");
              params.set("page", "1");
              router.push(`/cp/orders?${params.toString()}`);
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => {
              const value = e.target.value;
              setPaymentFilter(value);
              const params = new URLSearchParams(searchParams.toString());
              if (value) params.set("paymentStatus", value);
              else params.delete("paymentStatus");
              params.set("page", "1");
              router.push(`/cp/orders?${params.toString()}`);
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All payment states</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
        </div>
      </div>
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
