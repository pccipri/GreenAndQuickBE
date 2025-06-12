import IAddress from "./IAddress";

export interface ISubscriptionProduct {
  productId: string;
  quantity: number;
}

export interface ISubscription {
  _id: string;
  userId: string;
  products: ISubscriptionProduct[];
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDeliveryDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deliveryAddress: IAddress;
}