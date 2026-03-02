"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { ADMIN_PATH } from "@/lib/constants";
import Link from "next/link";
import { Plus, HelpCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/cp/PageHeader";
import { getColumns, type Faq } from "./columns";

export default function AdminFaqsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", sortOrder: 0 });

  useEffect(() => {
    fetch("/api/admin/faqs")
      .then((r) => r.json())
      .then((d) => setFaqs(d?.faqs || []))
      .catch(() => showToast("Failed to load FAQs", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const loadAllFaqs = () => {
    fetch("/api/admin/faqs")
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs || []))
      .catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await fetch(`/api/faqs/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        showToast("FAQ updated", "success");
      } else {
        const res = await fetch("/api/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        showToast("FAQ created", "success");
      }
      setForm({ question: "", answer: "", sortOrder: 0 });
      setEditing(null);
      setShowForm(false);
      loadAllFaqs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const handleDelete = useCallback(async (faq: Faq) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/faqs/${faq.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast("FAQ deleted", "success");
      setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
    } catch {
      showToast("Failed to delete", "error");
    }
  }, [showToast]);

  const role = (session?.user as { role?: string })?.role;
  const canWrite = role === "admin";

  const columns = useMemo(
    () =>
      getColumns(
        canWrite,
        (faq) => {
          setEditing(faq);
          setForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder });
          setShowForm(false);
        },
        handleDelete
      ),
    [canWrite, handleDelete]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Manage FAQs" icon={HelpCircle} description="Add and edit FAQ entries" />

          {canWrite && (
            <div className="mb-8">
              {!showForm && !editing ? (
                <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                  <Plus className="h-4 w-4" />
                  Add FAQ
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
                  <h2 className="font-semibold text-lg">{editing ? "Edit FAQ" : "New FAQ"}</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1">Question *</label>
                    <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Answer *</label>
                    <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort Order</label>
                    <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">{editing ? "Update" : "Create"}</button>
                    <button type="button" onClick={() => { setForm({ question: "", answer: "", sortOrder: 0 }); setEditing(null); setShowForm(false); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          <DataTable
            columns={columns}
            data={faqs}
            filterColumn="question"
            filterPlaceholder="Filter questions..."
          />
    </div>
  );
}
