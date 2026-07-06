import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = [
  { label: '전체', value: 'all' },
  { label: '이거 궁금해요', value: 'question' },
  { label: '전문가 추천', value: 'expert' },
  { label: '견적 궁금해요', value: 'estimate' },
  { label: '동네 주민', value: 'local' },
]

function SidebarInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? 'all'

  return (
    <div className="flex flex-col h-full">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => router.push(`/community?category=${cat.value}`)}
          className={`px-4 py-2 rounded-lg text-left font-semibold
            ${current === cat.value ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:bg-zinc-100'}
          `}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}

export default function CommunitySidebar() {
  return (
    <div className="flex flex-col w-48 shrink-0 gap-6 sticky top-20 self-start">
      <h1 className="text-xl pb-1 font-semibold border-b-2">커뮤니티</h1>
      <Suspense fallback={<div className="flex flex-col h-full" />}>
        <SidebarInner />
      </Suspense>
    </div>
  )
}