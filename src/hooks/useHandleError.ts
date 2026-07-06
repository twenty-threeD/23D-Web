import { useRouter } from "next/navigation"
import { useAuthStore } from "@/src/store/authStore"
import { useToast } from "./useToast"
import { ApiError } from "@/src/lib/apiError"

export function useHandleError() {
  const router = useRouter()
  const token = useAuthStore((s) => s.accessToken)
  const clear = useAuthStore((s) => s.clear)
  const { addToast } = useToast()

  return (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      if (token) {
        clear()
        router.push("/login/signin")
        return
      }
    }
    addToast({
      message: e instanceof Error ? e.message : "오류가 발생했습니다.",
      type: "error",
    })
  }
}
