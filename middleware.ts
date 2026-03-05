import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const AUTH_PAGES = ["/sign-in", "/sign-up", "/sign-up/verify", "/forgot-password", "/reset-password"];
const PROTECTED_ACCOUNT = "/account";
const PROTECTED_ADMIN = "/cp";

/** Build public origin from request (Vercel may pass internal URLs, use forwarded headers) */
function getPublicOrigin(req: Request): string {
  const headers = req.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "tawi-ecomm.vercel.app";
  const proto = headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as { role?: string })?.role;
  const isLoggedIn = !!session?.user;
  const isAdmin = role === "admin";
  const base = getPublicOrigin(req);

  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAccountRoute = pathname.startsWith(PROTECTED_ACCOUNT);
  const isAdminRoute = pathname.startsWith(PROTECTED_ADMIN);

  // Auth pages: allow unauthenticated access, redirect logged-in users to home
  // Exception: /sign-up/success is a post-registration guidance page - allow both
  if (isAuthPage && pathname !== "/sign-up/success") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", base));
    }
    const res = NextResponse.next();
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-XSS-Protection", "1; mode=block");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    return res;
  }

  // Maintenance mode: when enabled, only auth pages and /maintenance stay open.
  // Any other route is blocked for non-admins (even if logged in).
  try {
    const res = await fetch(`${base}/api/maintenance-settings`, {
      headers: { "Cache-Control": "no-store" },
    });
    const data = await res.json().catch(() => ({}));
    const isMaintenancePage = pathname.startsWith("/maintenance");

    if (data.enabled && !isMaintenancePage && !isAuthPage && !isAdmin) {
      return NextResponse.redirect(new URL("/maintenance", base));
    }
  } catch {
    // If fetch fails, allow request to proceed
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

  // Admin: require admin or support role
  if (isAdminRoute && !isLoggedIn) {
    const url = new URL("/sign-in", base);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (isAdminRoute && role !== "admin" && role !== "support") {
    return NextResponse.redirect(new URL("/", base));
  }

  // Account: require any authenticated user
  if (isAccountRoute && !isLoggedIn) {
    const url = new URL("/sign-in", base);
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
