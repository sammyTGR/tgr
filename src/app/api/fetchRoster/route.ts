import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedMake = searchParams.get('make');
    const requestedModel = searchParams.get('model');

    const response = await fetch('https://oag.ca.gov/firearms/certified-handguns/search');
    const html = await response.text();
    const $ = cheerio.load(html);

    // If make and model are provided, return details for that specific handgun
    if (requestedMake && requestedModel) {
      let details = null;
      $('table tr').each((i, row) => {
        if (i === 0) return; // Skip header row
        const manufacturer = $(row).find('td').eq(0).text().trim();
        const model = $(row).find('td').eq(1).text().trim();

        if (manufacturer === requestedMake && model === requestedModel) {
          details = {
            caliber: $(row).find('td').eq(2).text().trim(),
            barrelLength: $(row).find('td').eq(3).text().trim(),
            unit: 'in',
            material: 'ALLOY/POLYMER',
            category: 'SEMI-AUTOMATIC',
          };
        }
      });
      return NextResponse.json(details || { error: 'Handgun not found' });
    }

    // Otherwise return the original grouped list
    const handguns: { manufacturer: string; model: string }[] = [];

    $('table tr').each((i, row) => {
      if (i === 0) return;
      const manufacturer = $(row).find('td').eq(0).text().trim();
      const model = $(row).find('td').eq(1).text().trim();
      if (manufacturer && model) {
        handguns.push({ manufacturer, model });
      }
    });

    const groupedByMake = handguns.reduce(
      (acc, { manufacturer, model }) => {
        if (!acc[manufacturer]) {
          acc[manufacturer] = [];
        }
        acc[manufacturer].push(model);
        return acc;
      },
      {} as Record<string, string[]>
    );

    return NextResponse.json(groupedByMake);
  } catch (error) {
    console.error('Error fetching handgun data:', error);
    return NextResponse.json({ error: 'Failed to fetch handgun data' }, { status: 500 });
  }
}
