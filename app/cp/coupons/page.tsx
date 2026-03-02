"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format, isBefore, startOfDay } from "date-fns";
import { useToast } from "@/components/Toast";
import { Tag, Plus, Pencil, Trash2, CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/cp/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  freeShipping: boolean;
  description: string | null;
  active: boolean;
  createdAt: string;
};

const formatDate = (s: string) => new Date(s).toLocaleDateString(undefined, { dateStyle: "short" });

export default function AdminCouponsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed" | "free_shipping",
    value: "10",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    usageLimitPerUser: "",
    validFrom: "",
    validUntil: "",
    freeShipping: false,
    description: "",
    active: true,
  });

  const role = (session?.user as { role?: string })?.role;
  const canWrite = role === "admin";

  const fetchCoupons = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/coupons");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load coupons");
      setCoupons(d.coupons ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setForm({
      code: "",
      type: "percentage",
      value: "10",
      minPurchase: "",
      maxDiscount: "",
      usageLimit: "",
      usageLimitPerUser: "",
      validFrom: "",
      validUntil: "",
      freeShipping: false,
      description: "",
      active: true,
    });
    setEditing(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.validFrom) {
      showToast("Valid from is required", "error");
      return;
    }
    if (!form.validUntil) {
      showToast("Valid until is required", "error");
      return;
    }
    const validFrom = form.validFrom;
    const validUntil = form.validUntil;

    const today = startOfDay(new Date());
    const fromDate = new Date(validFrom);
    if (!editing && isBefore(fromDate, today)) {
      showToast("Valid from must be today or a future date", "error");
      return;
    }

    const untilDate = new Date(validUntil);
    if (isBefore(untilDate, fromDate)) {
      showToast("Valid until must be on or after valid from", "error");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.type === "free_shipping" ? 0 : parseFloat(form.value) || 0,
      minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : 0,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
      usageLimitPerUser: form.usageLimitPerUser ? parseInt(form.usageLimitPerUser, 10) : null,
      validFrom,
      validUntil,
      freeShipping: form.type === "free_shipping" || form.freeShipping,
      description: form.description.trim() || null,
      active: form.active,
    };

    if (!payload.code) {
      showToast("Code is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const url = editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(editing ? "Coupon updated" : "Coupon created", "success");
      resetForm();
      fetchCoupons();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (c: Coupon) => {
      if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
      try {
        const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        showToast("Coupon deleted", "success");
        setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed", "error");
      }
    },
    [showToast]
  );

  const handleEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type as "percentage" | "fixed" | "free_shipping",
      value: String(c.value),
      minPurchase: c.minPurchase != null ? String(c.minPurchase) : "",
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      usageLimitPerUser: c.usageLimitPerUser != null ? String(c.usageLimitPerUser) : "",
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : "",
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : "",
      freeShipping: c.freeShipping,
      description: c.description || "",
      active: c.active,
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setForm({
      code: "",
      type: "percentage",
      value: "10",
      minPurchase: "",
      maxDiscount: "",
      usageLimit: "",
      usageLimitPerUser: "",
      validFrom: today,
      validUntil: nextMonth,
      freeShipping: false,
      description: "",
      active: true,
    });
    setEditing(null);
    setDialogOpen(true);
  };

  const renderTypeLabel = (type: string) => {
    if (type === "percentage") return "% off";
    if (type === "fixed") return "fixed off";
    if (type === "free_shipping") return "Free shipping";
    return type;
  };

  const renderValue = (c: Coupon) => {
    if (c.type === "free_shipping") return "—";
    if (c.type === "percentage") return `${c.value}%`;
    return `$${c.value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Coupons"
        icon={Tag}
        description="Manage discount codes and promotions"
      />

      {canWrite && (
        <>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Coupon
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Coupon" : "New Coupon"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Update the coupon details below." : "Create a new discount code."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Code *</label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE10"
                      required
                      disabled={!!editing}
                    />
                    {editing && <p className="text-xs text-muted-foreground mt-1">Code cannot be changed</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" | "free_shipping" })}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="percentage">Percentage off</option>
                      <option value="fixed">Fixed amount off</option>
                      <option value="free_shipping">Free shipping</option>
                    </select>
                  </div>
                </div>

                {form.type !== "free_shipping" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Value * {form.type === "percentage" ? "(% off)" : "($ off)"}
                      </label>
                      <Input
                        type="number"
                        step={form.type === "percentage" ? 1 : 0.01}
                        min={0}
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        required
                      />
                    </div>
                    {form.type === "percentage" && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Max discount ($)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={form.maxDiscount}
                          onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                          placeholder="Unlimited"
                        />
                      </div>
                    )}
                  </div>
                )}

                {form.type !== "free_shipping" && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.freeShipping}
                      onChange={(e) => setForm({ ...form, freeShipping: e.target.checked })}
                    />
                    Also apply free shipping
                  </label>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min purchase ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.minPurchase}
                      onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valid from *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          data-empty={!form.validFrom}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.validFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 shrink-0" />
                          {form.validFrom ? format(new Date(form.validFrom), "PPP") : "Pick a date (today or future)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.validFrom ? new Date(form.validFrom) : undefined}
                          onSelect={(d) => d && setForm({ ...form, validFrom: format(d, "yyyy-MM-dd") })}
                          disabled={(date) => isBefore(date, startOfDay(new Date()))}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1">Must be today or a future date</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Valid until *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          data-empty={!form.validUntil}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.validUntil && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 shrink-0" />
                          {form.validUntil ? format(new Date(form.validUntil), "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.validUntil ? new Date(form.validUntil) : undefined}
                          onSelect={(d) => d && setForm({ ...form, validUntil: format(d, "yyyy-MM-dd") })}
                          disabled={(date) => {
                            const minDate = form.validFrom ? startOfDay(new Date(form.validFrom)) : startOfDay(new Date());
                            return isBefore(date, minDate);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Usage limit (total)</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.usageLimit}
                      onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Usage limit per user</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.usageLimitPerUser}
                    onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (admin note)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="e.g. Black Friday promo"
                  />
                </div>

                {editing && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    Active
                  </label>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : editing ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid</TableHead>
                <TableHead>Status</TableHead>
                {canWrite && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canWrite ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    No coupons yet. Add one above.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell>{renderTypeLabel(c.type)}</TableCell>
                    <TableCell>{renderValue(c)}</TableCell>
                    <TableCell>
                      {c.usedCount}
                      {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.validFrom)} – {formatDate(c.validUntil)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.active ? "default" : "secondary"}>
                        {c.active ? "Active" : "Inactive"}
                      </Badge>
                      {c.freeShipping && c.type !== "free_shipping" && (
                        <span className="ml-1 text-xs text-muted-foreground">+ free ship</span>
                      )}
                    </TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
