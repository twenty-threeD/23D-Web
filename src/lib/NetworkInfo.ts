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
 * 반환한 함수를 호출하면 중단한다.
 */
export function subscribeNetworkInfo({onInfo, onError}: Handlers): () => void {
    let stopped = false

    const tick = async () => {
        try {
            const info = await getNetworkInfo()
            if (!stopped) { onInfo(info) }
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

/** 평균 블록 생성 시간을 "5.02초" 형태로 표기한다. */
export function formatBlockTime(seconds: number | null): string | null {
    return seconds === null ? null : `${seconds.toFixed(2)}초`
}
