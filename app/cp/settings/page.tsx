"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import { BarChart3, Building2, Save, Search, Settings, Upload, DollarSign, ImageIcon, Package, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/cp/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface SeoDetails {
  siteName: string;
  defaultMetaDesc: string;
  metaKeywords: string;
  ogImage: string;
  googleTagId: string;
  facebookPixelId: string;
  twitterHandle: string;
  canonicalBase: string;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  swiftCode: string;
  bankCode: string;
  instructions: string;
}

interface CurrencyDetails {
  baseCurrency: string;
  defaultDisplayCurrency: string;
  exchangeRateApiUrl: string;
  exchangeRateApiKey: string;
  exchangeRateFallback: string;
}

type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  cost: number;
  freeThreshold: number | null;
  estimatedDays: number | null;
  active: boolean;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const ogInputRef = useRef<HTMLInputElement>(null);
  const [seo, setSeo] = useState<SeoDetails>({
    siteName: "",
    defaultMetaDesc: "",
    metaKeywords: "",
    ogImage: "",
    googleTagId: "",
    facebookPixelId: "",
    twitterHandle: "",
    canonicalBase: "",
  });
  const [form, setForm] = useState<BankDetails>({
    bankName: "",
    accountName: "",
    accountNumber: "",
    branchName: "",
    swiftCode: "",
    bankCode: "",
    instructions: "",
  });
  const [currency, setCurrency] = useState<CurrencyDetails>({
    baseCurrency: "KES",
    defaultDisplayCurrency: "KES",
    exchangeRateApiUrl: "",
    exchangeRateApiKey: "",
    exchangeRateFallback: "0.0077",
  });
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [editingShipping, setEditingShipping] = useState<ShippingMethod | null>(null);
  const [shippingForm, setShippingForm] = useState({
    name: "",
    description: "",
    type: "flat",
    cost: "0",
    freeThreshold: "",
    estimatedDays: "",
    active: true,
  });
  const [submittingShipping, setSubmittingShipping] = useState(false);

  const fetchShippingMethods = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/shipping-methods?includeInactive=true");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load shipping methods");
      setShippingMethods(d.methods ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load shipping methods", "error");
    }
  }, [showToast]);

  useEffect(() => {
    Promise.all([
        fetch("/api/payment-settings").then((r) => r.json()),
        fetch("/api/seo-settings").then((r) => r.json()),
        fetch("/api/currency-settings").then((r) => r.json()),
      ]).then(([paymentData, seoData, currencyData]) => {
          setSeo({
            siteName: seoData.siteName ?? "",
            defaultMetaDesc: seoData.defaultMetaDesc ?? "",
            metaKeywords: seoData.metaKeywords ?? "",
            ogImage: seoData.ogImage ?? "",
            googleTagId: seoData.googleTagId ?? "",
            facebookPixelId: seoData.facebookPixelId ?? "",
            twitterHandle: seoData.twitterHandle ?? "",
            canonicalBase: seoData.canonicalBase ?? "",
          });
          setForm({
            bankName: paymentData.bankName ?? "",
            accountName: paymentData.accountName ?? "",
            accountNumber: paymentData.accountNumber ?? "",
            branchName: paymentData.branchName ?? "",
            swiftCode: paymentData.swiftCode ?? "",
            bankCode: paymentData.bankCode ?? "",
            instructions: paymentData.instructions ?? "",
          });
          setCurrency({
            baseCurrency: currencyData.baseCurrency ?? "KES",
            defaultDisplayCurrency: currencyData.defaultDisplayCurrency ?? "KES",
            exchangeRateApiUrl: currencyData.exchangeRateApiUrl ?? "",
            exchangeRateApiKey: currencyData.exchangeRateApiKey ?? "",
            exchangeRateFallback: currencyData.exchangeRateFallback != null ? String(currencyData.exchangeRateFallback) : "0.0077",
          });
        })
        .catch(() => showToast("Failed to load settings", "error"))
        .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    fetchShippingMethods();
  }, [fetchShippingMethods]);

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || role !== "admin") return;
    setUploadingOg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/product-images?folder=seo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.urls?.[0];
      if (url) {
        setSeo((s) => ({ ...s, ogImage: url }));
        showToast("OG image uploaded to Cloudinary", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploadingOg(false);
      e.target.value = "";
    }
  };

  const handleSeoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/seo-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seo),
      });
      if (res.ok) showToast("SEO settings saved", "success");
      else showToast((await res.json()).error || "Failed to save", "error");
    } catch {
      showToast("Failed to save SEO settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/currency-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseCurrency: currency.baseCurrency || "KES",
          defaultDisplayCurrency: currency.defaultDisplayCurrency || "KES",
          exchangeRateApiUrl: currency.exchangeRateApiUrl || null,
          exchangeRateApiKey: currency.exchangeRateApiKey || null,
          exchangeRateFallback: parseFloat(currency.exchangeRateFallback) || 0.0077,
        }),
      });
      if (res.ok) showToast("Currency settings saved", "success");
      else showToast((await res.json()).error || "Failed to save", "error");
    } catch {
      showToast("Failed to save currency settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast("Bank details saved", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save", "error");
      }
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const openShippingForm = (m?: ShippingMethod) => {
    if (m) {
      setEditingShipping(m);
      setShippingForm({
        name: m.name,
        description: m.description ?? "",
        type: m.type,
        cost: String(m.cost),
        freeThreshold: m.freeThreshold != null ? String(m.freeThreshold) : "",
        estimatedDays: m.estimatedDays != null ? String(m.estimatedDays) : "",
        active: m.active,
      });
    } else {
      setEditingShipping(null);
      setShippingForm({
        name: "",
        description: "",
        type: "flat",
        cost: "0",
        freeThreshold: "",
        estimatedDays: "",
        active: true,
      });
    }
    setShippingDialogOpen(true);
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingForm.name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    setSubmittingShipping(true);
    try {
      const payload = {
        name: shippingForm.name.trim(),
        description: shippingForm.description.trim() || null,
        type: shippingForm.type,
        cost: parseFloat(shippingForm.cost) || 0,
        freeThreshold: shippingForm.freeThreshold ? parseFloat(shippingForm.freeThreshold) : null,
        estimatedDays: shippingForm.estimatedDays ? parseInt(shippingForm.estimatedDays, 10) : null,
        active: shippingForm.active,
      };
      const url = editingShipping
        ? `/api/admin/shipping-methods/${editingShipping.id}`
        : "/api/admin/shipping-methods";
      const method = editingShipping ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(editingShipping ? "Shipping method updated" : "Shipping method added", "success");
      setShippingDialogOpen(false);
      setEditingShipping(null);
      fetchShippingMethods();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSubmittingShipping(false);
    }
  };

  const handleShippingDelete = async (m: ShippingMethod) => {
    if (!confirm(`Delete "${m.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/shipping-methods/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast("Shipping method deleted", "success");
      setShippingMethods((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const role = (session?.user as any)?.role;
  const canAccess = role === "admin" || role === "support";

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <PageHeader title="Site Settings" icon={Settings} description="Configure SEO, payment, currency, and shipping for your store" />
        <div className="flex gap-2 border-b pb-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader title="Site Settings" icon={Settings} description="Configure SEO, payment, currency, and shipping for your store" />

      <Tabs defaultValue="seo" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b bg-transparent p-0 h-auto">
          <TabsTrigger value="seo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:shadow-none">
            <Search className="h-4 w-4 mr-2" />
            SEO & Analytics
          </TabsTrigger>
          <TabsTrigger value="payment" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:shadow-none">
            <Building2 className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="currency" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:shadow-none">
            <DollarSign className="h-4 w-4 mr-2" />
            Currency
          </TabsTrigger>
          <TabsTrigger value="shipping" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:shadow-none">
            <Package className="h-4 w-4 mr-2" />
            Shipping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seo" className="mt-6">
          <form onSubmit={handleSeoSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Basic SEO
                </CardTitle>
                <CardDescription>
                  Site name appears in page titles as &quot;PageName | Site Name&quot;. Meta description and keywords help search engines index your site.
                </CardDescription>
                {role === "support" && (
                  <p className="text-amber-600 text-sm">Read-only. Admins can edit.</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Site Name</label>
                  <Input
                    value={seo.siteName}
                    onChange={(e) => setSeo({ ...seo, siteName: e.target.value })}
                    placeholder="e.g. Tawi TV"
                    readOnly={role === "support"}
                    disabled={role === "support"}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Meta Description</label>
                  <textarea
                    value={seo.defaultMetaDesc}
                    onChange={(e) => setSeo({ ...seo, defaultMetaDesc: e.target.value })}
                    rows={3}
                    placeholder="Default description for pages without their own"
                    readOnly={role === "support"}
                    disabled={role === "support"}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meta Keywords (comma-separated)</label>
                  <Input
                    value={seo.metaKeywords}
                    onChange={(e) => setSeo({ ...seo, metaKeywords: e.target.value })}
                    placeholder="sports, jerseys, tawi"
                    readOnly={role === "support"}
                    disabled={role === "support"}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OG Image</label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      value={seo.ogImage}
                      onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                      placeholder="Upload or paste URL"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10 flex-1"
                    />
                    {role === "admin" && (
                      <>
                        <input
                          ref={ogInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleOgImageUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => ogInputRef.current?.click()}
                          disabled={uploadingOg}
                          className="shrink-0"
                        >
                          {uploadingOg ? <LoadingSpinner size="sm" /> : <Upload className="h-4 w-4" />}
                          Upload
                        </Button>
                      </>
                    )}
                  </div>
                  {seo.ogImage && (
                    <div className="mt-2 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                      <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                        <img src={seo.ogImage} alt="OG preview" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden"); }} />
                        <div className="absolute inset-0 flex hidden items-center justify-center bg-muted">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Preview shown in social shares</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Analytics & Social
                </CardTitle>
                <CardDescription>
                  Add Google Tag (GTM), Facebook Pixel, and Twitter handle to enable analytics and social cards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Google Tag / GTM ID</label>
                    <Input
                      value={seo.googleTagId}
                      onChange={(e) => setSeo({ ...seo, googleTagId: e.target.value })}
                      placeholder="G-XXXXXXXXXX or GTM-XXXXXXX"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Facebook Pixel ID</label>
                    <Input
                      value={seo.facebookPixelId}
                      onChange={(e) => setSeo({ ...seo, facebookPixelId: e.target.value })}
                      placeholder="1234567890123456"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Twitter Handle (without @)</label>
                  <Input
                    value={seo.twitterHandle}
                    onChange={(e) => setSeo({ ...seo, twitterHandle: e.target.value })}
                    placeholder="tawitv"
                    readOnly={role === "support"}
                    disabled={role === "support"}
                    className="h-10 max-w-xs"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Canonical Base URL</label>
                  <Input
                    type="url"
                    value={seo.canonicalBase}
                    onChange={(e) => setSeo({ ...seo, canonicalBase: e.target.value })}
                    placeholder="https://tawitv.com"
                    readOnly={role === "support"}
                    disabled={role === "support"}
                    className="h-10"
                  />
                </div>
              </CardContent>
              {role === "admin" && (
                <div className="border-t px-6 pb-6 pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                    Save SEO Settings
                  </Button>
                </div>
              )}
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Bank Transfer Details
                </CardTitle>
                <CardDescription>
                  Bank details shown to customers when they choose Bank Transfer at checkout.
                </CardDescription>
                {role === "support" && (
                  <p className="text-amber-600 text-sm">Read-only. Admins can edit bank details.</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank Name</label>
                    <Input
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      placeholder="e.g. Equity Bank"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Name</label>
                    <Input
                      value={form.accountName}
                      onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                      placeholder="Account holder name"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Number</label>
                    <Input
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      placeholder="Account number"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Branch Name</label>
                    <Input
                      value={form.branchName}
                      onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                      placeholder="Branch"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">SWIFT Code</label>
                    <Input
                      value={form.swiftCode}
                      onChange={(e) => setForm({ ...form, swiftCode: e.target.value })}
                      placeholder="Optional"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10 max-w-xs"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Bank Code</label>
                    <Input
                      value={form.bankCode}
                      onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
                      placeholder="e.g. 01, EQBLKENA"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10 max-w-xs"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Additional Instructions</label>
                    <textarea
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                      rows={4}
                      placeholder="e.g. Include order number as reference when transferring."
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <strong>M-Pesa:</strong> Daraja API credentials are in{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code>{" "}
              (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE, MPESA_CALLBACK_URL).
            </div>

            <Button
              type="submit"
              disabled={saving || role !== "admin"}
              className="w-full"
              size="lg"
              title={role === "support" ? "Only admins can edit" : undefined}
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="h-5 w-5" />}
              {saving ? "Saving..." : role === "support" ? "View Only (Admin can edit)" : "Save Bank Details"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="currency" className="mt-6">
          <form onSubmit={handleCurrencySubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Currency & Exchange Rate
                </CardTitle>
                <CardDescription>
                  Base currency is used for stored prices (products, orders). Display currency and exchange rate API control how prices appear to customers.
                </CardDescription>
                {role === "support" && (
                  <p className="text-amber-600 text-sm">Read-only. Admins can edit.</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Currency</label>
                    <select
                      value={currency.baseCurrency}
                      onChange={(e) => setCurrency({ ...currency, baseCurrency: e.target.value })}
                      disabled={role === "support"}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="KES">KES (Kenyan Shilling)</option>
                      <option value="USD">USD</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Currency for stored product/order prices</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Display Currency</label>
                    <select
                      value={currency.defaultDisplayCurrency}
                      onChange={(e) => setCurrency({ ...currency, defaultDisplayCurrency: e.target.value })}
                      disabled={role === "support"}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="KES">KES</option>
                      <option value="USD">USD</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Initial currency shown to customers</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exchange Rate API URL</label>
                    <Input
                      type="url"
                      value={currency.exchangeRateApiUrl}
                      onChange={(e) => setCurrency({ ...currency, exchangeRateApiUrl: e.target.value })}
                      placeholder="https://api.exchangerate-api.com/v4/latest"
                      readOnly={role === "support"}
                      disabled={role === "support"}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Base URL — /KES appended to fetch KES rates</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API Key (optional)</label>
                      <Input
                        value={currency.exchangeRateApiKey}
                        onChange={(e) => setCurrency({ ...currency, exchangeRateApiKey: e.target.value })}
                        placeholder="Leave blank if API is free"
                        readOnly={role === "support"}
                        disabled={role === "support"}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fallback Rate (KES → USD)</label>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={currency.exchangeRateFallback}
                        onChange={(e) => setCurrency({ ...currency, exchangeRateFallback: e.target.value })}
                        placeholder="0.0077"
                        readOnly={role === "support"}
                        disabled={role === "support"}
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Used when API fails (e.g. 0.0077 ≈ 130 KES/USD)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              {role === "admin" && (
                <div className="border-t px-6 pb-6 pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                    Save Currency Settings
                  </Button>
                </div>
              )}
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="shipping" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Shipping Methods
                </CardTitle>
                <CardDescription>
                  Configure shipping options shown at checkout. Free shipping threshold applies when cart subtotal meets the threshold (products must be eligible).
                </CardDescription>
                {role === "support" && (
                  <p className="text-amber-600 text-sm mt-2">Read-only. Admins can edit.</p>
                )}
              </div>
              {role === "admin" && (
                <Button onClick={() => openShippingForm()} size="sm">
                  <Plus className="h-4 w-4" />
                  Add Method
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {shippingMethods.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">
                  No shipping methods yet. Add one to display options at checkout.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Free above</TableHead>
                        <TableHead>Est. days</TableHead>
                        <TableHead>Status</TableHead>
                        {role === "admin" && <TableHead className="w-[100px]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shippingMethods.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell>{m.type}</TableCell>
                          <TableCell>${m.cost.toFixed(2)}</TableCell>
                          <TableCell>{m.freeThreshold != null ? `$${m.freeThreshold}` : "—"}</TableCell>
                          <TableCell>{m.estimatedDays != null ? `${m.estimatedDays} days` : "—"}</TableCell>
                          <TableCell>
                            <span className={m.active ? "text-green-600" : "text-muted-foreground"}>
                              {m.active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          {role === "admin" && (
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openShippingForm(m)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleShippingDelete(m)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingShipping ? "Edit Shipping Method" : "Add Shipping Method"}</DialogTitle>
                <DialogDescription>
                  Shipping methods appear at checkout. Type &quot;flat&quot; uses a fixed cost; freeThreshold (optional) enables free shipping above that cart amount.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={shippingForm.name}
                    onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                    placeholder="e.g. Standard Shipping"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Input
                    value={shippingForm.description}
                    onChange={(e) => setShippingForm({ ...shippingForm, description: e.target.value })}
                    placeholder="e.g. 5-7 business days"
                    className="h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select
                      value={shippingForm.type}
                      onChange={(e) => setShippingForm({ ...shippingForm, type: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                    >
                      <option value="flat">Flat</option>
                      <option value="weight">Weight</option>
                      <option value="price">Price</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cost *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingForm.cost}
                      onChange={(e) => setShippingForm({ ...shippingForm, cost: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Free threshold (optional)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingForm.freeThreshold}
                      onChange={(e) => setShippingForm({ ...shippingForm, freeThreshold: e.target.value })}
                      placeholder="e.g. 50"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Est. days (optional)</label>
                    <Input
                      type="number"
                      min="0"
                      value={shippingForm.estimatedDays}
                      onChange={(e) => setShippingForm({ ...shippingForm, estimatedDays: e.target.value })}
                      placeholder="e.g. 5"
                      className="h-10"
                    />
                  </div>
                </div>
                {editingShipping && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shipping-active"
                      checked={shippingForm.active}
                      onChange={(e) => setShippingForm({ ...shippingForm, active: e.target.checked })}
                      className="rounded border-input"
                    />
                    <label htmlFor="shipping-active" className="text-sm font-medium">Active</label>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShippingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingShipping}>
                    {submittingShipping ? <LoadingSpinner size="sm" /> : editingShipping ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
