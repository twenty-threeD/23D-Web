import imageCompression from 'browser-image-compression'

// 백엔드(FileService)가 받는 종류. Tika 로 MIME 을 판별해 확장자와 대조하므로
// 변환 후에는 파일명 확장자도 같이 바꿔야 한다.
const UPLOADABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

// 업로드 전에 줄일 기준. 서비스에서 쓰는 가장 큰 자리가 풀스크린 배너라
// 레티나까지 감안해도 1600px 이면 충분하다.
const MAX_WIDTH = 1600
const MAX_SIZE_MB = 1
const QUALITY = 0.8

function toWebpName(name: string) {
  const dot = name.lastIndexOf('.')
  return `${dot > 0 ? name.slice(0, dot) : name}.webp`
}

/**
 * 이미지면 webp 로 줄여서 돌려주고, 그 외(PDF 등)는 그대로 돌려준다.
 *
 * 압축은 실패해도 업로드 자체를 막지 않는다 — 원본으로 올리면 되기 때문이다.
 * 다만 백엔드가 받지 않는 형식(HEIC, GIF 등)은 원본으로 올려도 어차피 거부되므로,
 * 변환에 성공하면 그 파일들도 같이 구제된다.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: MAX_WIDTH,
      maxSizeMB: MAX_SIZE_MB,
      initialQuality: QUALITY,
      fileType: 'image/webp',
      useWebWorker: true,
    })

    // 원본이 이미 더 작으면 굳이 바꾸지 않는다 (백엔드가 받는 형식일 때만).
    if (compressed.size >= file.size && UPLOADABLE.has(file.type)) return file

    return new File([compressed], toWebpName(file.name), {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}
