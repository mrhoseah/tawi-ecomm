"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { ADMIN_PATH } from "@/lib/constants";
import Link from "next/link";
import { Plus, Users, Upload } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/cp/PageHeader";
import { getColumns, type Team } from "./columns";

export default function AdminTeamsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    sportType: "Football",
    description: "",
  });

  useEffect(() => {
    fetch("/api/teams?limit=100&includeInactive=true")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams || []))
      .catch(() => showToast("Failed to load teams", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      logoUrl: "",
      sportType: "Football",
      description: "",
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/teams/${editing.id}` : "/api/teams";
      const method = editing ? "PATCH" : "POST";
      const body = editing
        ? { name: form.name, logoUrl: form.logoUrl || null, sportType: form.sportType, description: form.description || null }
        : { name: form.name, slug: form.slug || undefined, logoUrl: form.logoUrl || null, sportType: form.sportType, description: form.description || null };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(editing ? "Team updated" : "Team created", "success");
      resetForm();
      const listRes = await fetch("/api/teams?limit=100&includeInactive=true");
      const listData = await listRes.json();
      setTeams(listData.teams || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/product-images?folder=teams", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.urls?.[0];
      if (url) {
        setForm((f) => ({ ...f, logoUrl: url }));
        showToast("Logo uploaded to Cloudinary", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleDelete = useCallback(async (team: Team) => {
    if (!confirm(`Delete ${team.name}?`)) return;
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast("Team deleted", "success");
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
    } catch {
      showToast("Failed to delete team", "error");
    }
  }, [showToast]);

  const role = (session?.user as { role?: string })?.role;
  const canWrite = role === "admin";

  const columns = useMemo(
    () =>
      getColumns(
        canWrite,
        (team) => {
          setEditing(team);
          setForm({
            name: team.name,
            slug: team.slug,
            logoUrl: team.logoUrl || "",
            sportType: team.sportType,
            description: team.description || "",
          });
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
      <PageHeader title="Manage Teams" icon={Users} description="Add, edit, and manage teams" />

          {canWrite && (
            <div className="mb-8">
              {!showForm && !editing ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Team
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
                  <h2 className="font-semibold text-lg">{editing ? "Edit Team" : "New Team"}</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  {!editing && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="auto-generated from name"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Sport Type *</label>
                    <select
                      value={form.sportType}
                      onChange={(e) => setForm({ ...form, sportType: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600"
                    >
                      <option value="Football">Football</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Rugby">Rugby</option>
                      <option value="Hockey">Hockey</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Volleyball">Volleyball</option>
                      <option value="Athletics">Athletics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Logo (Cloudinary)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={form.logoUrl}
                        onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                        placeholder="Upload or paste URL"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600"
                      />
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
                      >
                        {uploadingLogo ? (
                          <span className="h-4 w-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Upload
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                      {editing ? "Update" : "Create"}
                    </button>
                    <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <DataTable
            columns={columns}
            data={teams}
            filterColumn="name"
            filterPlaceholder="Filter teams..."
          />
    </div>
  );
}
