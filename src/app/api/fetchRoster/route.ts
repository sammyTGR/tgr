import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const response = await fetch(
      "https://oag.ca.gov/firearms/certified-handguns/search"
    );
    const html = await response.text();
    const $ = cheerio.load(html);

    const handguns: { manufacturer: string; model: string }[] = [];

    // Find the table and parse its rows
    $("table tr").each((i, row) => {
      if (i === 0) return; // Skip header row
      const manufacturer = $(row).find("td").eq(0).text().trim();
      const model = $(row).find("td").eq(1).text().trim();
      if (manufacturer && model) {
        handguns.push({ manufacturer, model });
      }
    });
    // Group models by manufacturer
    const groupedByMake = handguns.reduce((acc, { manufacturer, model }) => {
      if (!acc[manufacturer]) {
        acc[manufacturer] = [];
      }
      acc[manufacturer].push(model);
      return acc;
    }, {} as Record<string, string[]>);
    return NextResponse.json(groupedByMake);
  } catch (error) {
    console.error("Error fetching handgun data:", error);
    return NextResponse.json(
      { error: "Failed to fetch handgun data" },
      { status: 500 }
    );
  }
}
