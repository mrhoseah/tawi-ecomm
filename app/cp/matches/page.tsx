"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { Trophy, Plus, Pencil, Trash2, Upload, Star } from "lucide-react";
import { PageHeader } from "@/components/cp/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TeamCombobox } from "@/components/cp/TeamCombobox";

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  venue: string | null;
  status: string;
  accessPrice: number;
  videoUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
};

export default function AdminMatchesPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    homeTeam: "",
    awayTeam: "",
    matchDate: "",
    venue: "",
    status: "scheduled",
    accessPrice: "0",
    videoUrl: "",
    imageUrl: "",
    featured: false,
  });

  const role = (session?.user as { role?: string })?.role;
  const canWrite = role === "admin";

  const fetchMatches = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/matches");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load matches");
      setMatches(d.matches ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load matches", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const resetForm = () => {
    setForm({
      homeTeam: "",
      awayTeam: "",
      matchDate: "",
      venue: "",
      status: "scheduled",
      accessPrice: "0",
      videoUrl: "",
      imageUrl: "",
      featured: false,
    });
    setEditing(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.homeTeam.trim() || !form.awayTeam.trim() || !form.matchDate) {
      showToast("Home team, away team, and match date are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const url = editing ? `/api/admin/matches/${editing.id}` : "/api/admin/matches";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam: form.homeTeam.trim(),
          awayTeam: form.awayTeam.trim(),
          matchDate: form.matchDate,
          venue: form.venue.trim() || null,
          status: form.status,
          accessPrice: parseFloat(form.accessPrice) || 0,
          videoUrl: form.videoUrl.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          featured: form.featured,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(editing ? "Match updated" : "Match created", "success");
      resetForm();
      fetchMatches();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (m: Match) => {
      if (!confirm(`Delete match ${m.homeTeam} vs ${m.awayTeam}?`)) return;
      try {
        const res = await fetch(`/api/admin/matches/${m.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        showToast("Match deleted", "success");
        setMatches((prev) => prev.filter((x) => x.id !== m.id));
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed", "error");
      }
    },
    [showToast]
  );

  const handleFeaturedToggle = useCallback(
    async (m: Match) => {
      if (!canWrite) return;
      try {
        const res = await fetch(`/api/admin/matches/${m.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featured: !m.featured }),
        });
        if (!res.ok) throw new Error("Failed");
        showToast(m.featured ? "Removed from featured" : "Set as featured", "success");
        fetchMatches();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed", "error");
      }
    },
    [canWrite, showToast, fetchMatches]
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/product-images?folder=featured", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.urls?.[0];
      if (url) {
        setForm((f) => ({ ...f, imageUrl: url }));
        showToast("Image uploaded", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleEdit = (m: Match) => {
    setEditing(m);
    setForm({
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate ? m.matchDate.slice(0, 16) : "",
      venue: m.venue || "",
      status: m.status,
      accessPrice: String(m.accessPrice),
      videoUrl: m.videoUrl || "",
      imageUrl: m.imageUrl || "",
      featured: m.featured,
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    const now = new Date();
    now.setMinutes(0);
    setForm({
      homeTeam: "",
      awayTeam: "",
      matchDate: now.toISOString().slice(0, 16),
      venue: "",
      status: "scheduled",
      accessPrice: "0",
      videoUrl: "",
      imageUrl: "",
      featured: false,
    });
    setEditing(null);
    setDialogOpen(true);
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        title="Matches"
        icon={Trophy}
        description="Manage matches and featured match (landing page hero)"
      />

      {canWrite && (
        <>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Match
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Match" : "New Match"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Update the match details." : "Add a new match."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Home Team *</label>
                    <TeamCombobox
                      value={form.homeTeam}
                      onChange={(name) => setForm({ ...form, homeTeam: name })}
                      placeholder="Select home team"
                      required
                      aria-label="Home team"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Away Team *</label>
                    <TeamCombobox
                      value={form.awayTeam}
                      onChange={(name) => setForm({ ...form, awayTeam: name })}
                      placeholder="Select away team"
                      required
                      aria-label="Away team"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Match Date & Time *</label>
                    <Input
                      type="datetime-local"
                      value={form.matchDate}
                      onChange={(e) => setForm({ ...form, matchDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Venue</label>
                    <Input
                      value={form.venue}
                      onChange={(e) => setForm({ ...form, venue: e.target.value })}
                      placeholder="Stadium name"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Access Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.accessPrice}
                      onChange={(e) => setForm({ ...form, accessPrice: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video URL (stream or YouTube)</label>
                  <Input
                    value={form.videoUrl}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hero Image (when featured)</label>
                  <div className="flex gap-2">
                    <Input
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="Upload or paste URL"
                      className="flex-1"
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={uploadingImage}
                      onClick={() => imageInputRef.current?.click()}
                      title="Upload"
                    >
                      {uploadingImage ? (
                        <span className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured
                </label>
                <div className="flex gap-2 justify-end">
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
                <TableHead>Match</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Featured</TableHead>
                {canWrite && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canWrite ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    No matches yet. Add one above.
                  </TableCell>
                </TableRow>
              ) : (
                matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.homeTeam} vs {m.awayTeam}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(m.matchDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === "live" ? "default" : "secondary"}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${m.accessPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={() => handleFeaturedToggle(m)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition-colors ${
                            m.featured
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={m.featured ? "Remove from featured" : "Set as featured"}
                        >
                          <Star className={`h-4 w-4 ${m.featured ? "fill-amber-500" : ""}`} />
                          {m.featured ? "Featured" : "Set featured"}
                        </button>
                      ) : (
                        m.featured ? (
                          <Badge variant="default">Featured</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      )}
                    </TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(m)}
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
