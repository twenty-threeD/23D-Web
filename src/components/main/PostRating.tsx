"use client"

import { useEffect, useRef, useState } from "react"
import { getReviews, REVIEW_UPDATED_EVENT, summarizePostReviews } from "@/src/lib/review"
import { useAuthStore } from "@/src/store/authStore"

export default function PostRating({ postId }: { postId: number }) {
  const ratingRef = useRef<HTMLSpanElement>(null)
  const token = useAuthStore((state) => state.accessToken)
  const [result, setResult] = useState<{ postId: number; rating: string } | null>(null)

  useEffect(() => {
    const element = ratingRef.current
    if (!element) return

    let active = true
    let hasLoaded = false
    const loadRating = () => {
      hasLoaded = true
      getReviews(postId, token)
        .then((reviews) => {
          if (!active) return
          setResult({ postId, rating: summarizePostReviews(reviews).averageRating.toFixed(1) })
        })
        .catch(() => {
          if (active) setResult({ postId, rating: "-" })
        })
    }
    const handleReviewUpdated = (event: Event) => {
      const updatedPostId = (event as CustomEvent<{ postId?: number }>).detail?.postId
      if (hasLoaded && (!updatedPostId || updatedPostId === postId)) loadRating()
    }

    window.addEventListener(REVIEW_UPDATED_EVENT, handleReviewUpdated)

    // 화면에 보이지 않는 카드까지 리뷰 페이지를 요청하지 않도록 가까운 카드부터 읽는다
    if (typeof IntersectionObserver === "undefined") {
      loadRating()
      return () => {
        active = false
        window.removeEventListener(REVIEW_UPDATED_EVENT, handleReviewUpdated)
      }
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      loadRating()
    }, { rootMargin: "160px" })

    observer.observe(element)
    return () => {
      active = false
      observer.disconnect()
      window.removeEventListener(REVIEW_UPDATED_EVENT, handleReviewUpdated)
    }
  }, [postId, token])

  return <span ref={ratingRef}>{result?.postId === postId ? result.rating : "-"}</span>
}
