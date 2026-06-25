import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export const runtime = 'nodejs';
export const maxDuration = 60;

const LEAGUE_TYPES = [2000, 1900, 1800, 1500, 1400, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100];
const TTL = 3 * 60 * 1000;

let cached: { data: any; expiresAt: number } | null = null;
let pending: Promise<any> | null = null;

async function fetchAll() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('https://tikdo.kr/', { waitUntil: 'domcontentloaded' });
    return await page.evaluate(async (types) => {
      const results = await Promise.all(
        types.map(async (lt) => ({ lt, data: await (await fetch(`/api/rankings/current?leagueType=${lt}`)).json() }))
      );
      return Object.fromEntries(results.map(({ lt, data }) => [lt, data]));
    }, LEAGUE_TYPES);
  } finally {
    await browser.close();
  }
}

export async function GET() {
  if (cached && Date.now() < cached.expiresAt)
    return NextResponse.json({ success: true, data: cached.data, expiresAt: cached.expiresAt });

  if (!pending)
    pending = fetchAll()
      .then((data) => { cached = { data, expiresAt: Date.now() + TTL }; })
      .finally(() => { pending = null; });

  try {
    await pending;
    return NextResponse.json({ success: true, data: cached!.data, expiresAt: cached!.expiresAt });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}
