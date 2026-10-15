// 헤더가 있는 모든 페이지가 같이 쓰는 본문 여백. 페이지마다 값이 달라 화면을 옮길 때마다 본문 시작선이 흔들렸다.
//
// 좌우: 휴대폰·패드는 헤더(px-5 md:px-10)와 같게, 데스크톱은 헤더(xl:px-[120px])보다 안쪽(160px)으로 들여
//       로고·메뉴 줄보다 본문이 한 단계 안에서 시작하게 한다
// 위아래: 데스크톱 64px, 그보다 좁으면 32px
//
// Tailwind 는 소스에 그대로 적힌 클래스만 만들어서 조합하지 않고 통째로 적는다
export const PAGE_X = 'px-5 md:px-10 xl:px-40'
export const PAGE_Y = 'py-8 xl:py-16'
export const PAGE_PADDING = 'px-5 md:px-10 xl:px-40 py-8 xl:py-16'
// 채팅처럼 화면 높이를 꽉 채우는 페이지는 아래 여백 없이 위만 띄운다
export const PAGE_TOP = 'pt-8 xl:pt-16'
