import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE = "neo_csrf_token";
export const CSRF_HEADER = "x-csrf-token";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function createCsrfToken() {
  return randomBytes(32).toString("base64url");
}

export function isUnsafeMethod(method: string) {
  return unsafeMethods.has(method.toUpperCase());
}

export function validateCsrfToken(request: NextRequest) {
  if (!isUnsafeMethod(request.method)) return true;
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  return (
    cookieBuffer.length === headerBuffer.length &&
    timingSafeEqual(cookieBuffer, headerBuffer)
  );
}

export function attachCsrfCookie(response: NextResponse, token = createCsrfToken()) {
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return token;
}
