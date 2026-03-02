"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Address {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "shipping",
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Kenya",
    phone: "",
    isDefault: false,
  });

  const fetchAddresses = () => {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses || []))
      .catch(() => showToast("Failed to load addresses", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setForm({
      type: "shipping",
      firstName: "",
      lastName: "",
      company: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Kenya",
      phone: "",
      isDefault: false,
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        type: form.type,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        company: form.company.trim() || undefined,
        address1: form.address1.trim(),
        address2: form.address2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim() || undefined,
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
        phone: form.phone.trim() || undefined,
        isDefault: form.isDefault,
      };
      const url = editing ? `/api/addresses/${editing}` : "/api/addresses";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(editing ? "Address updated" : "Address added", "success");
      resetForm();
      fetchAddresses();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast("Address deleted", "success");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const startEdit = (a: Address) => {
    setEditing(a.id);
    setForm({
      type: a.type,
      firstName: a.firstName,
      lastName: a.lastName,
      company: a.company || "",
      address1: a.address1,
      address2: a.address2 || "",
      city: a.city,
      state: a.state || "",
      postalCode: a.postalCode,
      country: a.country,
      phone: a.phone || "",
      isDefault: a.isDefault,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
        <p className="mt-4 text-gray-500">Loading addresses…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
        <p className="mt-1 text-gray-600">Manage your shipping and billing addresses</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Saved addresses</h2>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add address
          </Button>
        </div>
        <div className="p-6">
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold">{editing ? "Edit address" : "New address"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">First name *</label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last name *</label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address line 1 *</label>
                <Input value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address line 2</label>
                <Input value={form.address2} onChange={(e) => setForm({ ...form, address2: e.target.value })} placeholder="Apartment, suite, etc." />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State / Province</label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postal code *</label>
                  <Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country *</label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254..." />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                Default address
              </label>
              <div className="flex gap-2">
                <Button type="submit">{editing ? "Update" : "Add"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No addresses yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Add an address for faster checkout</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add address
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((a) => (
                <div key={a.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{a.firstName} {a.lastName}</p>
                      <p className="text-sm text-gray-500 capitalize">{a.type}</p>
                      {a.isDefault && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">Default</span>
                      )}
                      <p className="mt-2 text-gray-700">{a.address1}</p>
                      {a.address2 && <p className="text-gray-700">{a.address2}</p>}
                      <p className="text-gray-700">{a.city}, {a.state} {a.postalCode}</p>
                      <p className="text-gray-700">{a.country}</p>
                      {a.phone && <p className="text-gray-600 text-sm mt-1">{a.phone}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
