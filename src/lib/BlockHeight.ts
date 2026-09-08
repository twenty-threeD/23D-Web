export interface BlockHeight {
    blockHeight: number
}

/**
 * 블록 높이 조회는 같은 오리진의 라우트 핸들러를 거친다.
 * 노드 REST(blockchain.idta.store)가 CORS를 허용하지 않아 브라우저에서 직접 호출할 수 없다.
 * 실제 노드 주소는 서버 전용 환경변수 CHAIN_REST_URL로 설정한다.
 */
const HEIGHT_API = "/api/blockchain/height/latest"

/**
 * CometBFT(Tendermint) RPC WebSocket 엔드포인트. 예) wss://rpc.idta.store/websocket
 * 설정되어 있으면 폴링 대신 NewBlock 구독을 사용한다.
 */
const RPC_WS_URL = process.env.NEXT_PUBLIC_CHAIN_RPC_WS

const POLL_INTERVAL = 5000
const RECONNECT_DELAY = 3000

const STATUS_ID = 1
const SUBSCRIBE_ID = 2
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

function parseWsHeight(payload: unknown): number | null {
    const result = (payload as { result?: Record<string, unknown> } | null)?.result
    if (!result) { return null }

    // status 응답
    const syncInfo = (result as {
        sync_info?: { latest_block_height?: string }
    }).sync_info
    if (syncInfo?.latest_block_height) { return Number(syncInfo.latest_block_height) }

    // NewBlock 이벤트
    const height = (result as {
        data?: { value?: { block?: { header?: { height?: string } } } }
    }).data?.value?.block?.header?.height
    if (height) { return Number(height) }

    return null
}

function subscribeViaWebSocket(url: string, {onHeight, onError}: Handlers): () => void {
    let socket: WebSocket | null = null
    let reconnectTimer: number | null = null
    let closed = false

    const connect = () => {
        if (closed) { return }

        socket = new WebSocket(url)

        socket.onopen = () => {
            // 최초 높이 조회 + 이후 블록 구독
            socket?.send(JSON.stringify({
                jsonrpc: "2.0", id: STATUS_ID, method: "status", params: {},
            }))
            socket?.send(JSON.stringify({
                jsonrpc: "2.0", id: SUBSCRIBE_ID, method: "subscribe",
                params: {query: NEW_BLOCK_QUERY},
            }))
        }

        socket.onmessage = (event) => {
            try {
                const height = parseWsHeight(JSON.parse(event.data))
                if (height !== null && Number.isFinite(height)) { onHeight(height) }
            } catch {
                // 파싱 불가한 메시지는 무시
            }
        }

        socket.onerror = () => { onError?.(ERROR_MESSAGE) }

        socket.onclose = () => {
            if (closed) { return }
            reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY)
        }
    }

    connect()

    return () => {
        closed = true
        if (reconnectTimer !== null) { window.clearTimeout(reconnectTimer) }
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                jsonrpc: "2.0", id: SUBSCRIBE_ID, method: "unsubscribe",
                params: {query: NEW_BLOCK_QUERY},
            }))
        }
        socket?.close()
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
    return RPC_WS_URL
        ? subscribeViaWebSocket(RPC_WS_URL, handlers)
        : subscribeViaPolling(handlers)
}
