"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ADMIN_PATH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<"loading" | "valid" | "error">("loading");
  const [invite, setInvite] = useState<{ email: string; role: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setError(data.error);
        } else {
          setStatus("valid");
          setInvite(data);
          setName(data.email?.split("@")[0] || "");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Invalid or expired invite link");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || password.length < 8) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept invite");

      const result = await signIn("credentials", {
        email: invite.email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Account created but sign-in failed. Please sign in with your new password.");
        return;
      }
      router.push(ADMIN_PATH);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            {status === "loading" && (
              <div className="flex flex-col items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-4 text-muted-foreground">Validating invite…</p>
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-8">
                <h1 className="text-xl font-semibold text-destructive mb-2">Invalid or Expired Invite</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Link href="/sign-in">
                  <Button variant="outline">Go to Sign In</Button>
                </Link>
              </div>
            )}

            {status === "valid" && invite && (
              <>
                <h1 className="text-xl font-semibold mb-1">Accept Admin Invite</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Complete your account for <span className="font-medium text-foreground">{invite.email}</span>
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password *</label>
                    <Input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creating account…" : "Accept invite & sign in"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
