/**
 * CometBFT(Tendermint) RPC WebSocket 엔드포인트. 예) wss://rpc.idta.store/websocket
 * 비어 있으면 웹소켓을 쓰지 않고 각 모듈이 REST 폴링으로 동작한다.
 */
const RPC_WS_URL = process.env.NEXT_PUBLIC_CHAIN_RPC_WS

const RECONNECT_DELAY = 3000

type Listener = {
    /** 구독 쿼리에 해당하는 이벤트의 result.data.value 와 result.events. */
    onEvent: (value: unknown, events: Record<string, string[]>) => void
    /**
     * (재)연결되어 구독이 걸린 직후 호출된다.
     * 끊긴 동안 놓친 이벤트를 REST 로 다시 맞추는 데 쓴다.
     */
    onConnect?: () => void
}

/*
 * 프록시(nginx)가 IP 당 웹소켓 연결 수를 제한하므로 탭 하나에서는 연결을 하나만 연다.
 * 같은 쿼리를 여러 곳에서 구독해도 노드에는 한 번만 subscribe 한다.
 */
const listeners = new Map<string, Set<Listener>>()
const queryIds = new Map<string, number>()
let nextId = 1

let socket: WebSocket | null = null
let reconnectTimer: number | null = null

export function isChainSocketEnabled(): boolean {
    return Boolean(RPC_WS_URL) && typeof window !== "undefined"
}

/**
 * 구독이 실제로 살아 있는지. 연결 실패(오리진 거부 등)나 끊김 동안에는 false 이고
 * 각 모듈은 이 동안 REST 폴링으로 대신한다.
 */
export function isChainSocketOpen(): boolean {
    return socket?.readyState === WebSocket.OPEN
}

function send(method: string, query: string) {
    if (socket?.readyState !== WebSocket.OPEN) { return }

    let id = queryIds.get(query)
    if (id === undefined) {
        id = nextId++
        queryIds.set(query, id)
    }

    socket.send(JSON.stringify({jsonrpc: "2.0", id, method, params: {query}}))
}

function dispatch(raw: string) {
    let payload: { result?: { query?: string; data?: { value?: unknown }; events?: Record<string, string[]> } }
    try {
        payload = JSON.parse(raw)
    } catch {
        return
    }

    // subscribe 응답(result: {})에는 query 가 없다.
    const query = payload.result?.query
    if (!query) { return }

    for (const listener of listeners.get(query) ?? []) {
        listener.onEvent(payload.result?.data?.value, payload.result?.events ?? {})
    }
}

function connect() {
    if (!RPC_WS_URL || socket || listeners.size === 0) { return }

    const current = new WebSocket(RPC_WS_URL)
    socket = current

    current.onopen = () => {
        for (const [query, set] of listeners) {
            send("subscribe", query)
            for (const listener of set) { listener.onConnect?.() }
        }
    }

    current.onmessage = (event) => { dispatch(event.data) }

    current.onclose = () => {
        if (socket !== current) { return }
        socket = null
        if (listeners.size === 0) { return }
        reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null
            connect()
        }, RECONNECT_DELAY)
    }
}

function disconnect() {
    if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
    }
    const current = socket
    socket = null
    current?.close()
}

/**
 * 쿼리(예: "tm.event='NewBlock'")를 구독한다.
 * 연결은 첫 구독 때 열리고 마지막 구독이 해제되면 닫힌다.
 * 반환한 함수를 호출하면 구독을 해제한다.
 */
export function subscribeChainEvent(query: string, listener: Listener): () => void {
    let set = listeners.get(query)
    const isNewQuery = !set
    if (!set) {
        set = new Set()
        listeners.set(query, set)
    }
    set.add(listener)

    if (!socket) {
        connect()
    } else if (socket.readyState === WebSocket.OPEN) {
        if (isNewQuery) { send("subscribe", query) }
        listener.onConnect?.()
    }
    // CONNECTING 상태면 onopen 에서 일괄 구독한다.

    return () => {
        const current = listeners.get(query)
        if (!current?.delete(listener) || current.size > 0) { return }

        listeners.delete(query)
        send("unsubscribe", query)
        queryIds.delete(query)

        if (listeners.size === 0) { disconnect() }
    }
}
