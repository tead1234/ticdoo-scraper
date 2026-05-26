import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 시크릿 키 로드 (route.ts와 동일)
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 로그인 페이지나 인증 API는 검사하지 않고 무조건 통과 (무한 루프 방지)
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. 사용자의 쿠키에서 'auth_token'이라는 이름의 JWT 꺼내기
  const token = request.cookies.get('auth_token')?.value;

  // 3. 토큰이 아예 없으면 즉시 로그인 페이지로 쫓아냄
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 4. 토큰의 서명(도장)과 만료일을 검증
    await jwtVerify(token, SECRET_KEY);
    
    // 검증 통과! 요청한 페이지(메인 화면)로 입장 허용
    return NextResponse.next();
  } catch (error) {
    // 5. 누군가 토큰을 조작했거나, 24시간이 지나 만료된 경우
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // 썩은 쿠키는 쓰레기통에 버려줌
    response.cookies.delete('auth_token');
    
    return response;
  }
}

// 💡 미들웨어가 감시할 경로 지정 (매우 중요)
export const config = {
  matcher: [
    // 메인 화면 (랭킹 추출기) 보호
    '/', 
    // 백엔드 API (데이터 탈취) 보호
    '/api/ranks/:path*' 
  ],
};