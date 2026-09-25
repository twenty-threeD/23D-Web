"use client";

import { useEffect, useRef, useState } from "react";
import { toRelativeUrl } from "@/src/lib/file";

interface ContractPreviewProps {
  contractUrl: string;
  token: string | null;
}

// 백엔드 파일 응답에 X-Frame-Options: DENY 가 붙어 있어 iframe 으로는 PDF 가 뜨지 않는다.
// 그래서 PDF 를 직접 받아 pdf.js 로 캔버스에 그린다. 브라우저 PDF 뷰어의 툴바·회색 배경도 함께 사라진다.
export const ContractPreview = ({ contractUrl, token }: ContractPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !contractUrl) return;
    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        // pdf.js 는 브라우저 전용 API 를 쓰므로 서버 렌더링 때 불러오지 않게 여기서 가져온다
        // 기본 빌드는 Math.sumPrecise·Map.getOrInsertComputed 를 폴리필 없이 써서,
        // 미지원 브라우저에선 워커가 죽고 getDocument 가 끝나지 않아 로딩에서 멈춘다. 폴리필이 든 legacy 빌드를 쓴다.
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const res = await fetch(toRelativeUrl(contractUrl), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`계약서 응답 ${res.status}`);
        const data = new Uint8Array(await res.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;

        const width = container.clientWidth;
        // 레티나 화면에서 글자가 뭉개지지 않도록 기기 픽셀 비율만큼 크게 그린다
        const ratio = window.devicePixelRatio || 1;
        const canvases: HTMLCanvasElement[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.display = "block";
          await page.render({ canvas, viewport }).promise;
          if (cancelled) return;
          canvases.push(canvas);
        }

        container.replaceChildren(...canvases);
        setStatus("done");
      } catch (e) {
        console.error("계약서 미리보기 실패:", e);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contractUrl, token]);

  // 시안대로 높이를 1000px 로 고정하고 A4 페이지를 폭에 꽉 채워 아래를 잘라 보여준다.
  // A4 비율 박스로 두면 PDF 페이지 크기와 미세하게 달라 아래에 빈 띠가 생겼고,
  // 스크롤바가 폭을 차지해 오른쪽에도 여백이 생겨서 스크롤바는 숨기고 스크롤만 살린다.
  return (
    <div className="relative w-full h-250 overflow-y-auto bg-[#faf9f8] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div ref={containerRef} className="flex flex-col" />
      {status !== "done" && (
        <div className="absolute inset-0 flex items-center justify-center text-[14px] font-medium text-ink-hint">
          {status === "loading" ? "계약서를 불러오는 중..." : "계약서를 불러올 수 없습니다."}
        </div>
      )}
    </div>
  );
};
