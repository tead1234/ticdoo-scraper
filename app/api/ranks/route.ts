import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// ==========================================
// [수정됨] 1. 랭킹 데이터 긁어오기 (GET)
// ==========================================
export async function GET() {
  try {
    // 틱두 사이트의 개방된 API로 다이렉트 요청 (토큰 불필요)
    const response = await fetch('https://tikdo.kr/api/rankings/current?leagueType=1300', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://tikdo.kr/ranking/b3',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
      },
      cache: 'no-store' 
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const rankData = await response.json();
    
    // 가져온 데이터를 프론트엔드로 전달
    return NextResponse.json({ success: true, data: rankData });

  } catch (error: any) {
    console.error('API Fetch Error:', error);
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

    // 1. 비밀번호 검증
    if (password === process.env.MASTER_PASSWORD) {
      
      // 2. 비밀번호가 맞으면 JWT 토큰 생성 (24시간 유효)
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h') // 24시간 후 만료
        .sign(SECRET_KEY);

      const response = NextResponse.json({ success: true });

      // 3. 브라우저 쿠키에 안전하게 토큰 심기
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true, // 자바스크립트에서 탈취 불가능하게 설정
        secure: process.env.NODE_ENV === 'production', // Vercel(https)에서는 필수
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24시간
      });

      return response;
    } else {
      // 비밀번호가 틀린 경우
      return NextResponse.json({ success: false, message: '비밀번호가 틀렸습니다.' }, { status: 401 });
    }
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}