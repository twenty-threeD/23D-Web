export interface RecentBlock {
    height: number
    /** 블록 헤더 시각(ISO 8601). 상대 시간 계산은 클라이언트가 한다. */
    time: string
    /** 그 블록에 담긴 트랜잭션 수. */
    txCount: number
}

export interface RecentTransaction {
    hash: string
    /** 메시지 서명자 주소. 메시지에 없으면 null. */
    signer: string | null
    /** 결제 ID(order_id). 결제 메시지가 아니면 null. */
    paymentId: string | null
    time: string
    height: number
}

export interface RecentActivity {
    blocks: RecentBlock[]
    transactions: RecentTransaction[]
}

/**
 * 최근 활동 조회는 같은 오리진의 라우트 핸들러를 거친다.
 * 노드가 CORS를 허용하지 않아 브라우저에서 직접 호출할 수 없다.
 */
const RECENT_ACTIVITY_API = "/api/blockchain/recent"

/** 결제 기록은 드물게 쌓이므로 블록 높이보다 느리게 갱신한다. */
const POLL_INTERVAL = 15000

const ERROR_MESSAGE = "최근 기록을 조회할 수 없습니다."

type Handlers = {
    onActivity: (activity: RecentActivity) => void
    onError?: (message: string) => void
}

export async function getRecentActivity(): Promise<RecentActivity> {
    const response = await fetch(RECENT_ACTIVITY_API, {cache: "no-store"})

    if (!response.ok) { throw new Error(ERROR_MESSAGE) }

    const payload = await response.json() as Partial<RecentActivity>

    return {
        blocks: payload.blocks ?? [],
        transactions: payload.transactions ?? [],
    }
}

/**
 * 최근 블록과 트랜잭션을 주기적으로 전달한다.
 * 반환한 함수를 호출하면 중단한다.
 */
export function subscribeRecentActivity({onActivity, onError}: Handlers): () => void {
    let stopped = false

    const tick = async () => {
        try {
            const activity = await getRecentActivity()
            if (!stopped) { onActivity(activity) }
        } catch {
            if (!stopped) { onError?.(ERROR_MESSAGE) }
        }
    }

    tick()
    const intervalId = window.setInterval(tick, POLL_INTERVAL)

    return () => {
        stopped = true
        window.clearInterval(intervalId)
    }
}

const ELLIPSIS = "....."

/** 트랜잭션 해시를 "E4047.....BD411" 형태로 줄인다. */
export function truncateHash(hash: string | null): string | null {
    if (!hash) { return null }
    return hash.length <= 10 ? hash : `${hash.slice(0, 5)}${ELLIPSIS}${hash.slice(-5)}`
}

/**
 * 주소를 "1l50cj.....p8s9q" 형태로 줄인다.
 * 모든 주소가 공유하는 bech32 접두사(cosmos)는 구분에 도움이 안 되므로 떼어낸다.
 */
export function truncateAddress(address: string | null): string | null {
    if (!address) { return null }

    const separator = address.indexOf("1")
    const body = separator === -1 ? address : address.slice(separator)

    return body.length <= 11 ? body : `${body.slice(0, 6)}${ELLIPSIS}${body.slice(-5)}`
}

/** 결제 ID는 뒤쪽만 "....odvhgga6" 형태로 보여준다. */
export function truncatePaymentId(paymentId: string | null): string | null {
    if (!paymentId) { return null }
    return paymentId.length <= 8 ? paymentId : `${ELLIPSIS}${paymentId.slice(-8)}`
}
