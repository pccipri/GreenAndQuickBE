import IShopLocation from './IShopLocation';

export interface IShop {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  coverImage: string | null;
  ownerId: string;
  location: IShopLocation | null;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopDto extends Omit<IShop, '_id' | 'logo' | 'coverImage'> {
  id: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
}
