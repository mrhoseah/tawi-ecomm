import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const AUTH_PAGES = ["/sign-in", "/sign-up"];
const PROTECTED_ACCOUNT = "/account";
const PROTECTED_ADMIN = "/cp";

/** Paths that stay accessible during maintenance (admin, auth, maintenance page) */
const MAINTENANCE_ALLOWED = [
  "/maintenance",
  "/cp",
  "/sign-in",
  "/sign-up",
  "/auth/signin",
  "/auth/signup",
];

function isMaintenanceAllowed(pathname: string): boolean {
  return MAINTENANCE_ALLOWED.some((p) => pathname.startsWith(p));
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as { role?: string })?.role;
  const isLoggedIn = !!session?.user;

  // Check maintenance mode for affected paths
  if (!isMaintenanceAllowed(pathname)) {
    try {
      const base = req.nextUrl.origin;
      const res = await fetch(`${base}/api/maintenance-settings`, {
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json().catch(() => ({}));
      if (data.enabled) {
        const url = new URL("/maintenance", req.url);
        return NextResponse.redirect(url);
      }
    } catch {
      // If fetch fails, allow request to proceed
    }
  }

  // Apply security headers to all responses
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Basic XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // Referrer policy - don't send full URL
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy - restrict sensitive features
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isAccountRoute = pathname.startsWith(PROTECTED_ACCOUNT);
  const isAdminRoute = pathname.startsWith(PROTECTED_ADMIN);

  // Auth pages: redirect logged-in users to home
  if (isAuthPage && isLoggedIn) {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  // Admin: require admin or support role
  if (isAdminRoute && !isLoggedIn) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (isAdminRoute && role !== "admin" && role !== "support") {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  // Account: require any authenticated user
  if (isAccountRoute && !isLoggedIn) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return response;
});

export const config = {
  matcher: [
    // Exclude api/, _next, static files - so middleware fetch to /api/maintenance-settings doesn't re-run middleware
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
