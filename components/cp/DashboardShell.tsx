"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }
    const role = (session?.user as { role?: string })?.role;
    if (status === "authenticated" && session && role !== "admin" && role !== "support") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "admin" && role !== "support")) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 lg:px-8">
          <SidebarTrigger className="-ml-1 size-8 rounded-md hover:bg-muted" />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium text-foreground">
            {session.user?.name || session.user?.email || "Admin"}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              View store
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/20">
          <div className="w-full max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
