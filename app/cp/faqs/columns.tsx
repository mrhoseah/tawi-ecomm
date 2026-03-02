"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
};

export function getColumns(
  canWrite: boolean,
  onEdit: (faq: Faq) => void,
  onDelete: (faq: Faq) => void
): ColumnDef<Faq>[] {
  const cols: ColumnDef<Faq>[] = [
    {
      accessorKey: "question",
      header: "Question",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900 max-w-xs block truncate">
          {row.getValue("question")}
        </span>
      ),
    },
    {
      accessorKey: "answer",
      header: "Answer",
      cell: ({ row }) => (
        <span className="text-gray-600 max-w-md block line-clamp-2">
          {row.getValue("answer")}
        </span>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
      cell: ({ row }) => (
        <span className="text-gray-600">{row.getValue("sortOrder")}</span>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("active") as boolean;
        return (
          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Active" : "Inactive"}
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
        const faq = row.original;
        return (
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(faq)}
              className="p-2 text-gray-600 hover:text-red-600 rounded"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(faq)}
              className="p-2 text-gray-600 hover:text-red-600 rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    });
  }

  return cols;
}
