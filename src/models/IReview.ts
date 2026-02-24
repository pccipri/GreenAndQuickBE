export interface IReview {
  _id: string;
  user: string;
  product?: string;
  shop?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
