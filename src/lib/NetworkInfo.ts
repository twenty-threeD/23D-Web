import {isChainSocketEnabled, subscribeChainEvent} from "@/src/lib/ChainSocket"

export interface NetworkInfo {
    /** 이 노드가 인지하는 노드 수(피어 + 자기 자신). RPC 미설정 시 null. */
    nodes: number | null
    /** 현재 활성 검증자 수. */
    validators: number | null
    /** 최근 blockWindow 개 블록의 평균 생성 간격(초). */
    avgBlockTimeSec: number | null
    /** 평균 계산에 사용한 블록 수. */
    blockWindow: number
}

/**
 * 네트워크 지표 조회는 같은 오리진의 라우트 핸들러를 거친다.
 * 노드가 CORS를 허용하지 않아 브라우저에서 직접 호출할 수 없다.
 */
const NETWORK_INFO_API = "/api/blockchain/network-info"

/** 지표는 초 단위로만 변하므로 블록 높이보다 느리게 갱신한다. */
const POLL_INTERVAL = 15000

/**
 * 웹소켓 모드에서의 폴링 간격.
 * 피어 수(/net_info)와 평균 블록 시간은 구독할 이벤트가 없어 폴링을 남기되,
 * 검증자 수는 변경 이벤트로 즉시 반영하므로 간격을 늘린다.
 */
const SLOW_POLL_INTERVAL = 60000

const VALIDATOR_UPDATE_QUERY = "tm.event='ValidatorSetUpdates'"

const ERROR_MESSAGE = "정보를 조회할 수 없습니다."

type Handlers = {
    onInfo: (info: NetworkInfo) => void
    onError?: (message: string) => void
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
    const response = await fetch(NETWORK_INFO_API, {cache: "no-store"})

    if (!response.ok) { throw new Error(ERROR_MESSAGE) }

    const payload = await response.json() as Partial<NetworkInfo>

    return {
        nodes: payload.nodes ?? null,
        validators: payload.validators ?? null,
        avgBlockTimeSec: payload.avgBlockTimeSec ?? null,
        blockWindow: payload.blockWindow ?? 0,
    }
}

/**
 * 네트워크 지표를 주기적으로 전달한다.
 * NEXT_PUBLIC_CHAIN_RPC_WS가 설정되어 있으면 검증자 집합 변경 시 즉시 다시 조회하고
 * 나머지는 느린 주기로 갱신한다.
 * 반환한 함수를 호출하면 중단한다.
 */
export function subscribeNetworkInfo({onInfo, onError}: Handlers): () => void {
    const useSocket = isChainSocketEnabled()
    let stopped = false
    let requestSeq = 0

    const tick = async () => {
        const seq = ++requestSeq
        try {
            const info = await getNetworkInfo()
            if (!stopped && seq === requestSeq) { onInfo(info) }
        } catch {
            if (!stopped && seq === requestSeq) { onError?.(ERROR_MESSAGE) }
        }
    }

    tick()
    const intervalId = window.setInterval(tick, useSocket ? SLOW_POLL_INTERVAL : POLL_INTERVAL)

    const unsubscribe = useSocket
        ? subscribeChainEvent(VALIDATOR_UPDATE_QUERY, {onEvent: tick})
        : null

    return () => {
        stopped = true
        window.clearInterval(intervalId)
        unsubscribe?.()
    }
}

/** 평균 블록 생성 시간을 "5.02초" 형태로 표기한다. */
export function formatBlockTime(seconds: number | null): string | null {
    return seconds === null ? null : `${seconds.toFixed(2)}초`
}
