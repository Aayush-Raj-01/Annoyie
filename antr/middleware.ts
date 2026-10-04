import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets, API calls, and Next.js internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get("annoyms_token")?.value;
  const isAuthPage =
    pathname === "/authentication" || pathname.startsWith("/authentication/");
  const isOnboardingPage =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  // 2. Unauthenticated visitor: lock down all pages and redirect to /authentication
  if (!tokenCookie) {
    if (!isAuthPage && !isOnboardingPage) {
      const loginUrl = new URL("/authentication", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Authenticated visitor: redirect away from auth page to home /
  if (isAuthPage) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
