import imageCompression from 'browser-image-compression'

// 백엔드(FileService)가 받는 종류. Tika 로 MIME 을 판별해 확장자와 대조하므로
// 변환 후에는 파일명 확장자도 같이 바꿔야 한다.
const UPLOADABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const HEIF_TYPES = new Set(['image/heic', 'image/heif'])
const HEIF_EXTENSION = /\.(heic|heif)$/i

export class HeifConversionError extends Error {
  constructor(fileName: string) {
    super(`${fileName}: HEIF 사진을 업로드용 형식으로 변환하지 못했어요. JPG, PNG 또는 WEBP로 저장한 뒤 다시 선택해주세요.`)
    this.name = 'HeifConversionError'
  }
}

export function isHeifFile(file: File) {
  return HEIF_TYPES.has(file.type.toLowerCase()) || HEIF_EXTENSION.test(file.name)
}

// 업로드 전에 줄일 기준. 서비스에서 쓰는 가장 큰 자리가 풀스크린 배너라
// 레티나까지 감안해도 1600px 이면 충분하다.
const MAX_WIDTH = 1600
const MAX_SIZE_MB = 1
const QUALITY = 0.8

function toWebpName(name: string) {
  const dot = name.lastIndexOf('.')
  return `${dot > 0 ? name.slice(0, dot) : name}.webp`
}

function toJpegName(name: string) {
  const dot = name.lastIndexOf('.')
  return `${dot > 0 ? name.slice(0, dot) : name}.jpg`
}

async function convertHeifToJpeg(file: File): Promise<File> {
  try {
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const jpeg = Array.isArray(converted) ? converted[0] : converted
    if (!jpeg) throw new Error('HEIF 이미지에서 사진을 찾을 수 없습니다.')

    return new File([jpeg], toJpegName(file.name), {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    })
  } catch {
    // HEIF 원본은 브라우저 미리보기 호환성이 낮아 변환 실패를 사용자에게 구분해 알린다.
    throw new HeifConversionError(file.name)
  }
}

/**
 * HEIF 는 브라우저 호환 형식으로 바꾼 뒤 webp 로 줄이고, 그 외(PDF 등)는 그대로 돌려준다.
 *
 * 압축은 실패해도 업로드 자체를 막지 않는다 — 원본으로 올리면 되기 때문이다.
 * 백엔드가 받지 않는 형식은 원본으로 올려도 거부되므로 변환된 JPEG를 대신 올린다.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') && !isHeifFile(file)) return file

  // HEIF 는 브라우저 이미지 압축기가 디코딩하지 못하는 경우가 있어 먼저 JPEG 로 바꾼다.
  const imageFile = isHeifFile(file) ? await convertHeifToJpeg(file) : file

  try {
    const compressed = await imageCompression(imageFile, {
      maxWidthOrHeight: MAX_WIDTH,
      maxSizeMB: MAX_SIZE_MB,
      initialQuality: QUALITY,
      fileType: 'image/webp',
      useWebWorker: true,
    })

    // 원본이 이미 더 작으면 굳이 바꾸지 않는다 (백엔드가 받는 형식일 때만).
    if (compressed.size >= imageFile.size && UPLOADABLE.has(imageFile.type)) return imageFile

    return new File([compressed], toWebpName(imageFile.name), {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  } catch {
    return imageFile
  }
}
