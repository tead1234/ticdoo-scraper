'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // 로그인 성공 시 쿠키가 저장되었으므로 메인 페이지로 이동
        router.push('/');
        router.refresh(); 
      } else {
        alert('비밀번호가 일치하지 않습니다.');
      }
    } catch (error) {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '80px 20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '10px' }}>틱두 랭킹 스크래퍼</h2>
      <p style={{ color: '#666', marginBottom: '40px', fontSize: '14px' }}>
        허가된 사용자만 접근할 수 있습니다.
      </p>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="마스터 비밀번호 입력"
          style={{ padding: '14px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '14px', fontSize: '16px', fontWeight: 'bold',
            backgroundColor: isLoading ? '#ccc' : '#000', 
            color: 'white', border: 'none', borderRadius: '8px', cursor: isLoading ? 'wait' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}