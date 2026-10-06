# Pokemon 30 Stock Radar

포켓몬 30주년 기념상품 편의점 재고 레이더입니다.

- Node.js + Express
- 5분 주기 데이터 갱신 구조
- CU / GS25 / 7-ELEVEN / EMART24 어댑터 자리
- Telegram 신규 재고 알림
- PokeConv는 공개 참고 링크로만 사용

## 주의
비공개 API 우회나 가짜 재고를 사용하지 않습니다. 공식/허가된 데이터 소스가 있을 때 환경변수에 연결합니다.

## 실행
npm install
npm start

## Telegram
TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID를 호스팅 서비스 환경변수에 입력하세요.