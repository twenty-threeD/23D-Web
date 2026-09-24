import Link from "next/link"
import { IoChevronBack, IoChevronForward } from "react-icons/io5"

// 목록은 주소(?page=)로 페이지를 옮겨 새로고침·뒤로가기가 되게 하고,
// 상세의 관련 게시물은 읽던 글을 벗어나지 않도록 화면 안에서만 페이지를 바꾼다.
type CommunityPaginationProps = {
  page: number
  totalPages: number
} & (
  | { hrefFor: (page: number) => string; onChange?: never }
  | { onChange: (page: number) => void; hrefFor?: never }
)

const arrowClass = "flex items-center justify-center size-8 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer"

function numberClass(active: boolean) {
  return `flex items-center justify-center size-8 rounded-lg text-sm font-semibold cursor-pointer
    ${active ? "bg-main text-white" : "text-zinc-500 hover:bg-zinc-100"}`
}

function PageLink({ to, active, className, label, hrefFor, onChange, children }: {
  to: number
  active?: boolean
  className: string
  label?: string
  hrefFor?: (page: number) => string
  onChange?: (page: number) => void
  children: React.ReactNode
}) {
  const current = active ? "page" : undefined
  if (hrefFor) {
    return <Link href={hrefFor(to)} className={className} aria-label={label} aria-current={current}>{children}</Link>
  }
  return (
    <button type="button" onClick={() => onChange?.(to)} className={className} aria-label={label} aria-current={current}>
      {children}
    </button>
  )
}

export default function CommunityPagination({ page, totalPages, hrefFor, onChange }: CommunityPaginationProps) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const nav = { hrefFor, onChange }

  return (
    <nav className="flex items-center justify-center gap-1 py-4">
      {page > 1 && (
        <PageLink {...nav} to={page - 1} className={arrowClass} label="이전 페이지">
          <IoChevronBack />
        </PageLink>
      )}
      {pages.map((p) => (
        <PageLink {...nav} key={p} to={p} active={p === page} className={numberClass(p === page)}>
          {p}
        </PageLink>
      ))}
      {page < totalPages && (
        <PageLink {...nav} to={page + 1} className={arrowClass} label="다음 페이지">
          <IoChevronForward />
        </PageLink>
      )}
    </nav>
  )
}
