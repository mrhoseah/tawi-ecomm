"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { UserCog, Search, ChevronLeft, ChevronRight, UserPlus, Copy, X } from "lucide-react";
import { PageHeader } from "@/components/cp/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRoleLabel, type RoleKey } from "@/lib/roles";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StaffUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  _count: { orders: number };
};

const STAFF_ROLES: RoleKey[] = ["admin", "support"];

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
};

export default function AdminStaffPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "support">("admin");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const role = (session?.user as { role?: string })?.role;
  const currentUserId = (session?.user as { id?: string })?.id;
  const canWrite = role === "admin";

  const fetchInvites = useCallback(() => {
    if (!canWrite) return;
    fetch("/api/admin/invites")
      .then((r) => r.json())
      .then((d) => setInvites(d.invites ?? []))
      .catch(() => {});
  }, [canWrite]);

  const fetchUsers = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", pagination.page.toString());
    params.set("limit", pagination.limit.toString());
    params.set("staff", "true");
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
      .catch(() => showToast("Failed to load staff", "error"))
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, search, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInviteLink(data.inviteLink);
      setInvites((prev) => [data.invite, ...prev]);
      showToast("Invite created. Share the link before it expires.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink && navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      showToast("Link copied to clipboard", "success");
    }
  };

  const closeInviteDialog = () => {
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("admin");
    setInviteLink(null);
  };

  const handleRevokeInvite = async (id: string) => {
    if (!canWrite || !confirm("Revoke this invite?")) return;
    try {
      const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setInvites((prev) => prev.filter((i) => i.id !== id));
      showToast("Invite revoked", "success");
    } catch {
      showToast("Failed to revoke invite", "error");
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!canWrite) return;
    if (userId === currentUserId && newRole !== "admin") {
      showToast("You cannot demote yourself from Administrator", "error");
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
      showToast("Role updated successfully", "success");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
      fetchUsers();
    }
  };

  const handleRemoveStaff = useCallback(
    async (user: StaffUser) => {
      if (!canWrite) return;
      if (user.id === currentUserId) {
        showToast("You cannot remove your own admin access", "error");
        return;
      }
      if (
        !confirm(
          `Remove ${user.name || user.email} from staff? They will become a Customer.`
        )
      )
        return;
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "customer" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        showToast("Staff member demoted to Customer", "success");
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed", "error");
      }
    },
    [canWrite, currentUserId, showToast]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Staff & Administrators"
        icon={UserCog}
        description="Manage admin and support staff access"
      />

      {canWrite && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Pending invites</h2>
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Admin
              </Button>
            </div>
            {invites.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.email}</TableCell>
                        <TableCell>{getRoleLabel(i.role as RoleKey)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(i.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const r = await fetch(`/api/admin/invites/${i.id}/link`);
                                const d = await r.json();
                                if (r.ok && d.inviteLink && navigator.clipboard) {
                                  await navigator.clipboard.writeText(d.inviteLink);
                                  showToast("Link copied to clipboard", "success");
                                }
                              } catch {
                                showToast("Failed to copy link", "error");
                              }
                            }}
                            title="Copy invite link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleRevokeInvite(i.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending invites. Create one to invite admins.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) closeInviteDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{inviteLink ? "Invite created" : "Invite Admin"}</DialogTitle>
            <DialogDescription>
              {inviteLink
                ? "Share this link with the invitee. It expires in 7 days."
                : "Enter the email address to invite. They will set their password when accepting."}
            </DialogDescription>
          </DialogHeader>
          {inviteLink ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyInviteLink} title="Copy">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={closeInviteDialog} className="w-full">Done</Button>
            </div>
          ) : (
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "support")}
                  className="w-full h-9 rounded-md border px-2 text-sm"
                >
                  <option value="admin">Administrator</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={closeInviteDialog}>Cancel</Button>
                <Button type="submit" disabled={inviting}>{inviting ? "Creating…" : "Create invite"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="max-w-xs"
              />
              <Button onClick={handleSearch} size="sm" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UserCog className="h-12 w-12 mb-4 opacity-50" />
              <p>No staff members found</p>
              <p className="text-sm mt-1">
                Promote users to Admin or Support from the Users page
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Joined</TableHead>
                      {canWrite && (
                        <TableHead className="font-semibold text-right">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const isSelf = u.id === currentUserId;
                      return (
                        <TableRow key={u.id} className="hover:bg-muted/30">
                          <TableCell>
                            <span className="font-medium">
                              {u.name || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <select
                              value={u.role}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v !== u.role)
                                  handleRoleChange(u.id, v);
                              }}
                              disabled={
                                (isSelf && u.role === "admin") || !canWrite
                              }
                              className="h-8 min-w-[140px] rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              {STAFF_ROLES.map((r) => (
                                <option
                                  key={r}
                                  value={r}
                                  disabled={isSelf && r !== "admin"}
                                >
                                  {getRoleLabel(r)}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          {canWrite && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveStaff(u)}
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? "Cannot remove yourself"
                                    : "Remove from staff"
                                }
                              >
                                Remove from staff
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} (
                    {pagination.total} staff members)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        setPagination((p) => ({
                          ...p,
                          page: Math.max(1, p.page - 1),
                        }))
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
                          page: Math.min(
                            pagination.totalPages,
                            p.page + 1
                          ),
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
        </CardContent>
      </Card>
    </div>
  );
}
