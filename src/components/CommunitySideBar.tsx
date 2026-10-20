import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { COMMUNITY_CATEGORIES } from '@/src/lib/community'

const CATEGORIES = [{ label: '전체', value: 'all' }, ...COMMUNITY_CATEGORIES]

function SidebarInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? 'all'

  return (
    // 휴대폰에서는 사이드바가 본문 위로 올라가므로 카테고리를 한 줄 가로 스크롤 탭으로 편다
    <div className="flex md:flex-col md:h-full gap-1 md:gap-0 overflow-x-auto [scrollbar-width:none]">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() =>
            router.push(cat.value === 'all' ? '/community' : `/community?category=${cat.value}`)
          }
          className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-left font-semibold cursor-pointer
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
    <div className="flex flex-col w-full md:w-48 shrink-0 gap-3 md:gap-6 md:sticky md:top-20 md:self-start">
      <h1 className="text-xl pb-1 font-semibold border-b-2">커뮤니티</h1>
      <Suspense fallback={<div className="flex flex-col h-full" />}>
        <SidebarInner />
      </Suspense>
    </div>
  )
}
