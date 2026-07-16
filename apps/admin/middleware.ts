import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * Edge-level check only — presence of the refresh cookie, not validity. Real enforcement
 * (token validity, permissions) always happens server-side against the API.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has("refresh_token");
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // /api/* is excluded — those are proxied straight to the backend, which enforces its
  // own auth; gating them here would block the login/refresh calls themselves.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
