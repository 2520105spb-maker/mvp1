import { NextResponse, type NextRequest } from "next/server";
import { ROLE_PERMISSIONS, ROUTE_PERMISSIONS } from "./lib/auth/rbac";
import type { UserRole } from "./lib/auth/types";

const PUBLIC_ROUTES = ["/login", "/manifest.webmanifest", "/sw.js"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("neo_access_token")?.value;
  const role = request.cookies.get("neo_role")?.value as UserRole | undefined;

  if (!accessToken || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredPermission = Object.entries(ROUTE_PERMISSIONS)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname.startsWith(route))?.[1];

  if (requiredPermission && !ROLE_PERMISSIONS[role]?.includes(requiredPermission)) {
    return NextResponse.redirect(new URL("/dashboard?denied=1", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
