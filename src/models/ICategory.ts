export default interface ICategory {
  _id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDto extends Omit<ICategory, '_id'> {
  id: string;
}
