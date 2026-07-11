import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/";

  // Check for any cookie containing "session_token" (handles both dev and prod prefixes)
  const cookies = request.cookies.getAll();
  const sessionToken = cookies.find(c => c.name.includes("session_token"))?.value;

  if (sessionToken) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    // If no session token, redirect from protected routes to login
    if (!isAuthPage && !request.nextUrl.pathname.startsWith("/api") && !request.nextUrl.pathname.startsWith("/_next") && !request.nextUrl.pathname.startsWith("/favicon")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:js|css|svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
