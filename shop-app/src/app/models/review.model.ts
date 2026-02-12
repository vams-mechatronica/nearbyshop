// review.model.ts
export interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  time: string;
  date?: string;
  images: string[];
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  productId?: number;
  productName?: string;
  reply?: ReviewReply;
}

export interface ReviewReply {
  id: number;
  comment: string;
  repliedBy: string;
  repliedAt: string;
}

export interface RatingDistribution {
  stars: number;
  percentage: number;
  count: number;
}

export interface ReviewRequest {
  rating: number;
  comment: string;
  images?: File[];
  productId?: number;
  orderId?: number;
}