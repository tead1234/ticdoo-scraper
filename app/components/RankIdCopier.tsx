'use client';

import { useState, useEffect } from 'react';

const CLASS_MAP: Record<string, number> = {
  'a1': 2000, 'a2': 1900, 'a3': 1800,
  'b1': 1500, 'b2': 1400, 'b3': 1300, 'b4': 1200, 'b5': 1100,
  'c1': 1000, 'c2': 900,  'c3': 800,  'c4': 700,  'c5': 600,
  'd1': 500,  'd2': 400,  'd3': 300,  'd4': 200,  'd5': 100,
};

const getIds = (rawData: any): string[] => {
  const users = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
  return users
    .filter((u: any) => { const r = u.rank ?? u.ranking ?? 0; return r >= 1 && r <= 99; })
    .sort((a: any, b: any) => (a.rank ?? a.ranking ?? 0) - (b.rank ?? b.ranking ?? 0))
    .map((u: any) => u.unique_id ?? u.display_id ?? u.userId ?? u.id ?? '');
};

const copyText = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const el = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;left:-999999px' });
  document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
};

const fmt = (ms: number) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}분 ${s % 60}초`; };

export default function RankIdCopier() {
  const [cache, setCache] = useState<Record<number, any> | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      const rem = Math.max(0, expiresAt - Date.now());
      setRemaining(rem);
      if (rem === 0) { setCache(null); setExpiresAt(null); }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ranks/all');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setCache(json.data);
      setExpiresAt(json.expiresAt);
      setRemaining(json.expiresAt - Date.now());
    } catch {
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (key: string) => {
    const ids = getIds(cache![CLASS_MAP[key]]);
    if (!ids.length) return alert(`${key.toUpperCase()} 리그에 데이터가 없습니다.`);
    await copyText(`[${key.toUpperCase()} 리그]\n${ids.join('\n')}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!cache) return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <button
        onClick={loadAll} disabled={isLoading}
        style={{ padding: '14px 32px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: isLoading ? 'wait' : 'pointer' }}
      >
        {isLoading ? '전체 데이터 불러오는 중...' : '전체 데이터 불러오기'}
      </button>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '16px', fontSize: '14px' }}>
        캐시 만료까지 <strong style={{ color: remaining < 30000 ? '#ef4444' : '#10b981' }}>{fmt(remaining)}</strong> 남음
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
        {Object.keys(CLASS_MAP).map((key) => (
          <button
            key={key} onClick={() => handleCopy(key)}
            style={{
              padding: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: copiedKey === key ? '#10b981' : '#0070f3',
              color: 'white', border: 'none', borderRadius: '8px', transition: 'background-color 0.2s',
            }}
          >
            {copiedKey === key ? '복사됨!' : key.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
