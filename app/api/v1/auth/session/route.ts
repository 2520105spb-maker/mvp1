import { NextRequest } from "next/server";
import { apiError, getSessionFromRequest, json } from "@/lib/integration/api";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiError("UNAUTHENTICATED", "Сессия не найдена", 401);
  return json({ session });
}
