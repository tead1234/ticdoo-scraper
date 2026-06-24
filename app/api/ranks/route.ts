import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// 1. 질문자님이 찾아내신 완벽한 리그 매핑표
const classMap: Record<number, string> = {
  2000: 'a1', 1900: 'a2', 1800: 'a3',
  1500: 'b1', 1400: 'b2', 1300: 'b3', 1200: 'b4', 1100: 'b5',
  1000: 'c1',  900: 'c2',  800: 'c3',  700: 'c4',  600: 'c5',
   500: 'd1',  400: 'd2',  300: 'd3',  200: 'd4',  100: 'd5'
};

export async function GET() {
  try {
    // 2. 18개의 틱두 API 요청을 동시에 준비
    const fetchPromises = Object.entries(classMap).map(async ([leagueId, leagueKey]) => {
      const targetUrl = `https://tikdo.kr/api/rankings/current?leagueType=${leagueId}`;
      
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Referer': `https://tikdo.kr/ranking/${leagueKey}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
        },
        // 💡 핵심: 3분(180초) 동안 틱두 서버를 찌르지 않고 Vercel이 데이터를 기억함 (과부하 방지)
        next: { revalidate: 180 } 
      });

      if (!response.ok) {
        // 특정 리그가 에러 나더라도 전체가 멈추지 않도록 빈 배열 반환 후 로깅
        console.error(`${leagueKey}(${leagueId}) 리그 호출 실패`);
        return { key: leagueKey, data: [] };
      }

      const data = await response.json();
      return { key: leagueKey, data: data };
    });

    // 3. 18개의 요청을 한 번에 발사! (Promise.all)
    const results = await Promise.all(fetchPromises);

    // 4. 받아온 결과를 프론트엔드가 쓰기 편하게 { "a1": [...], "b3": [...] } 형태로 조립
    const finalData = results.reduce((acc, curr) => {
      acc[curr.key] = curr.data;
      return acc;
    }, {} as Record<string, any>);

    // 최종 데이터 반환
    return NextResponse.json({ success: true, data: finalData });

  } catch (error: any) {
    console.error('API 병렬 Fetch 에러:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==========================================
// [유지됨] 2. 관리자 로그인 및 JWT 발급 (POST)
// ==========================================
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === process.env.MASTER_PASSWORD) {
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(SECRET_KEY);

      const response = NextResponse.json({ success: true });

      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    } else {
      return NextResponse.json({ success: false, message: '비밀번호가 틀렸습니다.' }, { status: 401 });
    }
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}