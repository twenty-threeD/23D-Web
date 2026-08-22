import { useRouter } from "next/navigation"
import { useAuthStore } from "@/src/store/authStore"
import { useToast } from "./useToast"
import { ApiError, isPayloadTooLarge } from "@/src/lib/apiError"
import { ensureAccessToken } from "@/src/lib/session"

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
        router.push("/login/signin")
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
