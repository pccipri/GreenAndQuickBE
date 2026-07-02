export interface ICartItem {
  productId: string;
  shopId: string;
  quantity: number;
  priceAtAdd: number; // in cents
}

export interface ICart {
  _id: string;
  userId: string;
  items: ICartItem[];
  updatedAt: Date;
}
