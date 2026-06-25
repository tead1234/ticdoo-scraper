import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export const runtime = 'nodejs';
export const maxDuration = 60;

const LEAGUE_TYPES = [2000, 1900, 1800, 1500, 1400, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100];
const COOLDOWN = 5 * 60 * 1000;

let cached: { data: any } | null = null;
let lockedUntil = 0;
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

// 페이지 로드 시 상태 확인용 — 페치 유발 없음
export async function GET() {
  const now = Date.now();
  if (cached && now < lockedUntil)
    return NextResponse.json({ success: true, data: cached.data, lockedUntil, locked: true, fetching: false });
  if (pending)
    return NextResponse.json({ success: true, data: null, lockedUntil, locked: true, fetching: true });
  return NextResponse.json({ success: true, data: null, lockedUntil: 0, locked: false, fetching: false });
}

// 버튼 클릭 시 — 잠금 중이면 캐시 반환, 아니면 페치 시작 (동시 요청은 대기 후 동일 결과 반환)
export async function POST() {
  const now = Date.now();

  if (cached && now < lockedUntil)
    return NextResponse.json({ success: true, data: cached.data, lockedUntil, locked: true });

  if (!pending) {
    lockedUntil = now + COOLDOWN;
    pending = fetchAll()
      .then((data) => { cached = { data }; return data; })
      .catch((e) => { lockedUntil = 0; throw e; })
      .finally(() => { pending = null; });
  }

  try {
    await pending;
    return NextResponse.json({ success: true, data: cached!.data, lockedUntil, locked: false });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}
