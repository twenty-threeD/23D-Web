---
name: harness
description: 이 저장소(Next.js 16 + React 19 + Tailwind v4)에서 페이지·컴포넌트·lib 코드를 작성하거나 수정할 때 사용한다. AGENTS.md 규칙(마진 금지, 디자인 토큰, Page export, 갑/을 판단, 파일 URL)을 강제한다.
---

# 코드 작성 하네스 (Next.js / React / Tailwind v4)

## 시작 전 (필수)

1. 루트 `AGENTS.md`를 읽는다. 이 파일이 규칙의 단일 출처다(`CLAUDE.md`는 이 파일을 가져오는 포인터).
2. 백엔드 API를 쓰는 작업이면 라이브 스펙을 먼저 확인한다. 기억이나 기존 코드에 의존하지 않는다.
   ```bash
   curl https://api.idta.store/v3/api-docs
   ```
3. 손댈 화면과 비슷한 기존 페이지·컴포넌트(`src/app/**`, `src/components/**`)와 관련 `src/lib/*.ts`를 먼저 읽고, 라운드·보더·타이포·호출 방식을 그대로 따른다.
4. 요청이 규칙과 충돌하면 먼저 지적하고, 사용자가 명시적으로 뒤집지 않는 한 규칙을 따른다.

## 코드 작성 규칙

- **마진 금지**: `m-`, `mt-`, `mb-`, `ml-`, `mr-`, `mx-`, `my-`를 쓰지 않는다. 부모의 `flex`/`grid` + `gap`, 필요하면 `padding`.
- **스타일**: Tailwind v4. 색은 `src/app/globals.css`의 `@theme` 토큰(`main`, `contract` 등)을 쓴다. `tailwind.config.ts`는 적용되지 않으니 수정하지 않는다. 임의값(`bg-[#...]`)은 시안 색을 옮길 때만, 반복되면 토큰으로 올린다.
- **폰트**: Pretendard만 쓴다. 새 폰트를 들이지 않는다.
- **페이지 export**: `src/app/**/page.tsx`는 항상 `export default function Page() { ... }`.
- **API 호출**: 도메인별 `src/lib/<도메인>.ts`에 함수를 두고 컴포넌트에서 가져다 쓴다. 에러 처리는 기존 `apiError.ts` / `useHandleError` 흐름을 따른다.
- **파일·이미지 URL**: 서버가 준 URL은 반드시 `toRelativeUrl()`(`src/lib/file.ts`)을 거친다.
- **갑/을**: `authStore.role`로 판단하지 않는다. `post.member.username === myUsername`이면 을, 아니면 갑.
- **채팅 특수 메시지**: `[채팅 시작]`, `[계약서 제안]`, `[계약서 체결 완료]`, `[결제 완료]` 대괄호 접두사 + JSON 규약을 유지하고 카드로 렌더한다. 새 접두사가 필요하면 먼저 알린다.
- **상태**: 전역 상태는 `src/store/`의 zustand 스토어를 쓴다. 새 스토어를 만들기 전에 기존 스토어로 되는지 확인한다.
- **주석**: 한글로, 무엇이 아니라 **왜**를 쓴다. 우회·예외 처리는 배경을 반드시 남긴다.
- 요청받지 않은 리팩토링·의존성 추가·파일 생성을 하지 않는다.
- 테스트 코드는 사용자가 명시적으로 요청할 때만 작성한다(현재 테스트 하네스 없음).

## 자주 어기는 규칙 (체크리스트)

- [ ] 마진 클래스(`m*-`)가 diff에 없다
- [ ] 새 색이 `@theme` 토큰이거나 시안 색이다
- [ ] `page.tsx` 기본 export가 `function Page()`다
- [ ] 백엔드 파일 URL이 `toRelativeUrl()`을 거친다
- [ ] 갑/을 판단에 `authStore.role`을 쓰지 않았다
- [ ] 모바일 폭에서도 깨지지 않는다(하단바 `BottomNav` 영역 포함)
- [ ] 주석이 한글이고 이유를 적었다

## 마무리

1. `npm run lint`로 린트를 확인한다.
2. 타입·빌드 영향이 있으면 `npm run build`로 확인한다.
3. 생성/수정한 파일 경로를 전부 나열한다.
4. 화면에서 직접 확인하지 못한 부분과 남은 리스크를 한국어로 요약한다.
