export interface BlockHeight {
    blockHeight: number
}

export async function getLatestBlockHeight(): Promise<BlockHeight> {
    const response = await fetch("/api/blockchain/height/latest", {
        cache: "no-cache",
    })

    if (!response.ok) { throw new Error("블록 높이를 조회할 수 없습니다.") }

    return response.json()
}