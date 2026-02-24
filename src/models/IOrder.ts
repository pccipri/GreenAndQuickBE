import IAddress from './IAddress';

export interface IOrderItem {
  productId: string;
  quantity: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  shopGroupId: string;
  items: IOrderItem[];
  totalAmount: number;
  paymentOption: 'cash' | 'stripe';
  deliveryOption: 'fanCourier';
  deliveryAddress: IAddress;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
