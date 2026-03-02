"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";

export type Team = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sportType: string;
  description: string | null;
  active: boolean;
};

export function getColumns(
  canWrite: boolean,
  onEdit: (team: Team) => void,
  onDelete: (team: Team) => void
): ColumnDef<Team>[] {
  const cols: ColumnDef<Team>[] = [
    {
      accessorKey: "name",
      header: "Team",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar src={team.logoUrl} fallback={team.name} size="sm" />
            <span className="font-medium text-gray-900">{team.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="text-gray-600 text-sm">{row.getValue("slug")}</span>
      ),
    },
    {
      accessorKey: "sportType",
      header: "Sport",
      cell: ({ row }) => (
        <span className="capitalize text-gray-600">{row.getValue("sportType")}</span>
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
    {
      id: "view",
      header: "",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <Link
            href={`/teams/${team.slug}`}
            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            View <ExternalLink className="h-3 w-3" />
          </Link>
        );
      },
    },
  ];

  if (canWrite) {
    cols.push({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(team)}
              className="p-2 text-gray-600 hover:text-red-600 rounded"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(team)}
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
