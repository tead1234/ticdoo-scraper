import RankIdCopier from './components/RankIdCopier';

export default function Home() {
  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f9f9f9',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
          틱두 랭킹 아이디 추출기
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          버튼을 누르면 전체 랭크 아이디가 클립보드에 복사됩니다.
        </p>

        {/* 여기서 아까 만든 버튼 부품을 불러와서 화면에 보여줍니다 */}
        <RankIdCopier />

      </div>
    </main>
  );
}