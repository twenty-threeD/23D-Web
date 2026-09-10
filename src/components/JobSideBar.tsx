import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { JOB_POST_TYPES } from '@/src/types/jobPost'

const TYPES = [{ label: '전체', value: 'all' }, ...JOB_POST_TYPES]

function SidebarInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('type') ?? 'all'

  return (
    <div className="flex flex-col h-full">
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => router.push(t.value === 'all' ? '/jobs' : `/jobs?type=${t.value}`)}
          className={`px-4 py-2 rounded-lg text-left font-semibold cursor-pointer
            ${current === t.value ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:bg-zinc-100'}
          `}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function JobSidebar() {
  return (
    <div className="flex flex-col w-48 shrink-0 gap-6 sticky top-20 self-start">
      <h1 className="text-xl pb-1 font-semibold border-b-2">구인구직</h1>
      <Suspense fallback={<div className="flex flex-col h-full" />}>
        <SidebarInner />
      </Suspense>
    </div>
  )
}
