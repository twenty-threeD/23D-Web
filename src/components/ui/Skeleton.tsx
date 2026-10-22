// 웨이브 스켈레톤 블록 하나. 크기·라운드만 className 으로 주면 된다(색·애니메이션은 globals.css 의 .skeleton)
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />
}
