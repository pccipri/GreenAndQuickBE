import { IBaseAddress } from './IBaseAddress';

export interface IShopGroup {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string; // ref to User (the shop owner who created the group)
  shops: string[]; // array of refs to Shop (includes owner's shop)
  pickupAddress: IBaseAddress; // where the courier collects — set by group owner
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
