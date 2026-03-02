"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Check, X, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export type OrderReturn = {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: string;
  requestedAt: string;
  order?: { orderNumber: string };
  user?: { name?: string; email?: string };
};

export function getColumns(
  canWrite: boolean,
  onUpdateStatus: (id: string, status: string) => void
): ColumnDef<OrderReturn>[] {
  const cols: ColumnDef<OrderReturn>[] = [
    {
      accessorKey: "order",
      header: "Order",
      cell: ({ row }) => {
        const r = row.original;
        const orderNum = r.order?.orderNumber || r.orderId;
        return (
          <span className="font-medium text-gray-900">#{orderNum}</span>
        );
      },
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const r = row.original;
        const user = r.user?.name || r.user?.email || "—";
        return <span className="text-gray-600">{user}</span>;
      },
    },
    {
      accessorKey: "requestedAt",
      header: "Requested",
      cell: ({ row }) => (
        <span className="text-gray-600 text-sm">
          {new Date(row.getValue("requestedAt")).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-gray-700 max-w-xs block line-clamp-2">
          {row.getValue("reason")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variant =
          status === "pending"
            ? "outline"
            : status === "approved" || status === "completed"
              ? "default"
              : "secondary";
        return (
          <Badge variant={variant}>
            {status}
          </Badge>
        );
      },
    },
  ];

  if (canWrite) {
    cols.push({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const r = row.original;
        if (r.status === "completed" || r.status === "rejected")
          return <span className="text-gray-400">—</span>;
        if (r.status === "approved") {
          return (
            <button
              onClick={() => onUpdateStatus(r.id, "completed")}
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
            >
              <RotateCcw className="h-3 w-3" /> Complete & Refund
            </button>
          );
        }
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(r.id, "approved")}
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
            >
              <Check className="h-3 w-3" /> Approve
            </button>
            <button
              onClick={() => onUpdateStatus(r.id, "rejected")}
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
            >
              <X className="h-3 w-3" /> Reject
            </button>
          </div>
        );
      },
    });
  }

  return cols;
}
