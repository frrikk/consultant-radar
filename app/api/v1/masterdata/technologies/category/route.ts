import { NextResponse } from "next/server";
import { getMockTechnologyCategories } from "@/lib/mock-flowcase";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json(getMockTechnologyCategories(searchParams));
}
