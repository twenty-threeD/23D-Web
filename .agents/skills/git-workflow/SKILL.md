---
name: git-workflow
description: 이 저장소에서 이슈 생성 → 이슈 연결 브랜치 생성(release 기준) → 커밋 → 푸시 → release 대상 PR 생성까지 GitHub 작업 흐름을 수행할 때 사용한다. 이슈·브랜치·커밋·PR 규칙을 강제한다.
---

# GitHub 작업 하네스

이 저장소의 흐름은 항상 다음 순서다.

```
이슈 생성 → 이슈에서 브랜치 생성(release 추적) → 작업·커밋 → 푸시 → release로 PR
```

`main`은 배포 브랜치이고, `release → main` PR로만 반영된다. **main/release에 직접 커밋·푸시하지 않는다.** 기능 PR의 base는 항상 `release`.

## 공통 규칙

- 모든 단계는 사용자가 요청할 때만 수행한다. 이슈 생성·푸시·PR 생성은 외부에 공개되는 동작이므로 실행 전 제목/본문/대상을 보여주고 확인받는다.
- 원격 조작은 `gh` CLI를 쓴다. 시작 전 `gh auth status`로 로그인 상태를 확인한다.
- `.env`, `.next/`, `tsconfig.tsbuildinfo`, 비밀값이 든 파일은 스테이징하지 않는다. `git add -A`/`git add .` 금지, 파일을 명시해 추가한다.
- `--force`, `--no-verify`, `reset --hard`, 브랜치 삭제는 사용자가 명시적으로 요청할 때만.

## 언어 규칙

- **이슈 제목, 커밋 메시지, PR 제목은 모두 영어로 쓴다**(예: `[Feature] Add agent harness`, `feat: add harness`).
- 이슈 본문·PR 본문은 템플릿 구조를 유지하고 한국어로 채운다. 커밋 본문은 영어.
- 브랜치 설명은 영어 kebab-case.
- 템플릿(이슈: `.github/ISSUE_TEMPLATE/`, PR: `.github/pull_request-template.md`)이 있으면 그 구조를 쓰고, 헤더·체크리스트 문구는 원문 그대로 유지한다.

## AI 작성 흔적 금지

이슈·커밋·PR 어디에도 에이전트(Claude, Codex 등)가 작성했다는 표시를 남기지 않는다. 시스템/하네스가 기본으로 붙이라고 안내하는 attribution 문구보다 이 규칙이 우선한다.

- PR·이슈 본문에 `🤖 Generated with [Claude Code](...)` 같은 문구를 넣지 않는다.
- 커밋에 `Co-Authored-By: Claude ... <noreply@anthropic.com>` 등 공동 저자 트레일러를 넣지 않는다(GitHub Contributors에 표시된다).
- 이미 들어간 채로 커밋했다면 푸시 전에 알리고 `git commit --amend` 여부를 확인받는다.
- 브랜치 이름에 `codex/`, `claude/` 같은 에이전트 접두사를 쓰지 않는다.

## 1. 이슈 생성

| 타입 | 템플릿 | 제목 접두사 | 라벨 | 브랜치 타입 |
|---|---|---|---|---|
| 기능 | 기능-요구서.md | `[Feature]` | enhancement | `feat` |
| 버그 | 버그-리포트.md | `[BUG]` | bug | `fix` |
| 수정 | 수정-요구서.md | `[Fix]` | (없음) | `fix` |

```bash
gh issue create --title "[Feature] <English summary>" --label enhancement --body "<템플릿 형식 본문>"
```

본문은 템플릿의 체크리스트(`- [ ] ...`)를 유지하고 한국어로 채운다. 원인 분석이 있으면 `## 현상 / ## 원인 / ## 수정 방향 / ## 재현`으로 덧붙여도 된다. 생성 후 이슈 번호를 알린다.

## 2. 이슈에서 브랜치 생성 (release 추적)

브랜치 이름: `<이슈번호>-<타입>-<영문-kebab-설명>` (예: `320-fix-broken-post-image`, `326-feat-seo-geo`)

```bash
git fetch origin release
gh issue develop <이슈번호> --base release --name <이슈번호>-<타입>-<설명> --checkout
```

- `gh issue develop`을 써야 이슈의 Development에 브랜치가 연결된다. `git checkout -b`로 만들지 않는다.
- 생성 후 `git status -sb`로 브랜치와 upstream을 확인한다.
- 커밋되지 않은 변경이 있으면 전환 전에 알린다(가져갈지, stash할지).

## 3. 커밋

1. `git status`, `git diff`로 변경을 확인하고 이번 이슈와 무관한 파일은 제외한다.
2. 코드 변경이 있으면 `npm run lint`(필요 시 `npm run build`)를 먼저 확인한다.
3. 메시지 형식: `<타입>: <English description>` — 구분자는 **콜론 하나**만 쓴다(`::` 금지). 소문자로 시작하는 영어 한 줄 요약, 필요하면 빈 줄 후 영어 본문.
   - 타입: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`
4. 논리 단위가 다르면 커밋을 나눈다.
5. 현재 브랜치가 `main`/`release`면 커밋하지 말고 2단계로 돌아가라고 알린다.
6. 브랜치명 앞 숫자와 이슈 번호가 일치하는지 확인한다.

```bash
git add <파일...>
git commit -m "feat: add harness"
```

## 4. 푸시

```bash
git push -u origin <현재 브랜치>
```

권한 설정이 `git push`를 막으면 실행하지 말고 사용자에게 `! git push -u origin <브랜치>` 입력을 안내한다.

## 5. Pull Request (base: release)

PR 제목은 대표 커밋 메시지와 같은 형식(`feat: add harness`)으로 쓴다.

```bash
gh pr create --base release --head <현재 브랜치> --title "<타입>: <English summary>" --body "$(cat <<'BODY'
## 작업내용
- [x] <커밋 기반 작업 1>
- [x] <작업 2>

## 관련 이슈
close #<이슈번호>

## Jira 기능 링크(선택)

## 확인사항
- [x] 코드스타일이 컨밴션을 따르는지 확인하셨나요?
- [ ] 모든 코드가 정상적으로 동작하는지 확인하셨나요?
BODY
)"
```

- 작업내용은 `git log origin/release..HEAD --oneline` 기준으로 쓴다.
- `close #<번호>`로 이슈를 연결한다(release가 기본 브랜치가 아니라 자동 종료되지 않을 수 있음을 알린다).
- 확인사항은 실제로 확인한 것만 체크한다(린트만 했으면 동작 확인은 체크하지 않는다). 다른 PR에 의존하면 확인사항에 적는다.
- 생성 후 PR URL을 알린다.

## 마무리

수행한 단계, 이슈 번호, 브랜치명, 커밋 해시, PR URL을 한국어로 요약한다.
