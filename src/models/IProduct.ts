export default interface IProduct {
  _id: string;
  shopId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  reducedPrice: number | null;
  isAvailable: boolean;
  stock: number;
  lowStockThreshold: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDto extends Omit<IProduct, '_id' | 'images'> {
  id: string;
  imageUrls: string[];
}

export type ICreateProductDTO = Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>;
