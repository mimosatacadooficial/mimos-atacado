export interface ProductReview {
  id: string
  productId: number
  productSlug: string
  productName: string
  authorName: string
  authorLocation?: string
  rating: number // 1 to 5
  title: string
  comment: string
  isVerifiedPurchase: boolean
  isApproved: boolean
  helpfulCount: number
  createdAt: string
  adminReply?: {
    comment: string
    createdAt: string
  }
}

export interface ProductRatingSummary {
  averageRating: number
  totalReviews: number
  ratingCounts: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  recommendPercentage: number
}
