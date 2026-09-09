import { NextResponse } from 'next/server'

/**
 * 네트워크 지표 조회는 같은 오리진의 라우트 핸들러를 거친다.
 * 노드가 CORS를 허용하지 않아 브라우저에서 직접 호출할 수 없다.
 */
const CHAIN_REST_URL = process.env.CHAIN_REST_URL ?? 'https://blockchain.idta.store'

/**
 * CometBFT RPC 주소. 피어 수(/net_info)는 SDK REST에 없고 이 RPC에만 있다.
 * 설정되지 않았으면 peers 는 null 로 반환한다.
 */
const CHAIN_RPC_URL = process.env.CHAIN_RPC_URL

/** 평균 블록 생성 시간을 계산할 구간(블록 수). */
const BLOCK_WINDOW = 100

export const dynamic = 'force-dynamic'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) { throw new Error(`${url} responded ${res.status}`) }
  return await res.json() as T
}

type BlockResponse = { block?: { header?: { height?: string; time?: string } } }
type ValidatorSetResponse = { pagination?: { total?: string } }
type NetInfoResponse = { result?: { n_peers?: string } }

/**
 * 최신 블록과 BLOCK_WINDOW 만큼 이전 블록의 헤더 시각 차이로 평균 블록 간격을 구한다.
 * 체인이 아직 짧으면 가능한 만큼만 뒤로 간다.
 */
async function fetchHeightAndBlockTime(): Promise<{ height: number; avgBlockTimeSec: number | null }> {
  const latest = await fetchJson<BlockResponse>(
    `${CHAIN_REST_URL}/cosmos/base/tendermint/v1beta1/blocks/latest`
  )

  const height = Number(latest.block?.header?.height)
  const latestTime = Date.parse(latest.block?.header?.time ?? '')

  if (!Number.isFinite(height) || Number.isNaN(latestTime)) {
    throw new Error('invalid latest block')
  }

  const window = Math.min(BLOCK_WINDOW, height - 1)
  if (window < 1) { return { height, avgBlockTimeSec: null } }

  const past = await fetchJson<BlockResponse>(
    `${CHAIN_REST_URL}/cosmos/base/tendermint/v1beta1/blocks/${height - window}`
  )

  const pastTime = Date.parse(past.block?.header?.time ?? '')
  if (Number.isNaN(pastTime) || pastTime >= latestTime) {
    return { height, avgBlockTimeSec: null }
  }

  const avgBlockTimeSec = (latestTime - pastTime) / 1000 / window

  return { height, avgBlockTimeSec: Math.round(avgBlockTimeSec * 100) / 100 }
}

async function fetchValidatorCount(): Promise<number> {
  const payload = await fetchJson<ValidatorSetResponse>(
    `${CHAIN_REST_URL}/cosmos/base/tendermint/v1beta1/validatorsets/latest`
  )

  const total = Number(payload.pagination?.total)
  if (!Number.isFinite(total)) { throw new Error('invalid validator set') }

  return total
}

/**
 * 조회 대상 노드가 연결 중인 피어 수에 자기 자신을 더한다.
 * 네트워크 전체 노드 수가 아니라 "이 노드가 인지하는 노드 수"다.
 */
async function fetchNodeCount(): Promise<number> {
  const payload = await fetchJson<NetInfoResponse>(`${CHAIN_RPC_URL}/net_info`)

  const peers = Number(payload.result?.n_peers)
  if (!Number.isFinite(peers)) { throw new Error('invalid net_info') }

  return peers + 1
}

export async function GET() {
  // 일부 지표만 실패해도 나머지는 그대로 내려준다. 실패한 값은 null 이고
  // 화면에서는 '-' 로 표시된다.
  const [chainResult, validatorResult, nodeResult] = await Promise.allSettled([
    fetchHeightAndBlockTime(),
    fetchValidatorCount(),
    CHAIN_RPC_URL ? fetchNodeCount() : Promise.resolve(null),
  ])

  if (chainResult.status === 'rejected' && validatorResult.status === 'rejected') {
    console.error('Network info request failed:', chainResult.reason, validatorResult.reason)
    return NextResponse.json({ error: '블록체인 노드에 연결할 수 없습니다.' }, { status: 502 })
  }

  if (nodeResult.status === 'rejected') {
    console.error('Peer count request failed:', nodeResult.reason)
  }

  return NextResponse.json({
    height: chainResult.status === 'fulfilled' ? chainResult.value.height : null,
    avgBlockTimeSec: chainResult.status === 'fulfilled' ? chainResult.value.avgBlockTimeSec : null,
    validators: validatorResult.status === 'fulfilled' ? validatorResult.value : null,
    nodes: nodeResult.status === 'fulfilled' ? nodeResult.value : null,
    blockWindow: BLOCK_WINDOW,
  })
}
