import { ServiceCardSkeleton } from "@/src/components/main/ServiceCard"

// 카드 본체가 ServiceCard 시안과 같아져서, 로딩 중 레이아웃이 튀지 않도록 스켈레톤도 공유한다
export default function NormalCardSkeleton() {
  return <ServiceCardSkeleton />
}
