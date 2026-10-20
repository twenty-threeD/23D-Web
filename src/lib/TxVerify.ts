/** 결제 당사자에게만 내려오는 계약 상세. */
export interface TxDetail {
    contractUrl: string
    /** 체인에 기록된 계약서 주소와 같은지. 서버가 판단하지 못하면 null. */
    contractUrlMatched: boolean | null
}

/** 검증 결과가 거절된 이유. 서버가 문자열로 내려주므로 그대로 보관한다. */
export interface TxVerification {
    txHash: string
    /** 원장과 서명이 모두 맞는지. 화면의 "트랜잭션 검증여부"가 이 값을 따른다. */
    verified: boolean
    reason: string | null
    /** 사람이 읽을 수 있는 실패 사유. 성공이면 null. */
    reasonMessage: string | null
    height: number | null
    orderId: string | null
    amount: number | null
    /** 결제 일시(ISO 8601). */
    paidAt: string | null
    /** 체인에 같은 결제 기록이 남아 있는지. */
    ledgerMatched: boolean
    /** 트랜잭션 서명이 유효한지. 서버가 판단하지 못하면 null. */
    signatureValid: boolean | null
    /** 로그인한 회원이 이 결제의 당사자인지. 당사자여야 detail 이 내려온다. */
    party: boolean
    /** 당사자에게만 주는 상세 정보. 당사자가 아니면 null. */
    detail: TxDetail | null
}

/**
 * 검증 조회는 백엔드 API 를 그대로 호출한다.
 * /api/blockchain/* 는 이 앱의 라우트 핸들러가 가져가므로 상대 경로를 쓸 수 없다.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.idta.store"

const ERROR_MESSAGE = "트랜잭션을 조회할 수 없습니다."

/**
 * 로그인 상태로 조회해야 서버가 당사자인지 판단해 detail 을 내려준다.
 * 비회원도 조회할 수 있으므로 토큰은 있을 때만 붙인다.
 */
export async function getTxVerification(txHash: string, token?: string | null): Promise<TxVerification> {
    const response = await fetch(`${API_URL}/api/blockchain/verify/${txHash}`, {
        cache: "no-store",
        headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    })

    if (!response.ok) { throw new Error(ERROR_MESSAGE) }

    const payload = await response.json() as {data?: Partial<TxVerification>}
    const data = payload.data

    if (!data) { throw new Error(ERROR_MESSAGE) }

    return {
        txHash: data.txHash ?? txHash,
        verified: data.verified ?? false,
        reason: data.reason ?? null,
        reasonMessage: data.reasonMessage ?? null,
        height: data.height ?? null,
        orderId: data.orderId ?? null,
        amount: data.amount ?? null,
        paidAt: data.paidAt ?? null,
        ledgerMatched: data.ledgerMatched ?? false,
        signatureValid: data.signatureValid ?? null,
        party: data.party ?? false,
        detail: data.detail ?? null,
    }
}

/** 결제액은 시안처럼 세 자리마다 끊고 통화를 붙인다. */
export function formatAmount(amount: number | null): string | null {
    if (amount === null) { return null }

    return `${amount.toLocaleString("ko-KR")} KRW`
}
