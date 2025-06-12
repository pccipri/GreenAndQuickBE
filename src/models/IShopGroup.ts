import IAddress from "./IAddress";

export interface IShopGroup {
  _id: string;
  name: string;
  description: string;
  shops: string[];
  deliveryAddress: IAddress;
  createdAt: Date;
  updatedAt: Date;
}