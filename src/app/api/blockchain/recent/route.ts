import { NextResponse } from 'next/server'

/**
 * 최근 활동 조회는 같은 오리진의 라우트 핸들러를 거친다.
 * 노드가 CORS를 허용하지 않아 브라우저에서 직접 호출할 수 없다.
 */
const CHAIN_REST_URL = process.env.CHAIN_REST_URL ?? 'https://blockchain.idta.store'

/**
 * 최신 높이부터 블록을 역순으로 훑으면 빈 블록만 수천 개를 헛돌게 된다.
 * 트랜잭션 인덱스에서 거꾸로 올라가 트랜잭션이 담긴 블록만 추린다.
 */
const TX_QUERY = 'tx.height>0'

/** 한 번에 가져올 트랜잭션 수. 화면에 필요한 블록 수를 채울 만큼 넉넉히 잡는다. */
const FETCH_LIMIT = 25

export const dynamic = 'force-dynamic'

export interface RecentBlock {
  height: number
  /** 블록 헤더 시각(ISO 8601). 상대 시간 계산은 클라이언트가 한다. */
  time: string
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

type TxResponse = {
  height?: string
  txhash?: string
  timestamp?: string
  tx?: {
    body?: {
      messages?: { authority?: string; order_id?: string }[]
    }
  }
}

function toRecentTransaction(response: TxResponse): RecentTransaction | null {
  const height = Number(response.height)
  const hash = response.txhash
  const time = response.timestamp

  if (!Number.isFinite(height) || !hash || !time) { return null }

  const message = response.tx?.body?.messages?.[0]

  return {
    hash,
    signer: message?.authority ?? null,
    paymentId: message?.order_id ?? null,
    time,
    height,
  }
}

/**
 * 같은 블록에 여러 트랜잭션이 담길 수 있으므로 높이로 묶어 TX 수를 센다.
 * 트랜잭션이 내림차순이라 블록도 내림차순으로 나온다.
 */
function toRecentBlocks(transactions: RecentTransaction[]): RecentBlock[] {
  const blocks = new Map<number, RecentBlock>()

  for (const transaction of transactions) {
    const block = blocks.get(transaction.height)

    if (block) {
      block.txCount += 1
      continue
    }

    blocks.set(transaction.height, {
      height: transaction.height,
      time: transaction.time,
      txCount: 1,
    })
  }

  return [...blocks.values()]
}

export async function GET() {
  const url = new URL(`${CHAIN_REST_URL}/cosmos/tx/v1beta1/txs`)
  url.searchParams.set('query', TX_QUERY)
  url.searchParams.set('order_by', 'ORDER_BY_DESC')
  url.searchParams.set('limit', String(FETCH_LIMIT))

  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store' })
  } catch (error) {
    console.error('Recent activity proxy request failed:', error)
    return NextResponse.json({ error: '블록체인 노드에 연결할 수 없습니다.' }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: '최근 기록을 조회할 수 없습니다.' }, { status: res.status })
  }

  const payload = await res.json() as { tx_responses?: TxResponse[] }

  const transactions = (payload.tx_responses ?? [])
    .map(toRecentTransaction)
    .filter((transaction): transaction is RecentTransaction => transaction !== null)

  return NextResponse.json({
    blocks: toRecentBlocks(transactions),
    transactions,
  })
}
