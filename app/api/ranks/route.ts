import { NextResponse } from 'next/server';

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

