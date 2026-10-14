export const PAYMENT_FEE_TIERS = [
  { label: "10만원 이하", maximum: 100_000, rate: 5 },
  { label: "10만원 초과 ~ 100만원 이하", maximum: 1_000_000, rate: 4 },
  { label: "100만원 초과 ~ 500만원 이하", maximum: 5_000_000, rate: 3 },
  { label: "500만원 초과 ~ 1,000만원 미만", maximum: 9_999_999, rate: 2 },
  { label: "1,000만원 이상", maximum: Number.POSITIVE_INFINITY, rate: 1 },
] as const;

export function calculatePaymentFee(price: number) {
  const tier = PAYMENT_FEE_TIERS.find(({ maximum }) => price <= maximum) ?? PAYMENT_FEE_TIERS[PAYMENT_FEE_TIERS.length - 1];
  // 수수료에서 원 미만을 버리면 정해진 비율보다 낮아지므로 결제 가능한 정수 금액으로 올림한다.
  const fee = Math.ceil((price * tier.rate) / 100);

  return {
    rate: tier.rate,
    fee,
    settlement: price - fee,
  };
}
