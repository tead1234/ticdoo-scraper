'use client';

import { useState } from 'react';

export default function RankIdCopier() {
  // 💡 [변경 1] 이제 배열(any[])이 아니라 객체(Record<string, any>) 형태로 저장됩니다.
  const [cachedData, setCachedData] = useState<Record<string, any> | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      alert('클립보드 복사 지원 불가 브라우저');
    }
    document.body.removeChild(textArea);
  };

  // 🗑️ [삭제됨] classMap은 이제 백엔드가 처리하므로 프론트엔드에선 필요 없습니다!

  const orderedKeys = [
    'a1', 'a2', 'a3',
    'b1', 'b2', 'b3', 'b4', 'b5',
    'c1', 'c2', 'c3', 'c4', 'c5',
    'd1', 'd2', 'd3', 'd4', 'd5'
  ];

  const handleFetchData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/ranks');
      const json = await res.json();

      if (!json.success) throw new Error(json.message);
      
      // json.data는 이제 { "a1": [...], "b2": [...] } 형태의 객체입니다.
      setCachedData(json.data);
    } catch (error) {
      console.error('데이터 처리 중 오류 발생:', error);
      alert('데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCopyLeague = async (targetLeague: string) => {
    if (!cachedData) return;

    // 💡 [핵심 변경] 전체 데이터를 filter 할 필요 없이, 해당하는 방(key)의 데이터를 즉시 꺼냅니다.
    // 틱두 API 응답이 { data: [...] } 형태로 한 번 더 감싸져 있을 상황을 대비한 방어 코드입니다.
    let rawLeagueData = cachedData[targetLeague] || [];
    let leagueUsers = Array.isArray(rawLeagueData) ? rawLeagueData : (rawLeagueData.data || []);

    // 1~99등 필터링
    const filteredUsers = leagueUsers.filter((item: any) => {
      // ⚠️ 틱두 API 속성 이름에 맞춰 수정하세요 (예: item.ranking, item.score 등)
      const currentRank = item.rank || item.ranking || 0; 
      return currentRank >= 1 && currentRank <= 99;
    });

    // 정렬
    filteredUsers.sort((a: any, b: any) => {
      const rankA = a.rank || a.ranking || 0;
      const rankB = b.rank || b.ranking || 0;
      return rankA - rankB;
    });

    if (filteredUsers.length === 0) {
      alert(`${targetLeague.toUpperCase()} 리그에 (1~99등) 데이터가 없습니다. (또는 API 속성 이름이 다를 수 있습니다)`);
      console.log(`${targetLeague} 리그 원본 데이터 확인:`, leagueUsers); // 구조 확인용 로그
      return;
    }

    const header = `[${targetLeague.toUpperCase()} 리그]\n`;
    
    // ⚠️ 틱두 API 속성 이름에 맞춰 수정하세요. (기존 unique_id 대신 userId, id 등일 수 있음)
    const userIds = filteredUsers.map((user: any) => {
      return user.unique_id || user.display_id || user.userId || user.id || '알수없는아이디';
    }).join('\n');
    
    const textToCopy = header + userIds;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        fallbackCopyTextToClipboard(textToCopy);
      }

      setCopiedKey(targetLeague);
      setTimeout(() => setCopiedKey(null), 2000);

    } catch (err) {
      console.error(err);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>틱두 리그별 아이디 복사기</h2>
      
      {!cachedData ? (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            먼저 틱두 서버에서 최신 데이터를 불러와야 합니다.
          </p>
          <button 
            onClick={handleFetchData} 
            disabled={isLoadingData}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoadingData ? 'wait' : 'pointer'
            }}
          >
            {isLoadingData ? '데이터 수집 중... (약 2~3초 소요)' : '최신 랭킹 데이터 불러오기'}
          </button>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '12px'
          }}>
            {orderedKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleCopyLeague(key)}
                style={{
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: copiedKey === key ? '#10b981' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s'
                }}
              >
                {copiedKey === key ? '복사됨!' : key.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button 
              onClick={handleFetchData}
              disabled={isLoadingData}
              style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }}
            >
               {isLoadingData ? '새로고침 중...' : '데이터 새로고침'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}