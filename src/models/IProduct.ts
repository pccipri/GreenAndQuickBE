export default interface IProduct {
  _id: string;
  shop: string;
  name: string;
  description: string;
  imagePath: string | null;
  price: number;
  reducedPrice: number | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDto extends Omit<IProduct, '_id' | 'imagePath'> {
  id: string;
  imageUrl: string | null;
}

export type ICreateProductDTO = Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>;
