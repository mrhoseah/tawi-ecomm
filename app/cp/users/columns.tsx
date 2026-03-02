"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/Badge";
import { getRole, getRoleLabel } from "@/lib/roles";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  _count: { orders: number };
};

export const userColumns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string | null;
      const email = row.original.email;
      return (
        <div>
          <span className="font-medium">{name || "—"}</span>
          {!name && <span className="text-muted-foreground text-sm block">{email}</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{row.getValue("email") as string}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const def = getRole(role);
      return (
        <Badge variant={def?.variant ?? "outline"}>
          {getRoleLabel(role)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "_count",
    header: "Orders",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original._count.orders}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </span>
    ),
  },
];
