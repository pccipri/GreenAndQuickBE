export interface IReview {
  _id: string;
  targetType: 'product' | 'shop' | 'recipe';
  targetId: string;
  authorId: string;
  rating: number; // integer 1–5
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}
