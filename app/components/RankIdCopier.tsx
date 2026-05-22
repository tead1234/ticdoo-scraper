'use client';

import { useState } from 'react';

export default function RankIdCopier() {
  // 💡 [핵심 추가] API에서 한 번 불러온 데이터를 저장해두는 상태 (매번 로딩 방지)
  const [cachedData, setCachedData] = useState<any[] | null>(null);
  // 현재 어떤 버튼이 로딩 중인지 식별하는 상태
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

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
      // alert는 메인 함수에서 띄우므로 여기서는 생략하거나 폴백용 알림만 남깁니다.
    } catch (err) {
      alert('클립보드 복사 지원 불가 브라우저');
    }
    document.body.removeChild(textArea);
  };

  // 리그 정보 매핑
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

  // 💡 [핵심 변경] 특정 리그(targetLeague)만 받아서 처리하는 함수
  const handleCopyLeague = async (targetLeague: string) => {
    setLoadingKey(targetLeague);

    try {
      let dataToProcess = cachedData;

      // 1. 캐싱된 데이터가 없으면 최초 1회 API 호출
      if (!dataToProcess) {
        const res = await fetch('/api/ranks');
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.message);
        }
        
        dataToProcess = json.data;
        setCachedData(dataToProcess); // 다음 버튼 클릭을 위해 전체 데이터 임시 저장
      }

      // 2. 누른 버튼(targetLeague)에 해당하는 유저만 필터링
      const leagueUsers = dataToProcess!.filter((item: any) => {
        const currentLeagueKey = classMap[item.class_type];
        // 선택한 리그와 일치하고, 1~99등 사이인 사람만 골라냅니다.
        return currentLeagueKey === targetLeague && item.rank >= 1 && item.rank <= 99;
      });

      // 3. 랭크 순으로 정렬
      leagueUsers.sort((a: any, b: any) => a.rank - b.rank);

      if (leagueUsers.length === 0) {
        alert(`${targetLeague} 리그에 해당하는 데이터가 없습니다.`);
        return;
      }

      // 4. 랭크 순위, 헤더([a1]) 모두 제외하고 오직 영문 아이디만 추출
      const header = `[${targetLeague.toUpperCase()} 리그]\n`;
      const userIds = leagueUsers.map((user: any) => user.unique_id).join('\n');
      const textToCopy = header + userIds;

      // 5. 클립보드 복사 실행
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        alert(`[${targetLeague.toUpperCase()}] 리그 아이디 복사 완료!`);
      } else {
        fallbackCopyTextToClipboard(textToCopy);
        alert(`[${targetLeague.toUpperCase()}] 리그 아이디 복사 완료! (호환 모드)`);
      }

    } catch (error) {
      console.error('데이터 처리 중 오류 발생:', error);
      alert('데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingKey(null);
    }
  };

  // 💡 [화면 변경] 버튼을 리그별로 Grid 형태로 깔끔하게 배치
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>틱두 리그별 아이디 복사기</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '12px'
      }}>
        {orderedKeys.map((key) => (
          <button
            key={key}
            onClick={() => handleCopyLeague(key)}
            // 데이터를 불러오는 중에는 다른 버튼을 누르지 못하도록 방지
            disabled={loadingKey !== null} 
            style={{
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loadingKey !== null ? 'wait' : 'pointer',
              backgroundColor: loadingKey === key ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
          >
            {loadingKey === key ? '...' : key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 캐싱 상태를 사용자에게 알려주는 안내문 */}
      {cachedData && (
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
          ✅ 데이터를 성공적으로 불러왔습니다. 이제 다른 버튼은 즉시 복사됩니다.
        </div>
      )}
    </div>
  );
}