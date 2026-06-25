import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import { chromium as playwright } from 'playwright-core';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const leagueType = new URL(request.url).searchParams.get('leagueType');
  if (!leagueType) return NextResponse.json({ success: false, message: '리그 번호가 없습니다.' }, { status: 400 });

  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: process.env.CHROMIUM_PATH ?? await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://tikdo.kr/', { waitUntil: 'domcontentloaded' });
    const data = await page.evaluate(async (lt) => {
      const res = await fetch(`/api/rankings/current?leagueType=${lt}`);
      return res.json();
    }, leagueType);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  } finally {
    await browser.close();
  }
}
