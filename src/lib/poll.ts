// 주기적으로 서버를 다시 조회하되, 탭이 숨겨진 동안에는 건너뛴다.
// 아무도 보지 않는 탭에서 몇 초마다 요청을 보낼 이유가 없고, 다시 보이는 순간 한 번 바로 받아 밀린 내용을 맞춘다
export function pollWhileVisible(run: () => void, intervalMs: number): () => void {
  const intervalId = window.setInterval(() => {
    if (!document.hidden) run()
  }, intervalMs)

  const onVisibilityChange = () => {
    if (!document.hidden) run()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    window.clearInterval(intervalId)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
