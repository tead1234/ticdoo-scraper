'use client';

import { useState } from 'react';

export default function RankIdCopier() {
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fallback 복사 함수
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
      alert('클립보드에 복사 완료!');
    } catch (err) {
      alert('클립보드 복사 지원 불가 브라우저');
    }
    document.body.removeChild(textArea);
  };

  // 2. 메인 복사 실행 함수
  const handleCopyIds = async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/ranks');
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message);
      }

      const rawData = json.data; // API에서 받아온 원본 전체 유저 배열
      console.log('원본 데이터:', rawData); // 원본 데이터 확인용 로그
      // 리그 등급별 매핑 표 (class_type -> 리그 키)
      const classMap: Record<number, string> = {
        2000: 'a1', 1900: 'a2', 1800: 'a3',
        1500: 'b1', 1400: 'b2', 1300: 'b3', 1200: 'b4', 1100: 'b5',
        1000: 'c1', 900: 'c2', 800: 'c3', 700: 'c4', 600: 'c5',
        500: 'd1',  400: 'd2',  300: 'd3',  200: 'd4',  100: 'd5'
      };

      // 💡 [핵심 변경] 각 리그별로 1~99등 유저들을 배열로 담을 거대한 바구니 준비
      const leagueGroups: Record<string, any[]> = {
        'a1': [], 'a2': [], 'a3': [],
        'b1': [], 'b2': [], 'b3': [], 'b4': [], 'b5': [],
        'c1': [], 'c2': [], 'c3': [], 'c4': [], 'c5': [],
        'd1': [], 'd2': [], 'd3': [], 'd4': [], 'd5': []
      };

      // 💡 전체 데이터를 돌면서 유저를 해당 리그 배열에 차곡차곡 쌓기 (1등~99등만)
      rawData.forEach((item: any) => {
        const leagueKey = classMap[item.class_type];
        
        // 매핑 표에 존재하고, 등수가 1등부터 99등 사이인 경우에만 수집
        if (leagueKey && item.rank >= 1 && item.rank <= 99) {
          
          // [핵심 해결책] 만약 해당 리그의 바구니(배열)가 아직 없다면 새로 만들어줍니다.
          if (!leagueGroups[leagueKey]) {
            leagueGroups[leagueKey] = [];
          }
          
          // 이제 안전하게 데이터를 밀어 넣습니다.
          leagueGroups[leagueKey].push(item);
        }
      });

      // 출력을 원하는 리그 순서 정의
      const orderedKeys = [
        'a1', 'a2', 'a3',
        'b1', 'b2', 'b3', 'b4', 'b5',
        'c1', 'c2', 'c3', 'c4', 'c5',
        'd1', 'd2', 'd3', 'd4', 'd5'
      ];

      // 💡 클립보드용 텍스트 조립 (리그별로 대가리 치고 그 아래 1~99등 나열)
      let textToCopy = '';

      orderedKeys.forEach((key) => {
        // 혹시 원본 데이터의 순서가 꼬여있을 수 있으므로 각 리그 안에서 등수(rank)순으로 재정렬
        const sortedUsers = leagueGroups[key].sort((a, b) => a.rank - b.rank);

        textToCopy += `[${key}]\n`;
        
        if (sortedUsers.length === 0) {
          textToCopy += '데이터 없음\n';
        } else {
          sortedUsers.forEach((user) => {
            textToCopy += `${user.rank}위: ${user.unique_id}\n`;
          });
        }
        textToCopy += '\n'; // 리그와 리그 사이 구분을 위한 빈 줄 추가
      });

      // 마지막 불필요한 공백 제거
      textToCopy = textToCopy.trim();

      // 3. 클립보드 복사 실행
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        alert('모든 리그의 1등부터 99등까지의 아이디가 복사되었습니다!');
      } else {
        fallbackCopyTextToClipboard(textToCopy);
      }

    } catch (error) {
      console.error('데이터 처리 중 오류 발생:', error);
      alert('데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 화면 렌더링
  return (
    <div style={{ padding: '20px' }}>
      <button onClick={handleCopyIds} disabled={isLoading}>
        {isLoading ? '가져오는 중...' : '전체 랭크 아이디 복사'}
      </button>
    </div>
  );
}