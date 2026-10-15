"use client";

import { useEffect, useRef, type ReactNode, type PointerEvent, type MouseEvent, type DragEvent, type RefObject } from "react";
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

function ScrollRow({ children, gap, scrollRef, handlers }: { children: ReactNode; gap: string; scrollRef: RefObject<HTMLDivElement | null>; handlers: DragScroll["handlers"] }) {
  return <div ref={scrollRef} {...handlers} className={`${ROW_CLASS} ${gap}`}>{children}</div>;
}

// 휴대폰은 카드가 한 장씩만 보여 다음 카드가 있다는 걸 알기 어렵다. 휴대폰 폭에서만 일정 간격으로 다음 카드로 넘긴다.
// - 손으로 넘기는 중에 움직이면 손가락과 싸우게 되므로, 만지는 동안은 멈추고 손을 뗀 뒤 한 간격을 쉬고 다시 시작한다
// - 손으로 넘기다 카드 중간에 멈췄을 수 있어 한 칸 너비를 더하지 않고 다음 카드의 시작 위치로 맞춘다
// - 마지막 카드에서는 처음으로 돌아간다
const MOBILE_QUERY = "(max-width: 767px)";

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

// 시안의 좌우 화살표 아이콘(한 장짜리 svg) 위에 투명 버튼 두 개를 겹쳐 조작한다
// 광고처럼 제목이 카드 줄 위에 오는 섹션은 header 로 넘겨 화살표와 같은 줄에 놓는다
// autoSlideMs: 휴대폰 폭에서 이 간격마다 다음 카드로 넘긴다 (넓은 화면에는 영향 없음)
export function CardRow({ children, gap, header, autoSlideMs }: { children: ReactNode; gap: string; header?: ReactNode; autoSlideMs?: number }) {
  const { ref, handlers } = useDragScroll();
  useMobileAutoSlide(ref, autoSlideMs);
  const scroll = (dir: -1 | 1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

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
      <ScrollRow gap={gap} scrollRef={ref} handlers={handlers}>{children}</ScrollRow>
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
