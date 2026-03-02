"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { Package, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search, ExternalLink, Upload, X } from "lucide-react";
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

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  stock: number;
  active: boolean;
  featured: boolean;
  onSale: boolean;
  images: string[];
  createdAt: string;
};

export default function AdminProductsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    sku: "",
    category: "uncategorized",
    tags: "",
    images: "",
    sizes: [] as string[],
    colors: "",
    stock: "0",
    lowStockThreshold: "10",
    featured: false,
    active: true,
    onSale: false,
    newArrival: false,
    bestSeller: false,
    printable: false,
    printingCost: "0",
    freeShippingEligible: true,
  });
  const role = (session?.user as { role?: string })?.role;
  const canWrite = role === "admin";
  const imageInputRef = useRef<HTMLInputElement>(null);
  const sizeInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const addSize = (size: string) => {
    const trimmed = size.trim().toUpperCase();
    if (!trimmed || form.sizes.includes(trimmed)) return;
    setForm({ ...form, sizes: [...form.sizes, trimmed] });
  };
  const removeSize = (idx: number) => {
    setForm({ ...form, sizes: form.sizes.filter((_, i) => i !== idx) });
  };

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("page", pagination.page.toString());
    params.set("limit", pagination.limit.toString());
    if (search) params.set("q", search);
    if (categoryFilter) params.set("category", categoryFilter);
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products?${params}`),
        fetch("/api/admin/categories?includeInactive=true"),
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      if (!prodRes.ok) throw new Error(prodData.error || "Failed to load products");
      if (!catRes.ok) throw new Error(catData.error || "Failed to load categories");
      setProducts(prodData.products ?? []);
      setCategories(catData.categories ?? []);
      setPagination((p) => ({
        ...p,
        page: prodData.pagination?.page ?? p.page,
        totalPages: prodData.pagination?.totalPages ?? p.totalPages,
        total: prodData.pagination?.total ?? p.total,
      }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryFilter, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      shortDescription: "",
      price: "",
      compareAtPrice: "",
      sku: "",
      category: categories[0]?.slug || "uncategorized",
      tags: "",
      images: "",
      sizes: [] as string[],
      colors: "",
      stock: "0",
      lowStockThreshold: "10",
      featured: false,
      active: true,
      onSale: false,
      newArrival: false,
      bestSeller: false,
      printable: false,
      printingCost: "0",
      freeShippingEligible: true,
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || "",
        shortDescription: form.shortDescription || null,
        price: parseFloat(form.price) || 0,
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        sku: form.sku || null,
        category: form.category || "uncategorized",
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        images: form.images ? form.images.split(",").map((u) => u.trim()).filter(Boolean) : [],
        sizes: Array.isArray(form.sizes) ? form.sizes.filter(Boolean) : [],
        colors: form.colors ? form.colors.split(",").map((c) => c.trim()).filter(Boolean) : [],
        stock: parseInt(form.stock, 10) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 10,
        featured: form.featured,
        active: form.active,
        onSale: form.onSale,
        newArrival: form.newArrival,
        bestSeller: form.bestSeller,
        printable: form.printable,
        printingCost: parseFloat(form.printingCost) || 0,
        freeShippingEligible: form.freeShippingEligible,
      };
      const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(editing ? "Product updated" : "Product created", "success");
      resetForm();
      fetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const handleDelete = useCallback(
    async (product: Product) => {
      if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
      try {
        const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        showToast("Product deleted", "success");
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed", "error");
      }
    },
    [showToast]
  );

  const handleEdit = (product: Product) => {
    setEditing(product);
    fetch(`/api/admin/products/${product.id}`)
      .then((r) => r.json())
      .then((p) => {
        setForm({
          name: p.name,
          slug: p.slug,
          description: p.description || "",
          shortDescription: p.shortDescription || "",
          price: String(p.price),
          compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
          sku: p.sku || "",
          category: p.category || "uncategorized",
          tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
          images: Array.isArray(p.images) ? p.images.join(", ") : "",
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          colors: Array.isArray(p.colors) ? p.colors.join(", ") : "",
          stock: String(p.stock ?? 0),
          lowStockThreshold: String(p.lowStockThreshold ?? 10),
          featured: p.featured ?? false,
          active: p.active !== false,
          onSale: p.onSale ?? false,
          newArrival: p.newArrival ?? false,
          bestSeller: p.bestSeller ?? false,
          printable: p.printable ?? false,
          printingCost: String(p.printingCost ?? 0),
          freeShippingEligible: p.freeShippingEligible !== false,
        });
        setShowForm(true);
      })
      .catch(() => showToast("Failed to load product", "error"));
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
      const res = await fetch("/api/uploads/product-images?folder=products", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const urls = data.urls ?? [];
      if (urls.length) {
        const current = form.images ? form.images.split(",").map((u) => u.trim()).filter(Boolean) : [];
        setForm({ ...form, images: [...current, ...urls].join(", ") });
        showToast(`${urls.length} image(s) uploaded to Cloudinary`, "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Products"
        icon={Package}
        description="Manage products and inventory"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="h-9 rounded-md border px-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {canWrite && (
              <Button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 border rounded-lg bg-muted/30 space-y-4">
              <h2 className="font-semibold text-lg">{editing ? "Edit Product" : "New Product"}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Compare at price</label>
                  <Input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-9 rounded-md border px-2 text-sm"
                  >
                    <option value="uncategorized">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sizes</label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[2.25rem] bg-background">
                    {form.sizes.map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-sm"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSize(i)}
                          className="hover:bg-primary/20 rounded p-0.5"
                          aria-label={`Remove ${s}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      ref={sizeInputRef}
                      type="text"
                      placeholder="Add size (e.g. S, M, XL)"
                      className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSize((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) addSize(v);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Type a size and press Enter to add</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Colors (comma)</label>
                  <Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Red, Blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma)</label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Images (Cloudinary upload or paste URLs)</label>
                <div className="flex gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingImages}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploadingImages ? "Uploading…" : "Upload to Cloudinary"}
                  </Button>
                  <Input
                    className="flex-1"
                    value={form.images}
                    onChange={(e) => setForm({ ...form, images: e.target.value })}
                    placeholder="Or paste URLs, comma-separated (e.g. https://…)"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Active
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.onSale} onChange={(e) => setForm({ ...form, onSale: e.target.checked })} />
                  On Sale
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.newArrival} onChange={(e) => setForm({ ...form, newArrival: e.target.checked })} />
                  New Arrival
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })} />
                  Best Seller
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.printable} onChange={(e) => setForm({ ...form, printable: e.target.checked })} />
                  Printable
                </label>
                <label className="flex items-center gap-2" title="If unchecked, this product does not qualify for free shipping threshold">
                  <input type="checkbox" checked={form.freeShippingEligible} onChange={(e) => setForm({ ...form, freeShippingEligible: e.target.checked })} />
                  Free Shipping Eligible
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editing ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                {canWrite && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canWrite ? 6 : 5} className="text-center py-12 text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <p className="text-xs text-muted-foreground">{p.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>
                      <span className="font-medium">${p.price.toFixed(2)}</span>
                      {p.onSale && <Badge variant="secondary" className="ml-2">Sale</Badge>}
                    </TableCell>
                    <TableCell>
                      <span className={p.stock < 10 ? "text-destructive font-medium" : ""}>{p.stock}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <Link href={`/product/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mr-2">
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} products)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
