import * as cheerio from "cheerio";
import type { TransferRumour } from "@/types/football";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function guessStatus(text: string): TransferRumour["status"] {
  const lower = text.toLowerCase();

  if (
    lower.includes("official") ||
    lower.includes("completed") ||
    lower.includes("done deal")
  ) {
    return "done";
  }

  if (
    lower.includes("agreement") ||
    lower.includes("agreed") ||
    lower.includes("set to join")
  ) {
    return "agreement";
  }

  if (
    lower.includes("close") ||
    lower.includes("advanced") ||
    lower.includes("final stages")
  ) {
    return "advanced";
  }

  if (
    lower.includes("talks") ||
    lower.includes("negotiations") ||
    lower.includes("contact")
  ) {
    return "talks";
  }

  return "rumour";
}

function guessFeeMillion(text: string) {
  const euroM = text.match(/€\s?(\d+(?:\.\d+)?)\s?m/i);
  if (euroM) return Number(euroM[1]);

  const million = text.match(/(\d+(?:\.\d+)?)\s?million/i);
  if (million) return Number(million[1]);

  return 0;
}

function guessPosition(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("goalkeeper")) return "GK";
  if (lower.includes("centre-back") || lower.includes("defender")) return "DF";
  if (lower.includes("midfielder")) return "MF";
  if (lower.includes("winger")) return "WG";
  if (lower.includes("striker") || lower.includes("forward")) return "FW";

  return "Unknown";
}

export async function fetchGoogleNewsRumours(
  clubName: string
): Promise<TransferRumour[]> {
  const searchWords = `${clubName} transfer OR mercato OR calciomercato`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    searchWords
  )}&hl=en&gl=US&ceid=US:en`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 FootballPersonalDashboard/1.0",
      },
      next: {
        revalidate: 60 * 60 * 6,
      },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const items: TransferRumour[] = [];

    $("item").each((index, element) => {
      const title = cleanText($(element).find("title").text());
      const link = cleanText($(element).find("link").text());
      const pubDate = cleanText($(element).find("pubDate").text());

      if (!title) return;

      items.push({
        id: `news-${index}-${title.slice(0, 20)}`,
        playerName: title,
        age: 0,
        position: guessPosition(title),
        fromClub: "Unknown",
        toClub: clubName,
        feeMillion: guessFeeMillion(title),
        annualWageMillion: 0,
        contractYears: 5,
        status: guessStatus(title),
        sourceName: "Google News RSS",
        sourceUrl: link,
        sourceTier: 2,
        crossSourceCount: 1,
        updatedAt: pubDate
          ? new Date(pubDate).toISOString()
          : new Date().toISOString(),
        photoUrl: "",
      });
    });

    return items.slice(0, 15);
  } catch (error) {
    console.error("Google News fetch failed:", error);
    return [];
  }
}

export async function fetchTransferFeedRumours(
  clubName: string
): Promise<TransferRumour[]> {
  const url = "https://www.transferfeed.com/rumours";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 FootballPersonalDashboard/1.0",
      },
      next: {
        revalidate: 60 * 60 * 6,
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);

    const items: TransferRumour[] = [];

    $("a").each((index, element) => {
      const text = cleanText($(element).text());
      const href = $(element).attr("href");

      if (!text) return;
      if (!text.toLowerCase().includes(clubName.toLowerCase())) return;

      const sourceUrl = href?.startsWith("http")
        ? href
        : href
          ? `https://www.transferfeed.com${href}`
          : url;

      items.push({
        id: `tf-${index}-${text.slice(0, 20)}`,
        playerName: text,
        age: 0,
        position: guessPosition(text),
        fromClub: "Unknown",
        toClub: clubName,
        feeMillion: guessFeeMillion(text),
        annualWageMillion: 0,
        contractYears: 5,
        status: guessStatus(text),
        sourceName: "TransferFeed",
        sourceUrl,
        sourceTier: 2,
        crossSourceCount: 1,
        updatedAt: new Date().toISOString(),
        photoUrl: "",
      });
    });

    return items.slice(0, 10);
  } catch (error) {
    console.error("TransferFeed fetch failed:", error);
    return [];
  }
}
