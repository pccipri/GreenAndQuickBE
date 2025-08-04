export default interface IProduct {
  _id: string;
  shop: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  reducedPrice?: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}
