type Matrix3 = number[]

// 3x3 행렬 연산 (투영 변환을 구하는 데만 쓴다)
function multiply(a: Matrix3, b: Matrix3): Matrix3 {
  const out: Matrix3 = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      let sum = 0
      for (let k = 0; k < 3; k++) sum += a[3 * row + k] * b[3 * k + col]
      out[3 * row + col] = sum
    }
  }
  return out
}

function apply(m: Matrix3, v: number[]) {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}

// 수반행렬. 역행렬 대신 써도 되는 이유는 뒤에서 어차피 전체를 정규화하기 때문이다.
function adjugate(m: Matrix3): Matrix3 {
  return [
    m[4] * m[8] - m[5] * m[7],
    m[2] * m[7] - m[1] * m[8],
    m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8],
    m[0] * m[8] - m[2] * m[6],
    m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6],
    m[1] * m[6] - m[0] * m[7],
    m[0] * m[4] - m[1] * m[3],
  ]
}

// 단위 사각형 네 점을 임의의 네 점으로 보내는 행렬
function basisToPoints(points: number[][]): Matrix3 {
  const [p1, p2, p3, p4] = points
  const m: Matrix3 = [p1[0], p2[0], p3[0], p1[1], p2[1], p3[1], 1, 1, 1]
  const v = apply(adjugate(m), [p4[0], p4[1], 1])
  return multiply(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]])
}

export type Quad = [number, number][]

/**
 * width x height 짜리 요소의 네 모서리를 quad(좌상 → 우상 → 우하 → 좌하)로 보내는
 * CSS matrix3d 문자열을 만든다.
 *
 * 캔버스에 그리는 방식으로는 원근(사다리꼴)을 낼 수 없어서, 화면 이미지만 DOM 으로 얹고
 * 이 변환을 건다. 브라우저가 처리하므로 글자도 뭉개지지 않는다.
 */
export function quadTransform(width: number, height: number, quad: Quad): string {
  const source = basisToPoints([
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ])
  const destination = basisToPoints(quad)
  const transform = multiply(destination, adjugate(source))

  // 마지막 항으로 정규화해야 브라우저가 같은 변환으로 읽는다.
  const normalized = transform.map((value) => value / transform[8])

  // matrix3d 는 열 우선이고 z 축은 쓰지 않는다.
  const matrix = [
    normalized[0], normalized[3], 0, normalized[6],
    normalized[1], normalized[4], 0, normalized[7],
    0, 0, 1, 0,
    normalized[2], normalized[5], 0, 1,
  ]

  return `matrix3d(${matrix.map((value) => value.toFixed(6)).join(",")})`
}
