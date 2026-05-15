import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  console.log("Cron executed:", new Date().toISOString());

  return NextResponse.json({
    ok: true,
    message: "Dashboard data refresh executed",
    executedAt: new Date().toISOString(),
  });
}
