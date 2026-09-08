import { NextResponse } from 'next/server'

const CHAIN_REST_URL = process.env.CHAIN_REST_URL ?? 'https://blockchain.idta.store'

export const dynamic = 'force-dynamic'

export async function GET() {
  let res: Response
  try {
    res = await fetch(
      `${CHAIN_REST_URL}/cosmos/base/tendermint/v1beta1/blocks/latest`,
      { cache: 'no-store' }
    )
  } catch (error) {
    console.error('Block height proxy request failed:', error)
    return NextResponse.json({ error: '블록체인 노드에 연결할 수 없습니다.' }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: '블록 높이를 조회할 수 없습니다.' }, { status: res.status })
  }

  const payload = await res.json() as { block?: { header?: { height?: string } } }
  const blockHeight = Number(payload.block?.header?.height)

  if (!Number.isFinite(blockHeight)) {
    return NextResponse.json({ error: '블록 높이를 조회할 수 없습니다.' }, { status: 502 })
  }

  return NextResponse.json({ blockHeight })
}
