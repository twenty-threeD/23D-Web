// 검색엔진·AI 검색·링크 미리보기에 쓰는 사이트 기본 정보.
// 메타데이터, sitemap, robots, 구조화 데이터가 모두 여기를 보므로 문구·주소는 이 파일에서만 고친다
export const SITE_URL = "https://www.idta.store"
export const SITE_NAME = "잇다"
export const SITE_NAME_EN = "ITDA"
export const SITE_TITLE = "잇다 - 블록체인 기반 용역 중개 플랫폼"
export const SITE_DESCRIPTION =
  "이사·청소, 설치·수리, 인테리어, 외주, 과외까지 필요한 순간 필요한 능력자를 찾는 용역 중개 플랫폼입니다. 채팅·영상통화로 상담하고, 계약서는 블록체인에 기록되며, 대금은 안전하게 보관했다가 정산합니다."
export const SITE_KEYWORDS = [
  "잇다",
  "ITDA",
  "용역 중개",
  "능력자 찾기",
  "프리랜서",
  "외주",
  "블록체인 계약",
  "전자계약",
  "안전결제",
  "이사 청소",
  "설치 수리",
  "인테리어",
  "과외",
]

// 서버에서 서비스·커뮤니티 글을 읽을 때 쓰는 백엔드 주소. 브라우저와 달리 Next rewrites 프록시를 거치지 않는다
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "https://api.idta.store"

export const SOCIAL_LINKS = ["https://www.instagram.com/idta.blockchain/", "https://github.com/twenty-threeD/"]

// 페이지마다 openGraph 를 새로 쓰면 부모 값이 통째로 바뀌어 사이트 이름·언어·대표 이미지가 빠진다. 공통값은 여기서 펼쳐 쓴다.
// 대표 이미지는 src/app/opengraph-image.jpg 이고, 글 이미지가 있는 페이지는 뒤에서 images 로 덮어쓴다
export const OPEN_GRAPH_BASE = { type: "website", locale: "ko_KR", siteName: SITE_NAME, images: ["/opengraph-image.jpg"] }
