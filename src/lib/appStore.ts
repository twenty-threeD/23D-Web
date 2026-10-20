// 원스토어의 잇다 앱 상세 페이지 주소. 랜딩 다운로드 버튼과 QR 코드가 같이 쓴다.
// 주소가 바뀌면 QR 이미지(public/landing/onestore-qr.svg)도 다시 만든다:
//   npx -y qrcode -t svg -e M -o public/landing/onestore-qr.svg "<주소>"
export const ONESTORE_URL = "https://m.onestore.co.kr/v2/ko-kr/app/0001010735"

export const ONESTORE_QR = "/landing/onestore-qr.svg"
