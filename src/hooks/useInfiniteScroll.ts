import { useEffect, useRef } from "react";

// 목록 끝에 둔 요소(sentinel)가 화면 가까이 오면 다음 페이지를 부른다.
//
// - 끝에 닿기 전에 미리 받아 두어야 스크롤이 멈추지 않아서, 화면 아래 600px 앞에서부터 부른다
// - IntersectionObserver 는 보이기 시작할 때만 알려 준다. 한 페이지를 받아도 화면이 커서 끝이 계속 보이면
//   다시 알려 주지 않으므로, 목록 길이(itemCount)가 바뀔 때마다 새로 관찰해 처음 상태를 다시 받는다
// - onLoadMore 는 렌더마다 새로 만들어져 관찰을 다시 걸지 않게 ref 로 최신 값만 들고 있는다
export function useInfiniteScroll({
  enabled,
  itemCount,
  onLoadMore,
}: {
  enabled: boolean;
  itemCount: number;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!enabled || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current();
      },
      { rootMargin: "0px 0px 600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, itemCount]);

  return sentinelRef;
}
