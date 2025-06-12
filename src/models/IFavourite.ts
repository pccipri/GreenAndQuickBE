export interface IFavourite {
  _id: string;
  user: string;
  products: string[];
  createdAt: Date;
  updatedAt: Date;
}