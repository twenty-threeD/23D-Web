import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"

export interface ContractPdfData {
  clientName: string
  professionalName: string
  startDate: string
  endDate: string
  inspectionDays: string
  serviceContent: string
  price: string
  clientSig: string
  professionalSig: string
}

// A4 (pt)
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 56

const INK = rgb(0.102, 0.153, 0.278) // --color-contract (#1A2747)
const BODY = rgb(0.12, 0.12, 0.14)
const MUTED = rgb(0.45, 0.45, 0.5)

// 나눔고딕(정적 TTF). pdf-lib의 서브셋 기능은 한글 같은 대용량 CJK 폰트에서
// 글자를 대량으로 누락시키므로 subset 없이 통째로 임베드한다.
// 폰트 스트림이 압축되어 실제 PDF는 1MB 이하로 나온다.
const FONT_URL = "/fonts/NanumGothic-Regular.ttf"

// 2MB짜리 파일이라 한 번 받아서 재사용한다.
let fontBytesPromise: Promise<ArrayBuffer> | null = null
function loadFontBytes() {
  if (!fontBytesPromise) {
    fontBytesPromise = fetch(FONT_URL).then((res) => {
      if (!res.ok) throw new Error("계약서 폰트를 불러오지 못했습니다.")
      return res.arrayBuffer()
    })
  }
  return fontBytesPromise
}

function formatDate(value: string) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function formatPrice(value: string) {
  const digits = value.replace(/[^0-9]/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString()
}

// 주어진 폭에 맞게 줄을 나눈다. 한글은 단어 경계가 넓어서 어절 단위로 끊되,
// 한 어절이 폭을 넘으면 글자 단위로 쪼갠다.
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []

  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("")
      continue
    }

    let line = ""
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate
        continue
      }

      if (line) lines.push(line)

      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word
        continue
      }

      // 한 어절이 통째로 폭을 넘으면 글자 단위로 자른다.
      let chunk = ""
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
          lines.push(chunk)
          chunk = ch
        } else {
          chunk += ch
        }
      }
      line = chunk
    }
    lines.push(line)
  }

  return lines
}

// 서명 이미지(data: URL 또는 업로드된 경로)를 PNG 바이트로 가져온다.
async function fetchImageBytes(src: string): Promise<ArrayBuffer | null> {
  if (!src) return null
  try {
    const res = await fetch(src)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export async function buildContractPdf(data: ContractPdfData): Promise<Blob> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(await loadFontBytes(), { subset: false })

  const contentWidth = PAGE_WIDTH - MARGIN * 2
  let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function newPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
  }

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) newPage()
  }

  // Regular 폰트 하나만 임베드하므로, 굵은 글씨는 미세하게 겹쳐 그려서 흉내낸다.
  function drawText(
    text: string,
    x: number,
    yPos: number,
    size: number,
    color = BODY,
    bold = false
  ) {
    page.drawText(text, { x, y: yPos, size, font, color })
    if (bold) page.drawText(text, { x: x + 0.35, y: yPos, size, font, color })
  }

  function drawParagraph(
    text: string,
    size: number,
    lineHeight: number,
    color = BODY,
    bold = false,
    indent = 0
  ) {
    const lines = wrapText(text, font, size, contentWidth - indent)
    for (const line of lines) {
      ensureSpace(lineHeight)
      y -= lineHeight
      if (line) drawText(line, MARGIN + indent, y, size, color, bold)
    }
  }

  function centerText(text: string, size: number, color = INK, bold = false) {
    const width = font.widthOfTextAtSize(text, size)
    drawText(text, (PAGE_WIDTH - width) / 2, y, size, color, bold)
  }

  // 제목
  y -= 34
  centerText("용 역 계 약 서", 22, INK, true)
  y -= 30

  // 서두
  drawParagraph(
    `${data.clientName}과(이하 '갑'이라 한다) ${data.professionalName}은(이하 '을'이라 한다) ` +
      `아래 용역에 관하여 다음과 같이 계약을 체결한다.`,
    10.5,
    17,
    BODY
  )
  y -= 14

  const articles: { title: string; body: string }[] = [
    {
      title: "제 1 조 (용역의 내용)",
      body: data.serviceContent || "본 계약에서 수행하고자 하는 용역의 내용을 명시한다.",
    },
    {
      title: "제 2 조 (용역의 기간)",
      body: `본 용역의 수행 기간은 ${formatDate(data.startDate)} 부터 ${formatDate(data.endDate)} 까지로 하며, 부득이한 사유로 기간을 변경하게 되는 경우 서면으로 합의한다.`,
    },
    {
      title: "제 3 조 (대금 및 지급)",
      body: `1. 계약의 총액은 금 ${formatPrice(data.price)}원으로 하며, 갑이 을에게 지급한다.\n2. 갑은 용역 이행에 대한 검수 후 영업일 기준 3일 이내에 을에게 대금을 지급한다.`,
    },
    {
      title: "제 4 조 (계약 이행 및 검수)",
      body: `1. 을은 용역 제공자로서 제 1조에 명시되어 있는 용역의 내용을 성실히 수행할 의무를 가진다.\n2. 갑은 을이 수행한 용역의 결과에 대해 ${data.inspectionDays}일 이내에 검수 결과를 서면 혹은 전자적 방법으로 통지해야하며, 통지하지 않는 경우 용역 결과를 수용한다는 의미로 간주하고 계약을 종료한다.`,
    },
    {
      title: "제 5 조 (비밀유지)",
      body: "갑과 을 양측은 본 계약을 수행하며 알게된 상대방의 영업비밀 및 영업상의 비밀을 계약을 체결한 이후로 제 3자에게 누설해서는 안된다.",
    },
    {
      title: "제 6 조 (계약해지)",
      body: "갑 또는 을이 본 계약의 내용을 위반하고 이에 대해 상당한 기간을 정하여 시정을 요구했음에도 불구하고 당사자가 시정하지 않는 경우 서면 또는 전자적 방법으로 계약해지를 통지할 수 있다.",
    },
    {
      title: "제 7 조 (분쟁 해결)",
      body: "본 계약과 관련하여 분쟁이 발생하는 경우, 상호 협의로 해결을 우선시 하며 협의가 이루어지지 아니한 경우 서울중앙지방법원을 제1심 관할 법원으로 한다.",
    },
    {
      title: "제 8 조 (지식재산권 이전)",
      body: "본 용역의 수행 과정에서 발생한 결과물에 대한 저작권 등 지식재산권은 갑의 검수 후 즉시 갑에게 귀속된다.",
    },
    {
      title: "제 9 조 (계약의 효력)",
      body: "1. 본 계약은 양 당사자가 서명 또는 기명날인한 날부터 효력을 발생하며, 본 계약서는 갑과 을, 용역 중개 서비스에서 전자적 방법 등으로 보관한다.\n2. 제 5조(비밀유지)에 한해서 계약이 종료된 이후에도 유효하다.",
    },
  ]

  for (const article of articles) {
    ensureSpace(46)
    y -= 18
    drawText(article.title, MARGIN, y, 11, INK, true)
    drawParagraph(article.body, 10, 16, BODY)
  }

  // 서명란은 잘리면 안 되므로 공간이 부족하면 새 페이지에서 시작한다.
  // (날짜 34 + 26 + 라벨 16 + 성명 16 + 서명칸 62 ≒ 154)
  ensureSpace(158)
  y -= 34
  centerText(formatDate(data.startDate), 11, INK, true)
  y -= 26

  const [clientImg, professionalImg] = await Promise.all([
    fetchImageBytes(data.clientSig),
    fetchImageBytes(data.professionalSig),
  ])

  const colWidth = (contentWidth - 28) / 2
  const blockTop = y
  const sigBoxHeight = 62

  const parties: { label: string; name: string; image: ArrayBuffer | null }[] = [
    { label: "갑 (의뢰인)", name: data.clientName, image: clientImg },
    { label: "을 (수행자)", name: data.professionalName, image: professionalImg },
  ]

  for (const [index, party] of parties.entries()) {
    const x = MARGIN + index * (colWidth + 28)
    let cursor = blockTop

    page.drawLine({
      start: { x, y: cursor },
      end: { x: x + colWidth, y: cursor },
      thickness: 1.4,
      color: INK,
    })

    cursor -= 16
    drawText(party.label, x, cursor, 10.5, INK, true)

    cursor -= 16
    drawText(`성명(기업명)  ${party.name}`, x, cursor, 9.5, MUTED)

    cursor -= sigBoxHeight
    if (party.image) {
      try {
        const png = await doc.embedPng(party.image)
        const scale = Math.min(colWidth / png.width, sigBoxHeight / png.height, 1)
        page.drawImage(png, {
          x,
          y: cursor + (sigBoxHeight - png.height * scale) / 2,
          width: png.width * scale,
          height: png.height * scale,
        })
      } catch {
        // 서명 이미지를 못 읽으면 이름만 남긴다.
      }
    }
  }

  y = blockTop - 32 - sigBoxHeight

  const bytes = await doc.save()
  return new Blob([bytes as BlobPart], { type: "application/pdf" })
}

export function pdfBlobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: "application/pdf" })
}
