"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import WysiwygEditor from "@/components/WysiwygEditor";
import { ADMIN_PATH } from "@/lib/constants";
import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/cp/PageHeader";

const PAGES = [
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "about-us", title: "About Us" },
  { slug: "terms-of-service", title: "Terms of Service" },
  { slug: "return-policy", title: "Return Policy & Refunds" },
];

export default function AdminPagesPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState("privacy-policy");
  const [content, setContent] = useState<Record<string, { title: string; content: string }>>({});

  useEffect(() => {
    fetch("/api/pages")
        .then((r) => r.json())
        .then((pages) => {
          const map: Record<string, { title: string; content: string }> = {};
          (pages || []).forEach((p: { slug: string; title: string; content: string }) => {
            map[p.slug] = { title: p.title || p.slug, content: p.content || "" };
          });
          PAGES.forEach((p) => {
            if (!map[p.slug]) map[p.slug] = { title: p.title, content: "" };
          });
          setContent(map);
        })
        .catch(() => showToast("Failed to load pages", "error"))
        .finally(() => setLoading(false));
  }, [showToast]);

  const handleSave = async () => {
    const page = content[selected];
    if (!page) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selected, title: page.title, content: page.content }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast("Page saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const role = (session?.user as { role?: string })?.role;
  const canWrite = role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const page = content[selected];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Manage Pages" icon={FileText} description="Edit static site pages" />

          <div className="flex gap-4 mb-6">
            {PAGES.map((p) => (
              <button key={p.slug} onClick={() => setSelected(p.slug)} className={`px-4 py-2 rounded-lg font-medium ${selected === p.slug ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {p.title}
              </button>
            ))}
          </div>

          {page && (
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={page.title} onChange={(e) => setContent({ ...content, [selected]: { ...page, title: e.target.value } })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content (WYSIWYG)</label>
                <WysiwygEditor value={page.content} onChange={(v) => setContent({ ...content, [selected]: { ...page, content: v } })} minHeight="300px" />
              </div>
              {canWrite && (
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          )}
    </div>
  );
}
