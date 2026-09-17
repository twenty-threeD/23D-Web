// 채팅 메시지 로컬 캐시 (IndexedDB)
//
// 서버는 최근 3일치 메시지만 갖고 있어서, 그보다 오래된 대화는 여기 캐시에만 남는다.
// 그래서 서버 응답과 머지할 때 "서버에 없으면 지운다"를 하면 안 된다.
// 대신 방을 나갔던 시각(clearBefore)을 기준으로만 지운다.

const DB_NAME = '23d-chat'
// v2: 키를 서버 messageId 에서 cacheKey(방·시각·보낸이·본문) 로 바꿨다.
// 서버 메시지는 Redis 에 TTL 3일로만 있어서 messageId 가 영구적으로 유일하다는 보장이 없고
// (만료 후 재사용·방별 시퀀스 등), 실시간 수신분은 messageId 가 비어 오기도 한다.
// messageId 를 키로 쓰면 새 메시지가 옛 메시지를 덮어쓰거나 아예 저장되지 않아,
// 3일이 지나면 서버에서 빠지는 순서대로 대화가 하나씩 사라졌다.
const DB_VERSION = 2
const STORE = 'messages'
const ROOM_INDEX = 'roomId'

// 캐시가 실제로 필요로 하는 최소 형태. 나머지 필드는 그대로 통과시킨다.
export interface ChatMessageKey {
  // 캐시 키로는 쓰지 않는다 (DB_VERSION 주석 참고). 화면에서 쓰니 값은 그대로 보관한다.
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

// 같은 메시지가 REST 와 STOMP 로 두 번 들어와도 한 줄로 합쳐지도록 서버 id 없이 만든다.
// createdAt 은 경로마다 밀리초 자릿수가 달라서 문자열 대신 파싱한 값을 쓴다.
function cacheKeyOf(message: ChatMessageKey): string | null {
  const time = Date.parse(message.createdAt)
  if (message.roomId == null || Number.isNaN(time)) return null
  const row = message as CachedMessage
  return [message.roomId, time, String(row.senderUsername ?? ''), String(row.message ?? '')].join('|')
}

// 기본 저장소는 best-effort 라 디스크가 부족하면 브라우저가 묻지 않고 지운다.
// 서버는 3일치만 갖고 있어서 여기가 지워지면 과거 대화를 되살릴 방법이 없으므로 영구 저장을 요청한다.
// 브라우저가 거절할 수 있고(Chrome 은 사용 빈도로 판단, Firefox 는 사용자에게 물음) 실패해도 캐시는 그대로 쓴다.
let persistRequested = false
function requestPersistentStorage() {
  if (persistRequested) return
  persistRequested = true
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return
  void navigator.storage
    .persisted()
    .then((already) => (already ? true : navigator.storage.persist()))
    .catch(() => {})
}

function openDb(): Promise<IDBDatabase> {
  requestPersistentStorage()
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (event) => {
      const db = req.result
      const tx = req.transaction!

      const createStore = () => {
        // roomId 기준으로 정리해야 해서 roomId 인덱스를 둔다
        const store = db.createObjectStore(STORE, { keyPath: 'cacheKey' })
        store.createIndex(ROOM_INDEX, 'roomId', { unique: false })
        return store
      }

      if (!db.objectStoreNames.contains(STORE)) {
        createStore()
        return
      }

      // v1(messageId 키) 에 남아 있는 대화를 버리지 않고 새 키로 옮긴다
      if (event.oldVersion < 2) {
        const getAll = tx.objectStore(STORE).getAll()
        getAll.onsuccess = () => {
          const rows = getAll.result as CachedMessage[]
          db.deleteObjectStore(STORE)
          const store = createStore()
          for (const row of rows) {
            const cacheKey = cacheKeyOf(row)
            if (cacheKey) store.put({ ...row, cacheKey })
          }
        }
      }
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

// 방 하나의 캐시된 메시지를 시간순으로 반환
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

    return rows.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  } finally {
    db.close()
  }
}

// 서버에서 받은 메시지를 캐시에 넣는다 (cacheKey 가 같으면 덮어쓴다)
export async function cacheMessages<T extends ChatMessageKey>(messages: T[]): Promise<void> {
  if (!isAvailable() || messages.length === 0) return

  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    for (const message of messages) {
      if (!message) continue
      const cacheKey = cacheKeyOf(message)
      if (!cacheKey) continue
      store.put({ ...message, cacheKey })
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
