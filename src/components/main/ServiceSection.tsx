"use client";

import { Children, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode, type PointerEvent, type MouseEvent, type DragEvent, type RefObject } from "react";
import Link from "next/link";
import { LeftRightIcon } from "@/src/components/main/icons";
import ServiceCard, { ServiceCardSkeleton } from "@/src/components/main/ServiceCard";
import type { Post } from "@/src/lib/post";
import { PAGE_X } from "@/src/lib/layout";

// 메인과 서비스 상세 하단이 같은 카드 줄 시안을 써서 한 곳으로 모았다

export function MoreLink() {
  return (
    <Link href="/more" className="text-sm font-medium text-ink-muted underline hover:text-main transition-colors">
      더보기
    </Link>
  );
}

// 가로 스크롤은 트랙패드·휠로만 넘어가 마우스 사용자는 목록을 움직일 수 없었다.
// 끌어서 넘길 수 있게 하되, 끈 뒤에 카드 링크 클릭이 발생하지 않도록 이동량이 있으면 클릭을 막는다
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    drag.current = { active: true, startX: e.clientX, startLeft: ref.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !ref.current) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    ref.current.scrollLeft = d.startLeft - dx;
  };
  const end = () => { drag.current.active = false; };
  const onClickCapture = (e: MouseEvent) => {
    if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; }
  };

  return {
    ref,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerLeave: end, onClickCapture, onDragStart: (e: DragEvent) => e.preventDefault() },
  };
}

// 카드 줄은 좌우 같은 여백에서 잘리도록 섹션 양쪽에 동일한 여백을 준다
// 카드 줄도 다른 본문과 같은 좌우 여백에서 시작하고 잘리게 한다
export const SECTION_INSET = PAGE_X;

const ROW_CLASS = "flex overflow-x-auto cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

type DragScroll = ReturnType<typeof useDragScroll>;

function ScrollRow({ children, gap, scrollRef, handlers, className = "" }: { children: ReactNode; gap: string; scrollRef: RefObject<HTMLDivElement | null>; handlers: DragScroll["handlers"]; className?: string }) {
  return <div ref={scrollRef} {...handlers} className={`${ROW_CLASS} ${gap} ${className}`}>{children}</div>;
}

// 휴대폰은 카드가 한 장씩만 보여 다음 카드가 있다는 걸 알기 어렵다. 휴대폰 폭에서만 일정 간격으로 다음 카드로 넘긴다.
// - 손으로 넘기는 중에 움직이면 손가락과 싸우게 되므로, 만지는 동안은 멈추고 손을 뗀 뒤 한 간격을 쉬고 다시 시작한다
// - 손으로 넘기다 카드 중간에 멈췄을 수 있어 한 칸 너비를 더하지 않고 다음 카드의 시작 위치로 맞춘다
// - 마지막 카드에서는 처음으로 돌아간다 (순환 줄이면 마지막이 없어 계속 다음으로 간다)
const MOBILE_QUERY = "(max-width: 767px)";

function subscribeMobile(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// 서버 렌더에서는 넓은 화면으로 보고 그린다. 순환용 복제 카드를 처음부터 그리면 서버·브라우저 화면이 달라진다
function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false);
}

function useMobileAutoSlide(ref: RefObject<HTMLDivElement | null>, intervalMs?: number) {
  useEffect(() => {
    const el = ref.current;
    if (!intervalMs || !el) return;
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let paused = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;

    const pause = () => { paused = true; clearTimeout(resumeTimer); };
    const resume = () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, intervalMs);
    };

    const next = () => {
      if (paused || document.hidden || !mobile.matches || reducedMotion.matches) return;
      if (el.scrollWidth <= el.clientWidth) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      const rowLeft = el.getBoundingClientRect().left;
      const target = Array.from(el.children)
        .map((child) => child.getBoundingClientRect().left - rowLeft + el.scrollLeft)
        .find((left) => left > el.scrollLeft + 4);
      el.scrollTo({ left: atEnd || target === undefined ? 0 : target, behavior: "smooth" });
    };

    const timer = setInterval(next, intervalMs);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);
    el.addEventListener("touchcancel", resume);
    return () => {
      clearInterval(timer);
      clearTimeout(resumeTimer);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
      el.removeEventListener("touchcancel", resume);
    };
  }, [ref, intervalMs]);
}

// 카드 묶음을 세 벌 이어 그리고 가운데 벌을 보여 준다. 넘기다 앞·뒤 벌로 넘어가면, 멈춘 뒤
// 같은 카드가 있는 가운데 벌 위치로 순간 이동해 끝없이 이어지는 것처럼 보이게 한다.
// - 스크롤이 움직이는 중(관성·부드러운 이동 포함)이나 손가락이 닿아 있는 동안 옮기면 이동이 끊기므로, 멈춘 뒤에만 옮긴다
// - 세 벌 모두 같은 카드 배치라 한 벌 너비만큼 옮기면 화면이 그대로다
const LOOP_COPIES = 3;
const LOOP_SETTLE_MS = 150;

function useLoopRecenter(ref: RefObject<HTMLDivElement | null>, enabled: boolean, count: number) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el || count < 2) return;
    const setWidth = () => {
      const first = el.children[0];
      const nextSet = el.children[count];
      return first && nextSet ? nextSet.getBoundingClientRect().left - first.getBoundingClientRect().left : 0;
    };
    el.scrollLeft = setWidth();

    let touching = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const recenter = () => {
      const width = setWidth();
      if (touching || !width) return;
      if (el.scrollLeft < width - 2) el.scrollLeft += width;
      else if (el.scrollLeft >= width * 2 - 2) el.scrollLeft -= width;
    };
    const onScroll = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(recenter, LOOP_SETTLE_MS);
    };
    const onTouchStart = () => { touching = true; };
    const onTouchEnd = () => { touching = false; onScroll(); };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      clearTimeout(settleTimer);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [ref, enabled, count]);
}

// 휴대폰에서 카드가 한 장씩 보이는 줄은 손으로 넘기다 카드 중간에 멈추면 두 카드가 반씩 걸쳐 보인다.
// 손을 떼면 가장 가까운 카드 시작 위치에 붙고, 세게 밀어도 한 장씩만 넘어가게 한다.
// 넓은 화면은 마우스로 끌어 넘기는데 스냅이 있으면 끄는 도중 위치가 튀어서 휴대폰 폭에만 건다
const MOBILE_SNAP_CLASS = "max-md:snap-x max-md:snap-mandatory max-md:*:snap-start max-md:*:snap-always";

// 시안의 좌우 화살표 아이콘(한 장짜리 svg) 위에 투명 버튼 두 개를 겹쳐 조작한다
// 광고처럼 제목이 카드 줄 위에 오는 섹션은 header 로 넘겨 화살표와 같은 줄에 놓는다
// autoSlideMs: 휴대폰 폭에서 이 간격마다 다음 카드로 넘긴다 (넓은 화면에는 영향 없음)
// snapMobile: 휴대폰 폭에서 스와이프 후 카드 시작 위치에 붙인다
// loopMobile: 휴대폰 폭에서 마지막 카드 다음에 첫 카드가 이어지게 순환한다. 실제 카드가 2장 이상일 때만 켠다
export function CardRow({ children, gap, header, autoSlideMs, snapMobile = false, loopMobile = false }: { children: ReactNode; gap: string; header?: ReactNode; autoSlideMs?: number; snapMobile?: boolean; loopMobile?: boolean }) {
  const { ref, handlers } = useDragScroll();
  const isMobile = useIsMobile();
  const items = Children.toArray(children);
  const loop = loopMobile && isMobile && items.length > 1;
  useMobileAutoSlide(ref, autoSlideMs);
  useLoopRecenter(ref, loop, items.length);
  const scroll = (dir: -1 | 1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  // 복제 카드를 감싸면 스냅·위치 계산이 감싼 요소 기준이 되어 어긋나므로, 감싸지 않고 key 만 바꿔 그대로 복제한다
  const rendered = loop
    ? Array.from({ length: LOOP_COPIES }, (_, copy) =>
        items.map((item) => (isValidElement(item) ? cloneElement(item, { key: `${copy}:${item.key}` }) : item))
      ).flat()
    : children;

  return (
    <div className={`flex flex-col flex-1 min-w-0 ${header ? "gap-5" : "gap-3"}`}>
      {/* 휴대폰은 손가락으로 넘기면 되어 화살표를 숨긴다. 제목도 없으면 이 줄 자체가 빈 줄이라 같이 숨긴다 */}
      <div className={`${header ? "flex" : "hidden md:flex"} items-end justify-between gap-3`}>
        {header ?? <span />}
        <div className="hidden md:block relative w-16 h-6 shrink-0">
          <LeftRightIcon className="size-full" />
          <button type="button" aria-label="이전" onClick={() => scroll(-1)} className="absolute left-0 top-0 size-6 cursor-pointer" />
          <button type="button" aria-label="다음" onClick={() => scroll(1)} className="absolute right-0 top-0 size-6 cursor-pointer" />
        </div>
      </div>
      <ScrollRow gap={gap} scrollRef={ref} handlers={handlers} className={snapMobile ? MOBILE_SNAP_CLASS : ""}>{rendered}</ScrollRow>
    </div>
  );
}

export function Empty() {
  return <p className="text-sm text-ink-muted py-10">등록된 항목이 없습니다</p>;
}

export default function ServiceSection({ title, loading, posts, inset = SECTION_INSET }: { title: [string, string]; loading: boolean; posts: Post[]; inset?: string }) {
  return (
    <section className={`flex flex-col md:flex-row gap-6 md:gap-12 w-full ${inset}`}>
      {/* 데스크톱은 카드 줄 왼쪽에 두 줄 제목을 세우고, 휴대폰은 카드 위에 한 줄 제목과 더보기를 나란히 둔다 */}
      <div className="flex md:flex-col items-end md:items-start gap-3 shrink-0 md:w-32 md:pt-2.5">
        <h2 className="text-2xl md:text-[28px] font-bold text-ink leading-tight">
          {title[0]}<span className="md:hidden"> </span><br className="hidden md:block" />{title[1]}
        </h2>
        <div className="flex"><MoreLink /></div>
      </div>
      <CardRow gap="gap-9">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          : posts.length > 0
            ? posts.map((post) => <ServiceCard key={post.id} post={post} />)
            : <Empty />}
      </CardRow>
    </section>
  );
}
