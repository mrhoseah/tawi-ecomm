"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";

// Simple local-storage flag so we only prompt once per browser when the phone has been captured
const STORAGE_KEY = "tawi:first-login-phone-captured";

export default function PhoneCaptureDialog() {
  const { data: session, update } = useSession();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Decide whether to show the dialog
  useEffect(() => {
    if (!session?.user) return;
    const lsFlag = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const existingPhone = (session.user as any).phone as string | undefined;

    if (!existingPhone && lsFlag !== "1") {
      setOpen(true);
      setPhone("");
    }
  }, [session?.user]);

  const validateAndFormatPhone = (value: string): { error: string | null; e164?: string } => {
    const trimmed = value.trim();
    // Try to parse as-is; if user types a local KE number without +254, assume Kenya
    let phone = parsePhoneNumberFromString(trimmed, "KE");
    if (!phone) {
      return { error: "Enter a valid phone number with country code, e.g. +254712345678" };
    }
    if (!phone.isValid()) {
      return { error: "Enter a valid phone number with country code, e.g. +254712345678" };
    }
    return { error: null, e164: phone.number }; // E.164 formatted (+2547...)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error, e164 } = validateAndFormatPhone(phone);
    if (error || !e164) {
      showToast(error || "Invalid phone number", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: e164 }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save phone number");
      }

      // Update client session so the new phone is available immediately
      await update({ phone: e164 });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, "1");
      }
      showToast("Phone number saved", "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save phone number", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isSubmitting) setOpen(next); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add your phone number</DialogTitle>
          <DialogDescription>
            For order updates and M-Pesa payments, we use your phone number. Please enter a number with country code.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Phone number (with country code)
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254712345678"
              autoFocus
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Include the international prefix (e.g. +254 for Kenya).
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Saving..." : "Save number"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

