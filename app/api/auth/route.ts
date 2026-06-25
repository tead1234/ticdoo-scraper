import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (password === (process.env.MASTER_PASSWORD ?? 'dart1234')) {
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
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}