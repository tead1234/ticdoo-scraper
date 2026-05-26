import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
export async function GET() {
  try {
    const now = new Date();
    const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const koreaTimeDiff = 9 * 60 * 60 * 1000;
    const kstDate = new Date(utcNow + koreaTimeDiff);
    const todayString = kstDate.toISOString().split('T')[0];

    // 기본 URL (limit이나 offset은 제외한 상태)
    const baseUrl = `https://xsabtgskeykpiojkddql.supabase.co/rest/v1/league_rankings?select=id,league_date,class_type,rank,user_id,score,created_at,nickname,unique_id,profile_image_url&league_date=eq.${todayString}&order=rank.asc`;

    let allData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let keepFetching = true;

    // 💡 [핵심] 데이터가 더 이상 없을 때까지 1,000개씩 반복해서 요청(Pagination)
    while (keepFetching) {
      // url 뒤에 offset(건너뛸 개수)과 limit(가져올 개수)을 붙여서 요청
      const paginatedUrl = `${baseUrl}&offset=${offset}&limit=${limit}`;

      const response = await fetch(paginatedUrl, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzYWJ0Z3NrZXlrcGlvamtkZHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTM5MzYsImV4cCI6MjA3Mzc2OTkzNn0.OL6MzRY5cn4s7x-HCWODoq46dWyYZuyLHGR_F8UexBE', // 원래 넣으셨던 값 그대로
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzYWJ0Z3NrZXlrcGlvamtkZHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTM5MzYsImV4cCI6MjA3Mzc2OTkzNn0.OL6MzRY5cn4s7x-HCWODoq46dWyYZuyLHGR_F8UexBE', // 원래 넣으셨던 값 그대로
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        cache: 'no-store' 
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const chunk = await response.json();

      // 가져온 조각(chunk)을 전체 데이터 배열에 합치기
      if (chunk && chunk.length > 0) {
        allData = allData.concat(chunk);
        offset += limit; // 다음번엔 1000번부터, 그다음엔 2000번부터 가져오도록 설정
      }

      // 가져온 데이터가 1,000개보다 적다면? -> 마지막 페이지라는 뜻이므로 반복문 종료!
      if (chunk.length < limit) {
        keepFetching = false;
      }
    }
    
    // 쪼개서 가져온 모든 데이터를 프론트엔드로 한 번에 전달
    return NextResponse.json({ success: true, data: allData });

  } catch (error: any) {
    console.error('API Fetch Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

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

