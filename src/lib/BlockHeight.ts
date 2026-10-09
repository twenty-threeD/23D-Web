import {isChainSocketEnabled, isChainSocketOpen, subscribeChainEvent} from "@/src/lib/ChainSocket"

export interface BlockHeight {
    blockHeight: number
}

/**
 * 블록 높이 조회는 같은 오리진의 라우트 핸들러를 거친다.
 * 노드 REST(blockchain.idta.store)가 CORS를 허용하지 않아 브라우저에서 직접 호출할 수 없다.
 * 실제 노드 주소는 서버 전용 환경변수 CHAIN_REST_URL로 설정한다.
 */
const HEIGHT_API = "/api/blockchain/height/latest"

const POLL_INTERVAL = 5000

const NEW_BLOCK_QUERY = "tm.event='NewBlock'"

const ERROR_MESSAGE = "블록 높이를 조회할 수 없습니다."

type Handlers = {
    onHeight: (height: number) => void
    onError?: (message: string) => void
}

export async function getLatestBlockHeight(): Promise<BlockHeight> {
    const response = await fetch(HEIGHT_API, {cache: "no-store"})

    if (!response.ok) { throw new Error(ERROR_MESSAGE) }

    const payload = await response.json() as { blockHeight?: number }

    if (!Number.isFinite(payload.blockHeight)) { throw new Error(ERROR_MESSAGE) }

    return {blockHeight: payload.blockHeight as number}
}

function parseNewBlockHeight(value: unknown): number | null {
    const height = (value as {
        block?: { header?: { height?: string } }
    } | null)?.block?.header?.height

    return height ? Number(height) : null
}

function subscribeViaWebSocket({onHeight, onError}: Handlers): () => void {
    let stopped = false
    let latest = 0

    // 높이는 단조 증가한다. REST 응답과 이벤트가 엇갈려 와도 되돌아가지 않게 한다.
    const emit = (height: number) => {
        if (stopped || !Number.isFinite(height) || height <= latest) { return }
        latest = height
        onHeight(height)
    }

    const fetchLatest = () => {
        getLatestBlockHeight()
            .then(({blockHeight}) => emit(blockHeight))
            .catch(() => { if (!stopped) { onError?.(ERROR_MESSAGE) } })
    }

    // 웹소켓 연결을 기다리지 않고 바로 보여준다. 연결이 거부되거나 끊긴 동안에는
    // 폴링으로 대신하고, 구독이 살아 있으면 폴링은 건너뛴다.
    fetchLatest()
    const intervalId = window.setInterval(() => {
        if (!isChainSocketOpen()) { fetchLatest() }
    }, POLL_INTERVAL)

    const unsubscribe = subscribeChainEvent(NEW_BLOCK_QUERY, {
        onEvent: (value) => {
            const height = parseNewBlockHeight(value)
            if (height !== null) { emit(height) }
        },
        // 끊긴 동안 지나간 블록을 맞춘다.
        onConnect: fetchLatest,
    })

    return () => {
        stopped = true
        window.clearInterval(intervalId)
        unsubscribe()
    }
}

function subscribeViaPolling({onHeight, onError}: Handlers): () => void {
    let stopped = false

    const tick = async () => {
        try {
            const {blockHeight} = await getLatestBlockHeight()
            if (!stopped) { onHeight(blockHeight) }
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

/**
 * 블록 높이를 주기적으로 전달한다.
 * NEXT_PUBLIC_CHAIN_RPC_WS가 설정되어 있으면 NewBlock 구독을, 아니면 REST 폴링을 쓴다.
 * 반환한 함수를 호출하면 중단한다.
 */
export function subscribeBlockHeight(handlers: Handlers): () => void {
    return isChainSocketEnabled()
        ? subscribeViaWebSocket(handlers)
        : subscribeViaPolling(handlers)
}
