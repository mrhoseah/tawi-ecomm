"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { UserCog, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/cp/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userColumns, type AdminUser } from "./columns";
import { ROLE_KEYS, getRoleLabel } from "@/lib/roles";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const role = (session?.user as { role?: string })?.role;
  const currentUserId = (session?.user as { id?: string })?.id;
  const canWrite = role === "admin";

  const fetchUsers = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", pagination.page.toString());
    params.set("limit", pagination.limit.toString());
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("q", search);
    setLoading(true);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setPagination((prev) => ({
          ...prev,
          page: data.pagination?.page ?? prev.page,
          totalPages: data.pagination?.totalPages ?? prev.totalPages,
          total: data.pagination?.total ?? prev.total,
        }));
      })
      .catch(() => showToast("Failed to load users", "error"))
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, roleFilter, search, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPagination((p) => ({ ...p, page: 1 }));
  };
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!canWrite) return;
    if (userId === currentUserId && newRole !== "admin") {
      showToast("You cannot demote yourself from admin", "error");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast("Role updated", "success");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
      fetchUsers();
    }
  };

  const handleDelete = useCallback(
    async (user: AdminUser) => {
      if (!canWrite) return;
      if (user.id === currentUserId) {
        showToast("You cannot delete your own account", "error");
        return;
      }
      if (!confirm(`Delete ${user.name || user.email}? This cannot be undone.`)) return;
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        showToast("User deleted", "success");
        fetchUsers();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed", "error");
      }
    },
    [canWrite, currentUserId, fetchUsers, showToast]
  );

  const columnsWithActions = [
    ...userColumns,
    ...(canWrite
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: { original: AdminUser } }) => {
              const u = row.original;
              const isSelf = u.id === currentUserId;
              return (
                <div className="flex items-center gap-2">
                    <select
                    value={u.role}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== u.role) handleRoleChange(u.id, v);
                    }}
                    className="h-8 min-w-[120px] rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isSelf && u.role === "admin"}
                  >
                    {ROLE_KEYS.map((r) => (
                      <option key={r} value={r} disabled={isSelf && r !== "admin"}>
                        {getRoleLabel(r)}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(u)}
                    disabled={isSelf}
                    title={isSelf ? "Cannot delete yourself" : "Delete user"}
                  >
                    Delete
                  </Button>
                </div>
              );
            },
          } as ColumnDef<AdminUser>,
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Users"
        icon={UserCog}
        description="View and manage users and roles"
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-64"
          />
          <Button onClick={handleSearch} size="sm" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="h-9 min-w-[140px] rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="">All roles</option>
          {ROLE_KEYS.map((r) => (
            <option key={r} value={r}>
              {getRoleLabel(r)}
            </option>
          ))}
        </select>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columnsWithActions}
            data={users}
            filterColumn={undefined}
            pageSize={pagination.limit}
          />
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      page: Math.min(pagination.totalPages, p.page + 1),
                    }))
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
