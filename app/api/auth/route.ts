import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';


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

