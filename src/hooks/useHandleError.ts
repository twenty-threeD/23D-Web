import { useRouter } from "next/navigation"
import { useAuthStore } from "@/src/store/authStore"
import { useToast } from "./useToast"
import { ApiError, isPayloadTooLarge } from "@/src/lib/apiError"
import { ensureAccessToken } from "@/src/lib/session"
import { signinPath } from "@/src/lib/navigation"

export function useHandleError() {
  const router = useRouter()
  const token = useAuthStore((s) => s.accessToken)
  const clear = useAuthStore((s) => s.clear)
  const { addToast } = useToast()

  return async (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      if (token) {
        // 액세스 토큰이 만료된 경우이므로 먼저 재발급을 시도한다
        const reissued = await ensureAccessToken()
        if (reissued) {
          addToast({ message: "다시 시도해주세요.", type: "error" })
          return
        }
        clear()
        // push 로 쌓으면 뒤로가기 할 때마다 로그인 화면으로 되돌아온다.
        // 세션이 끊긴 화면은 히스토리에 남길 이유가 없으므로 replace 로 치환한다.
        router.replace(signinPath())
        return
      }
    }
    if (isPayloadTooLarge(e)) {
      addToast({ message: "파일은 최대 25MB까지 업로드할 수 있어요.", type: "error" })
      return
    }
    addToast({
      message: e instanceof Error ? e.message : "오류가 발생했습니다.",
      type: "error",
    })
  }
}
