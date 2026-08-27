"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPostCategories, type PostCategory } from '@/src/lib/post'

function SidebarInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? 'all'
  const [categories, setCategories] = useState<PostCategory[]>([])

  useEffect(() => {
    getPostCategories().then(setCategories).catch(() => {})
  }, [])

  const items = [
    { label: '전체', value: 'all' },
    ...categories.map((c) => ({ label: c.name, value: String(c.id) })),
  ]

  return (
    <div className="flex flex-col h-full">
      {items.map((cat) => (
        <button
          key={cat.value}
          onClick={() => router.push(`/jobs?category=${cat.value}`)}
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
