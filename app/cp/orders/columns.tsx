"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ADMIN_PATH } from "@/lib/constants";

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
          href={`/order/${orderNum}`}
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant =
        status === "delivered"
          ? "default"
          : status === "cancelled"
            ? "secondary"
            : "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const ps = row.getValue("paymentStatus") as string;
      return (
        <Badge variant={ps === "paid" ? "default" : "outline"}>{ps}</Badge>
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
