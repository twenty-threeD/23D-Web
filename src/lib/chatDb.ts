// 채팅 메시지 로컬 캐시 (IndexedDB)
//
// 서버가 메시지를 DB 에 영구 저장하므로 여기는 진실 원본이 아니라 "렌더 캐시"다.
// 방 진입 시 네트워크를 기다리지 않고 바로 그리기 위해서만 쓰며, 언제 지워져도
// 커서 페이지네이션으로 서버에서 다시 받아오면 된다. "로컬에 없으면 에러" 같은 분기를 만들지 않는다.

const DB_NAME = '23d-chat'
// v3: messageId 가 방별 카운터에서 전역 PK 로 바뀌었다.
// 예전 캐시의 id 를 after/cursor 로 보내면 엉뚱한 구간이 돌아오므로 기존 스토어를 버리고 새로 만든다.
const DB_VERSION = 3
const STORE = 'messages'
const ROOM_INDEX = 'roomId'

// 캐시가 실제로 필요로 하는 최소 형태. 나머지 필드는 그대로 통과시킨다.
export interface ChatMessageKey {
  // 전역 PK. 정렬·중복 제거·after/cursor 기준이다.
  messageId?: number | null
  roomId: number
  createdAt: string // ISO-8601
}

export interface CachedMessage extends ChatMessageKey {
  [key: string]: unknown
}

// IndexedDB 는 브라우저에만 있다. 서버 렌더링 중에는 캐시를 건너뛴다.
function isAvailable() {
  return typeof indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE)
      // roomId 기준으로 정리해야 해서 roomId 인덱스를 둔다
      const store = db.createObjectStore(STORE, { keyPath: 'messageId' })
      store.createIndex(ROOM_INDEX, 'roomId', { unique: false })
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

// 방 하나의 캐시된 메시지를 messageId 오름차순으로 반환
export async function getCachedMessages(roomId: number): Promise<CachedMessage[]> {
  if (!isAvailable()) return []

  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const index = tx.objectStore(STORE).index(ROOM_INDEX)
    const req = index.getAll(IDBKeyRange.only(roomId))

    const rows = await new Promise<CachedMessage[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as CachedMessage[])
      req.onerror = () => reject(req.error)
    })

    // createdAt 은 같은 시각이 겹칠 수 있어 전역 PK 로 정렬한다
    return rows.sort((a, b) => (a.messageId as number) - (b.messageId as number))
  } finally {
    db.close()
  }
}

// 메시지를 캐시에 upsert 한다 (messageId 가 같으면 덮어쓴다)
export async function cacheMessages<T extends ChatMessageKey>(messages: T[]): Promise<void> {
  if (!isAvailable() || messages.length === 0) return

  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    for (const message of messages) {
      // id 없는 메시지는 키를 만들 수 없다. 다음 동기화 때 서버에서 id 와 함께 다시 온다.
      if (message?.messageId == null) continue
      store.put(message)
    }
    await done(tx)
  } finally {
    db.close()
  }
}

// clearBefore 이전(같은 시각 포함) 메시지를 지운다.
// 방을 나갔다가 다시 들어왔을 때 예전 대화가 남지 않게 하는 핵심 로직.
export async function clearMessagesBefore(roomId: number, clearBefore: string | null): Promise<void> {
  if (!isAvailable() || !clearBefore) return

  const threshold = Date.parse(clearBefore)
  if (Number.isNaN(threshold)) return

  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const index = tx.objectStore(STORE).index(ROOM_INDEX)
    const req = index.openCursor(IDBKeyRange.only(roomId))

    // ISO 문자열을 그대로 비교하지 않고 파싱해서 비교한다.
    // 서버와 로컬의 타임존 표기나 밀리초 자릿수가 달라도 안전하게 하기 위함.
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return
      const row = cursor.value as CachedMessage
      if (Date.parse(row.createdAt) <= threshold) cursor.delete()
      cursor.continue()
    }

    await done(tx)
  } finally {
    db.close()
  }
}

// 여러 방의 clearBefore 를 한 번에 정리 (GET /api/chat/rooms 응답용).
// 방마다 DB 를 여닫으면 목록이 길어질수록 느려져서, 한 트랜잭션에서 전부 처리한다.
export async function clearRoomsBefore(
  rooms: { roomId: number; clearBefore?: string | null }[]
): Promise<void> {
  if (!isAvailable()) return

  // 나간 적 있는 방만 대상이다 (clearBefore 가 null 이면 지울 게 없다)
  const targets = rooms
    .map((room) => ({ roomId: room.roomId, threshold: Date.parse(room.clearBefore ?? '') }))
    .filter((t) => t.roomId != null && !Number.isNaN(t.threshold))

  if (targets.length === 0) return

  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const index = tx.objectStore(STORE).index(ROOM_INDEX)

    for (const { roomId, threshold } of targets) {
      const req = index.openCursor(IDBKeyRange.only(roomId))
      req.onsuccess = () => {
        const cursor = req.result
        if (!cursor) return
        const row = cursor.value as CachedMessage
        if (Date.parse(row.createdAt) <= threshold) cursor.delete()
        cursor.continue()
      }
    }

    await done(tx)
  } finally {
    db.close()
  }
}

// 방 하나의 캐시를 통째로 비운다
export async function deleteRoomCache(roomId: number): Promise<void> {
  if (!isAvailable()) return

  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const index = tx.objectStore(STORE).index(ROOM_INDEX)
    const req = index.openCursor(IDBKeyRange.only(roomId))

    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return
      cursor.delete()
      cursor.continue()
    }

    await done(tx)
  } finally {
    db.close()
  }
}
