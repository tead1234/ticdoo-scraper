'use client';

import { useState } from 'react';

export default function RankIdCopier() {
  const [cachedData, setCachedData] = useState<any[] | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // 어떤 버튼이 복사 성공했는지 시각적으로 보여주기 위한 상태
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

  const classMap: Record<number, string> = {
    2000: 'a1', 1900: 'a2', 1800: 'a3',
    1500: 'b1', 1400: 'b2', 1300: 'b3', 1200: 'b4', 1100: 'b5',
    1000: 'c1', 900: 'c2', 800: 'c3', 700: 'c4', 600: 'c5',
    500: 'd1',  400: 'd2',  300: 'd3',  200: 'd4',  100: 'd5'
  };

  const orderedKeys = [
    'a1', 'a2', 'a3',
    'b1', 'b2', 'b3', 'b4', 'b5',
    'c1', 'c2', 'c3', 'c4', 'c5',
    'd1', 'd2', 'd3', 'd4', 'd5'
  ];

  // 💡 [변경 1] 데이터만 먼저 가져와서 저장하는 전용 함수
  const handleFetchData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/ranks');
      const json = await res.json();

      if (!json.success) throw new Error(json.message);
      
      setCachedData(json.data);
    } catch (error) {
      console.error('데이터 처리 중 오류 발생:', error);
      alert('데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // 💡 [변경 2] 복사만 담당하는 동기적(Synchronous) 함수 (네트워크 딜레이 없음!)
  const handleCopyLeague = async (targetLeague: string) => {
    if (!cachedData) return;

    const leagueUsers = cachedData.filter((item: any) => {
      const currentLeagueKey = classMap[item.class_type];
      return currentLeagueKey === targetLeague && item.rank >= 1 && item.rank <= 99;
    });

    leagueUsers.sort((a: any, b: any) => a.rank - b.rank);

    if (leagueUsers.length === 0) {
      alert(`${targetLeague.toUpperCase()} 리그에 데이터가 없습니다.`);
      return;
    }

    const header = `[${targetLeague.toUpperCase()} 리그]\n`;
    const userIds = leagueUsers.map((user: any) => user.unique_id).join('\n');
    const textToCopy = header + userIds;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 즉시 실행되므로 브라우저가 차단하지 않습니다.
        await navigator.clipboard.writeText(textToCopy);
      } else {
        fallbackCopyTextToClipboard(textToCopy);
      }

      // 복사 완료 시각적 피드백 (2초 후 원래대로)
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
      
      {/* 💡 [변경 3] 데이터가 없을 땐 '불러오기' 버튼만 표시 */}
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
        /* 데이터 로딩이 완료되면 바둑판 버튼들을 표시 */
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
                  // 복사 성공 시 초록색으로 잠깐 변하게 애니메이션 처리
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