export interface IFavorite {
  _id: string;
  userId: string;
  targetType: 'recipe' | 'product' | 'shop';
  targetId: string;
  createdAt: Date;
  updatedAt?: Date;
}
