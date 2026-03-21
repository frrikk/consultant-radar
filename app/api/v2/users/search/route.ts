import { NextResponse } from "next/server";
import { getMockUsersSearch } from "@/lib/mock-flowcase";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json(getMockUsersSearch(searchParams));
}
