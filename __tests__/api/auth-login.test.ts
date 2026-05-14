import { NextRequest } from "next/server";
import { POST } from "@/app/api/v1/auth/login/route";

function jsonRequest(url: string, body: unknown, headers?: HeadersInit) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/auth/login", () => {
  it("returns a session payload and secure auth cookies", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/v1/auth/login", { role: "dispatcher" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.session.role).toBe("dispatcher");
    expect(response.cookies.get("neo_session")?.value).toBeTruthy();
    expect(response.cookies.get("neo_access_token")?.value).toBeTruthy();
    expect(response.cookies.get("neo_csrf_token")?.value).toBeTruthy();
  });
});
