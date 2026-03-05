"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  paymentMethod: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
};

export const orderColumns: ColumnDef<AdminOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => {
      const orderNum = row.getValue("orderNumber") as string;
      return (
        <Link
          href={`/cp/orders/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          #{orderNum}
        </Link>
      );
    },
  },
  {
    accessorKey: "user",
    header: "Customer",
    cell: ({ row }) => {
      const user = row.original.user;
      const name = user?.name || user?.email || "—";
      return <span className="text-muted-foreground">{name}</span>;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-medium">
        ${(row.getValue("total") as number).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) => {
      const method = (row.getValue("paymentMethod") as string | null) || "—";
      const label =
        method === "mpesa"
          ? "M‑Pesa"
          : method === "bank"
            ? "Bank"
            : method === "paypal"
              ? "PayPal"
              : method;
      return (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") as string) || "";
      const normalized = status.toLowerCase();
      const variant =
        normalized === "delivered"
          ? "default"
          : normalized === "shipped"
            ? "default"
            : normalized === "processing"
              ? "outline"
              : normalized === "cancelled"
                ? "secondary"
                : "outline";
      const label = normalized
        ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
        : "—";
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const ps = (row.getValue("paymentStatus") as string) || "";
      const normalized = ps.toLowerCase();
      const variant =
        normalized === "paid"
          ? "default"
          : normalized === "refunded"
            ? "secondary"
            : normalized === "failed"
              ? "secondary"
              : "outline";
      const label = normalized
        ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
        : "—";
      return (
        <Badge variant={variant}>{label}</Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </span>
    ),
  },
];
