export interface IInventoryItem {
  _id: string;
  productId: string;
  shopId: string;
  stock: number;
  lowStockThreshold?: number;
  updatedAt: Date;
  createdAt: Date;
}