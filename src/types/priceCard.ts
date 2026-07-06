export interface PriceCardItem {
  name: string
  included: boolean
}

export interface PriceCardPlan {
  planName: string
  price: string
  description: string
  items: PriceCardItem[]
}
