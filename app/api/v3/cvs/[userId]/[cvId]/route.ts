import { NextResponse } from "next/server";
import { getMockCvByUserId } from "@/lib/mock-flowcase";

type RouteContext = {
  params: Promise<{
    userId: string;
    cvId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { userId, cvId } = await context.params;
  const cv = getMockCvByUserId(userId, cvId);

  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  return NextResponse.json(cv);
}
