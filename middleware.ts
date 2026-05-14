import { NextResponse, type NextRequest } from "next/server";
import { ROLE_PERMISSIONS, ROUTE_PERMISSIONS } from "./lib/auth/rbac";
import type { UserRole } from "./lib/auth/types";

const PUBLIC_ROUTES = ["/login", "/manifest.webmanifest", "/sw.js"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next")
  ) {
    return secureResponse(NextResponse.next(), request);
  }

  const accessToken = request.cookies.get("neo_access_token")?.value;
  const role = request.cookies.get("neo_role")?.value as UserRole | undefined;

  if (!accessToken || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return secureResponse(NextResponse.redirect(loginUrl), request);
  }

  const requiredPermission = Object.entries(ROUTE_PERMISSIONS)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname.startsWith(route))?.[1];

  if (requiredPermission && !ROLE_PERMISSIONS[role]?.includes(requiredPermission)) {
    return secureResponse(
      NextResponse.redirect(new URL("/dashboard?denied=1", request.url)),
      request,
    );
  }

  return secureResponse(NextResponse.next(), request);
}

function secureResponse(response: NextResponse, request: NextRequest) {
  const token = request.cookies.get("neo_access_token")?.value;
  if (token) {
    response.cookies.set("neo_access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
