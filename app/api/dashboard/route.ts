import { NextResponse } from "next/server";
import { seedDashboard } from "@/data/seed";
import {
  fetchGoogleNewsRumours,
  fetchTransferFeedRumours,
} from "@/lib/liveSources";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const clubName = searchParams.get("club") || seedDashboard.clubName;

  const googleNews = await fetchGoogleNewsRumours(clubName);
  const transferFeed = await fetchTransferFeedRumours(clubName);

  const liveRumours = [...transferFeed, ...googleNews];

  return NextResponse.json({
    ...seedDashboard,
    clubName,
    lastUpdated: new Date().toISOString(),
    transferRumours:
      liveRumours.length > 0 ? liveRumours : seedDashboard.transferRumours,
  });
}
