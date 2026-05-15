import { NextResponse } from "next/server";
import { seedDashboard } from "@/data/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ...seedDashboard,
    lastUpdated: new Date().toISOString(),
  });
}
