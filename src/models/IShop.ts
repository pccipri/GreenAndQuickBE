export interface IShop {
  _id: string;
  name: string;
  description: string;
  // imageUrl: string;
  owner: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}
