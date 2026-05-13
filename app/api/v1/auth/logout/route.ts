import { NextRequest } from "next/server";
import { json } from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function POST(request: NextRequest) {
  await repositories.sessions.remove(request.cookies.get("neo_session")?.value);
  const response = json({ loggedOut: true });
  response.cookies.set("neo_session", "", { path: "/", maxAge: 0 });
  response.cookies.set("neo_role", "", { path: "/", maxAge: 0 });
  return response;
}
