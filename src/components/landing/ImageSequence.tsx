"use client"

import { useRef, type ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { quadTransform, type Quad } from "@/src/lib/perspective"
import { emitLetterbox } from "@/src/lib/letterbox"

// 조각 위치의 기준이 되는 페이지 크기. idta.store/main 을 1512px 폭으로 찍어 푸터 위(1800px)까지 쓴다.
// 화면을 다시 찍으면 이 값과 page.tsx 의 조각 좌표를 함께 맞춘다
const PAGE_WIDTH = 1512
const PAGE_HEIGHT = 1800

export interface SequenceScreen {
  /** 조각이 빠진 페이지 뼈대 */
  base: string
  /**
   * 마지막 프레임 원본(1280x720) 좌표계에서 화면 네 모서리.
   * 좌상 → 우상 → 우하 → 좌하 순서다.
   */
  corners: Quad
  /**
   * 노트북이 보이는 동안 화면을 따라가게 하는 프레임별 화면 네 모서리(원본 좌표, 순서는 corners 와 같다).
   * from 번째 프레임(1부터)부터 마지막 프레임까지 한 프레임에 하나씩 있다.
   * 없으면 영상이 다 끝난 뒤에 화면이 켜진다.
   */
  track?: {
    from: number
    quads: Quad[]
    /** 화면 앞을 가리는 물체의 오른쪽 경계(원본 x). from 번째 프레임부터 차례로, 가리지 않는 프레임은 생략한다 */
    clipLeft?: number[]
  }
}

export interface ShowcaseStep {
  title: string
  description: string
  /** 페이지에서 떼어낸 조각 이미지 */
  src: string
  /** 그 조각이 페이지(1512x1800) 안에서 차지하는 자리 */
  rect: { x: number; y: number; width: number }
}

interface ImageSequenceProps {
  /** 프레임 번호(1부터)를 받아 경로를 만든다 */
  frameUrl: (index: number) => string
  frameCount: number
  /** 마지막 프레임의 기기 화면에 얹을 페이지 */
  screen?: SequenceScreen
  /**
   * 프레임 위에 얹을 문구. 낱말 단위로 넘겨야 좌우로 펼쳐진다.
   * (Fragment 로 묶어 넘기면 한 덩어리가 되어 붙어 버린다)
   */
  caption?: string[]
  /** 페이지가 자리를 잡은 뒤 왼쪽에 나타날 제목 */
  finale?: ReactNode
  /** 제목 아래에서 스크롤에 따라 하나씩 짚어줄 조각들 */
  steps?: ShowcaseStep[]
}

gsap.registerPlugin(useGSAP, ScrollTrigger)

// 구간별로 쓸 스크롤 길이(px). 감이 안 맞으면 이 값만 만지면 된다.
const FRAME_LENGTH = 1800 // 프레임 재생
const SCREEN_FADE_LENGTH = 400 // 노트북 화면 켜기 (track 이 있으면 화면이 이미 켜져 있어 잠깐 머무는 구간이 된다)
// 화면이 처음 켜질 때 이 프레임 수에 걸쳐 밝아진다
const TRACK_FADE_FRAMES = 1
const SETTLE_LENGTH = 900 // 사진 걷어내고 페이지를 카드로 앉히기
const STEP_LENGTH = 700 // 조각 하나를 짚는 구간
// 문구·레터박스가 물러나는 구간(px). 이 구간에서는 영상이 아직 첫 프레임에 멈춰 있다.
const CAPTION_EXIT_LENGTH = 400
// 이만큼 스크롤하면 물러나기 시작한다. 이후는 헤더와 같은 300ms 전환에 맡긴다.
const CAPTION_EXIT_TRIGGER = 80

// 화면 이미지를 그릴 기준 너비. 변환 전 해상도라 넉넉히 잡아야 글자가 뭉개지지 않는다.
const SCREEN_BASE_WIDTH = 1400
// 이 폭보다 좁으면 휴대폰 배치(글 위, 카드 아래)로 앉힌다. Tailwind md 와 같은 값이다
const MOBILE_BREAKPOINT = 768
// 세로 화면에서 노트북이 화면 폭의 이 비율 안에 들어오도록 줌아웃한다
const MOBILE_LAPTOP_FILL = 0.9

const DARK = "#13110F"
const LIGHT = "#FFFFFF"

// 걷히기 시작하면 배경은 곧바로 흰색이 된다.
// 그전까지는 사진이 화면을 덮고 있어 배경색이 보이지 않으므로, 빨리 바꿔야 회색 테두리가 안 생긴다.
const BACKGROUND_TURN = 0.05
// 모서리가 둥글어지는 데 쓰는 구간
const RADIUS_TURN = 0.15
// 사진은 거의 다 줄어든 뒤에야 사라진다. 일찍 흐려지면 줄어드는 내내 뿌옇게 뜬다.
const PHOTO_FADE_START = 0.65
// 카드로 앉았을 때 모서리 반경
const SETTLED_RADIUS = 28
// 아래 레터박스 높이. 위 레터박스인 헤더(h-16)와 같은 두께로 맞춘다.
const LETTERBOX_HEIGHT = "h-16"


// 스크롤에 맞춰 낱장 프레임을 canvas 로 갈아 끼우는 시퀀스 뷰어.
// 원본은 AVIF 이미지 시퀀스인데, img 로 넣으면 브라우저가 제멋대로 재생해 버려
// 스크롤 위치에 맞춰 세울 수가 없다. 그래서 프레임을 낱장 webp 로 뽑아 직접 그린다.
//
// 한 번 고정(pin)된 채로 네 가지가 이어서 일어난다.
//  1) 프레임 재생 — 카메라가 노트북으로 들어온다
//  2) 노트북 화면에 페이지 띄우기 — 화면이 눕혀진 사다리꼴이라 matrix3d 로 같은 기울기를 준다
//  3) 사진을 가장자리부터 잘라 지우고, 남은 화면을 기울기 없는 오른쪽 카드로 옮긴다
//  4) 같은 화면에서 카드 안 조각을 하나씩 짚으며 왼쪽에 설명을 연다
export default function ImageSequence({
  frameUrl,
  frameCount,
  screen,
  caption,
  finale,
  steps = [],
}: ImageSequenceProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const screenClipRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const finaleRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLImageElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const pieceRefs = useRef<(HTMLImageElement | null)[]>([])

  const stepCount = steps.length
  const captionLength = caption?.length ? CAPTION_EXIT_LENGTH : 0
  const scrollLength =
    captionLength + FRAME_LENGTH + SCREEN_FADE_LENGTH + SETTLE_LENGTH + STEP_LENGTH * stepCount

  useGSAP(
    () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      const section = sectionRef.current
      if (!canvas || !ctx || !section) return

      // 구간 경계를 전체 대비 비율로 바꿔둔다. 문구가 다 빠진 다음에 영상이 돈다.
      const captionEnd = captionLength / scrollLength
      const frameEnd = captionEnd + FRAME_LENGTH / scrollLength
      const screenFadeEnd = frameEnd + SCREEN_FADE_LENGTH / scrollLength
      const settleEnd = screenFadeEnd + SETTLE_LENGTH / scrollLength

      // 스크롤 도중에 네트워크를 타면 프레임이 빈 채로 지나가므로 전부 미리 받아둔다.
      const frames = Array.from({ length: frameCount }, (_, i) => {
        const image = new Image()
        image.src = frameUrl(i + 1)
        return image
      })

      const lastFrame = frames[frameCount - 1]
      const mixColor = gsap.utils.interpolate(DARK, LIGHT)
      const settleEase = gsap.parseEase("power2.inOut")
      const zoomEase = gsap.parseEase("power1.inOut")
      let progress = 0
      let activeStep = -1
      let letterboxGone = false

      // 프레임을 화면 어디에 얼마나 크게 그릴지. 캔버스와 노트북 화면 위치가 같은 계산을 써야 어긋나지 않는다.
      //
      // 가로 화면은 object-cover 처럼 꽉 채운다. 세로 화면(휴대폰)에서 꽉 채우면 노트북 양옆이 잘려서,
      // 프레임이 진행될수록 노트북이 화면 폭에 들어오게 줄이고 노트북을 가운데로 데려온다.
      // 줄어들며 생기는 위아래 빈자리는 섹션 배경(어두운색)이 메워 영화 레터박스처럼 보인다.
      function frameGeometry(viewWidth: number, viewHeight: number, phase: number) {
        const frameWidth = lastFrame?.naturalWidth || 1280
        const frameHeight = lastFrame?.naturalHeight || 720
        const cover = Math.max(viewWidth / frameWidth, viewHeight / frameHeight)

        let scale = cover
        let focusX = frameWidth / 2
        let focusY = frameHeight / 2
        if (screen) {
          const xs = screen.corners.map(([x]) => x)
          const ys = screen.corners.map(([, y]) => y)
          const laptopWidth = Math.max(...xs) - Math.min(...xs)
          const fit = Math.min(cover, (viewWidth * MOBILE_LAPTOP_FILL) / laptopWidth)
          const t = zoomEase(phase)
          scale = gsap.utils.interpolate(cover, fit, t)
          focusX = gsap.utils.interpolate(focusX, (Math.max(...xs) + Math.min(...xs)) / 2, t)
          focusY = gsap.utils.interpolate(focusY, (Math.max(...ys) + Math.min(...ys)) / 2, t)
        }

        // 초점을 화면 가운데에 두되, 그림이 화면보다 크면 가장자리가 비지 않게 붙잡는다
        const place = (view: number, size: number, focus: number) =>
          size >= view ? gsap.utils.clamp(view - size, 0, view / 2 - focus * scale) : (view - size) / 2

        return {
          scale,
          offsetX: place(viewWidth, frameWidth * scale, focusX),
          offsetY: place(viewHeight, frameHeight * scale, focusY),
        }
      }

      // 진행률에 해당하는 프레임 번호(1부터). 사진과 노트북 화면이 반드시 같은 번호를 쓰도록 여기서만 정한다
      function frameNumber(phase: number) {
        return 1 + Math.round(phase * (frameCount - 1))
      }

      function paintFrame(index: number, phase: number) {
        const image = frames[index]
        if (!canvas || !ctx || !image?.complete || image.naturalWidth === 0) return

        // 기하는 CSS 픽셀로 구하고, 캔버스는 기기 픽셀이라 비율만큼 키워 그린다
        const ratio = canvas.width / canvas.getBoundingClientRect().width
        const { scale, offsetX, offsetY } = frameGeometry(canvas.width / ratio, canvas.height / ratio, phase)

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(
          image,
          offsetX * ratio,
          offsetY * ratio,
          image.naturalWidth * scale * ratio,
          image.naturalHeight * scale * ratio
        )
      }

      // 지금 그려진 프레임(1부터)에서 잰 노트북 화면의 네 모서리(원본 좌표).
      // 프레임 사이를 보간하면 사진은 한 장씩 바뀌는데 화면만 미끄러져 어긋나 보여서, 사진과 같은 프레임 값을 그대로 쓴다
      function screenCorners(frame: number): Quad {
        const track = screen?.track
        if (!screen) return []
        if (!track) return screen.corners
        return track.quads[gsap.utils.clamp(0, track.quads.length - 1, frame - track.from)]
      }

      // 노트북 화면 원본 좌표를 화면에 보이는 CSS 좌표로 옮긴다 (캔버스와 같은 기하).
      // phase 가 1 이면 마지막 프레임, 그 전이면 그 순간 노트북이 있는 자리다
      function laptopQuad(viewWidth: number, viewHeight: number, phase = 1): Quad | null {
        if (!screen || !lastFrame?.naturalWidth) return null

        const { scale, offsetX, offsetY } = frameGeometry(viewWidth, viewHeight, phase)
        return screenCorners(frameNumber(phase)).map(([x, y]) => [offsetX + x * scale, offsetY + y * scale]) as Quad
      }

      // 다 끝난 뒤 페이지가 앉을 자리. 왼쪽은 글, 오른쪽은 카드인 배치다.
      function settledQuad(viewWidth: number, viewHeight: number): Quad {
        // 휴대폰은 글을 위에 두고 카드를 아래에 앉힌다. 좌우 여백은 다른 페이지와 같은 20px 이다
        if (viewWidth < MOBILE_BREAKPOINT) {
          const width = viewWidth - 40
          const height = Math.min(width, viewHeight * 0.46)
          const top = viewHeight - height - 24
          return [
            [20, top],
            [20 + width, top],
            [20 + width, top + height],
            [20, top + height],
          ]
        }

        const gutter = gsap.utils.clamp(24, 80, viewWidth * 0.06)
        const width = Math.min(viewWidth * 0.46, 720)
        const height = Math.min(width, viewHeight - gutter * 2)
        const left = viewWidth - gutter - width
        const top = (viewHeight - height) / 2

        return [
          [left, top],
          [left + width, top],
          [left + width, top + height],
          [left, top + height],
        ]
      }

      // 조각은 페이지가 다 앉은 뒤부터 짚는다. 그전에는 전부 제자리에 그대로 있어 페이지가 온전해 보인다.
      function markStep(index: number) {
        if (index === activeStep) return
        activeStep = index

        itemRefs.current.forEach((item, i) => {
          if (item) item.dataset.active = String(i === index)
        })
        pieceRefs.current.forEach((piece, i) => {
          if (piece) piece.dataset.state = index < 0 ? "idle" : i === index ? "active" : "muted"
        })
        // 뼈대(헤더·검색·섹션 제목)도 같이 가라앉아야 짚는 조각만 도드라진다.
        if (baseRef.current) baseRef.current.dataset.state = index < 0 ? "idle" : "muted"
      }

      function render() {
        if (!canvas || !section) return

        const view = canvas.getBoundingClientRect()
        // 문구 구간에서는 첫 프레임에 멈춰 있다.
        const framePhase = gsap.utils.clamp(
          0,
          1,
          (progress - captionEnd) / (frameEnd - captionEnd)
        )
        paintFrame(frameNumber(framePhase) - 1, framePhase)

        // 따라갈 자료가 있으면 노트북이 가림 없이 보이는 프레임부터 화면을 켠다
        const frame = frameNumber(framePhase)
        const screenAlpha = screen?.track
          ? gsap.utils.clamp(0, 1, (frame - screen.track.from) / TRACK_FADE_FRAMES)
          : gsap.utils.clamp(0, 1, (progress - frameEnd) / (screenFadeEnd - frameEnd))
        // 사진이 걷히는 정도. 0 이면 노트북 그대로, 1 이면 페이지만 카드로 남는다.
        const settle = settleEase(
          gsap.utils.clamp(0, 1, (progress - screenFadeEnd) / (settleEnd - screenFadeEnd))
        )

        // 사진이 흰 바탕 위에서 줄어들도록, 배경은 걷히기 시작할 때 빠르게 흰색이 된다.
        section.style.backgroundColor = mixColor(gsap.utils.clamp(0, 1, settle / BACKGROUND_TURN))

        const start = laptopQuad(view.width, view.height, framePhase)

        // 노트북 앞을 기둥이 가리는 프레임에서는 기둥 경계 왼쪽을 잘라, 화면이 기둥 뒤에 있는 것처럼 보이게 한다
        if (screenClipRef.current) {
          const track = screen?.track
          const clipX = track?.clipLeft?.[frame - track.from]
          if (clipX === undefined || settle > 0) {
            screenClipRef.current.style.clipPath = "none"
          } else {
            const { scale, offsetX } = frameGeometry(view.width, view.height, framePhase)
            screenClipRef.current.style.clipPath = `inset(0 0 0 ${offsetX + clipX * scale}px)`
          }
        }
        const box = screenRef.current
        if (box && start) {
          const end = settledQuad(view.width, view.height)
          const quad = start.map(([x, y], i) => [
            gsap.utils.interpolate(x, end[i][0], settle),
            gsap.utils.interpolate(y, end[i][1], settle),
          ]) as Quad

          // 상자의 가로세로 비율을 지금 그려질 사다리꼴과 맞춰야 안의 페이지가 늘어나 보이지 않는다.
          // 카드로 갈수록 세로로 길어져 페이지가 더 많이 보인다.
          const aspect = (q: Quad) =>
            Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]) / Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1])
          const baseHeight = Math.round(
            SCREEN_BASE_WIDTH * gsap.utils.interpolate(aspect(start), aspect(end), settle)
          )

          box.style.width = `${SCREEN_BASE_WIDTH}px`
          box.style.height = `${baseHeight}px`
          box.style.transform = quadTransform(SCREEN_BASE_WIDTH, baseHeight, quad)
          box.style.opacity = String(screenAlpha)
          // 노트북 화면일 때는 각진 채로, 카드가 되면서 모서리가 둥글어진다.
          box.style.borderRadius = `${settle * SETTLED_RADIUS}px`

          // 사진은 가장자리부터 화면 크기까지 잘라 들어가며 사라진다.
          const left = Math.min(start[0][0], start[3][0])
          const right = Math.max(start[1][0], start[2][0])
          const top = Math.min(start[0][1], start[1][1])
          const bottom = Math.max(start[2][1], start[3][1])
          const inset = (from: number, to: number) => gsap.utils.interpolate(from, to, settle)

          // 줄어드는 사진도 카드처럼 모서리가 둥글어진다.
          const clipRadius = gsap.utils.clamp(0, 1, settle / RADIUS_TURN) * SETTLED_RADIUS
          canvas.style.clipPath = `inset(${inset(0, top)}px ${inset(0, view.width - right)}px ${inset(
            0,
            view.height - bottom
          )}px ${inset(0, left)}px round ${clipRadius}px)`
          canvas.style.opacity = String(
            1 - gsap.utils.clamp(0, 1, (settle - PHOTO_FADE_START) / (1 - PHOTO_FADE_START))
          )
        }

        // 문구·레터박스는 스크롤에 물려 끌려가는 대신, 헤더와 똑같이 한 번에 물러난다.
        // (헤더는 opacity + translate 를 300ms 에 걸쳐 바꾼다. 같은 전환을 아래 띠에도 건다)
        if (captionRef.current) {
          const gone = progress > CAPTION_EXIT_TRIGGER / scrollLength
          captionRef.current.dataset.gone = String(gone)
          // 위 띠인 헤더도 같은 순간에 같이 물러나야 한다.
          if (gone !== letterboxGone) {
            letterboxGone = gone
            emitLetterbox(!gone)
          }
        }
        if (finaleRef.current) finaleRef.current.style.opacity = String(settle)

        if (stepCount > 0) {
          const stepPhase = (progress - settleEnd) / (1 - settleEnd)
          markStep(stepPhase < 0 ? -1 : Math.min(Math.floor(stepPhase * stepCount), stepCount - 1))
        }
      }

      function resize() {
        if (!canvas) return
        const view = canvas.getBoundingClientRect()
        // 레티나에서 뭉개지지 않게 실제 픽셀로 잡되, 3배 이상은 비용만 커서 2배로 자른다.
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.round(view.width * ratio)
        canvas.height = Math.round(view.height * ratio)
        render()
      }

      resize()
      // 프레임이 아직 안 받아졌을 수 있으니 도착하면 한 번 더 그린다.
      frames[0].onload = render
      lastFrame.onload = render

      // 섹션이 들어올 때 문구가 아래에서 한 줄씩 올라온다 (스크롤과 무관하게 한 번만).
      if (captionRef.current && wordRefs.current.length > 0) {
        gsap.from(wordRefs.current.filter(Boolean), {
          yPercent: 110,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
        })
      }

      const state = { value: 0 }
      gsap.to(state, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${scrollLength}`,
          pin: true,
          scrub: 0.5,
        },
        onUpdate: () => {
          progress = state.value
          render()
        },
      })

      // 첫 화면에서는 헤더가 위 띠 역할을 하도록 켜둔 상태로 시작한다.
      emitLetterbox(true)

      window.addEventListener("resize", resize)
      return () => {
        window.removeEventListener("resize", resize)
        emitLetterbox(false)
      }
    },
    { scope: sectionRef, dependencies: [frameCount, scrollLength, stepCount, captionLength] }
  )

  return (
    <div ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-night">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {caption?.length ? (
        <div
          ref={captionRef}
          data-gone="false"
          // 문구는 레터박스 바로 위에 얹고, 둘이 한 덩어리로 같이 빠져나간다.
          // 사라지는 방식은 헤더와 같다 — 같은 300ms 동안 아래로 밀리며 흐려진다.
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col transition-all duration-300 data-[gone=true]:translate-y-full data-[gone=true]:opacity-0"
        >
          <div className="flex items-end justify-between px-5 pb-6 text-4xl font-extrabold tracking-tight text-white md:px-20 md:pb-8 md:text-7xl">
            {/* 글자가 아래에서 솟아오르게 보이도록 한 낱말씩 가려둔다 */}
            {caption.map((word, i) => (
              <span key={word + i} className="block overflow-hidden pb-1">
                <span
                  ref={(el) => {
                    wordRefs.current[i] = el
                  }}
                  className="block"
                >
                  {word}
                </span>
              </span>
            ))}
          </div>

          {/* 아래 레터박스. 블러만 건다 */}
          <div className={`${LETTERBOX_HEIGHT} backdrop-blur-lg`} />
        </div>
      ) : null}

      {(finale || stepCount > 0) && (
        // 휴대폰은 카드가 아래 절반을 차지해서 글을 헤더 아래 위쪽에 붙인다
        <div ref={finaleRef} className="absolute inset-0 flex items-start px-5 pt-20 opacity-0 md:items-center md:px-20 md:pt-0">
          <div className="flex w-full max-w-xl flex-col gap-5 md:w-1/2 md:gap-10">
            {finale}

            {stepCount > 0 && (
              <ul className="flex flex-col">
                {steps.map((step, i) => (
                  <li
                    key={step.title}
                    ref={(el) => {
                      itemRefs.current[i] = el
                    }}
                    data-active="false"
                    className="group flex flex-col gap-1.5 border-t border-zinc-200 py-3 last:border-b md:gap-3 md:py-6"
                  >
                    <h3 className="text-lg font-bold text-zinc-300 transition-colors duration-500 group-data-[active=true]:text-black md:text-2xl">
                      {step.title}
                    </h3>
                    {/* 높이를 0fr → 1fr 로 바꿔 설명이 부드럽게 열린다 (margin 없이 접었다 펴는 방법) */}
                    <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-data-[active=true]:grid-rows-[1fr]">
                      <p className="overflow-hidden text-sm text-zinc-500 opacity-0 md:text-base transition-opacity duration-500 group-data-[active=true]:opacity-100">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {screen && (
        // 기둥에 가려지는 프레임에서 화면 왼쪽을 잘라 내는 틀. 원근 변환이 걸린 상자 바깥에 둬야 화면 좌표로 자를 수 있다
        <div ref={screenClipRef} className="pointer-events-none absolute inset-0">
        <div
          ref={screenRef}
          // transform 기준점을 좌상단으로 두어야 matrix3d 가 계산한 자리에 그대로 앉는다.
          className="pointer-events-none absolute top-0 left-0 origin-top-left shadow-lg overflow-hidden opacity-0"
        >
          {/* 세로로 긴 페이지를 위에서부터 보여준다. 조각 좌표를 %로 쓰기 위한 기준 상자이기도 하다 */}
          <div className="relative w-full" style={{ aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}` }}>
            {/* 원근 변환(matrix3d) 상자 안에서 % 좌표로 겹쳐 놓는 그림이라 고정 크기를 받는 next/image 와 맞지 않는다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={baseRef}
              src={screen.base}
              alt=""
              data-state="idle"
              className="absolute inset-0 h-full w-full transition-opacity duration-500 ease-out data-[state=muted]:opacity-35"
            />

            {steps.map((step, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={step.title}
                ref={(el) => {
                  pieceRefs.current[i] = el
                }}
                src={step.src}
                alt=""
                data-state="idle"
                style={{
                  left: `${(step.rect.x / PAGE_WIDTH) * 100}%`,
                  top: `${(step.rect.y / PAGE_HEIGHT) * 100}%`,
                  width: `${(step.rect.width / PAGE_WIDTH) * 100}%`,
                }}
                className="absolute origin-center transition-all duration-500 ease-out data-[state=muted]:opacity-35 data-[state=active]:scale-[1.04] data-[state=active]:drop-shadow-[0_10px_24px_rgba(24,24,27,.18)]"
              />
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
