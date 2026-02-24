import ICategory from '../models/ICategory';
import { Category } from '../schemas/CategorySchema';

export const createCategory = async (categoryToSave: ICategory) => {
  const newCategory = new Category(categoryToSave);
  const response = await newCategory.save();
  return response._id;
};

export const getAllCategories = async () => {
  const categories = await Category.find();
  return categories;
};

export const getCategoryById = async (id: string) => {
  const category = await Category.findById(id);
  return category || null;
};

export const updateCategory = async (id: string, modifiedCategory: Partial<ICategory>) => {
  const updated = await Category.findByIdAndUpdate(id, modifiedCategory, { new: true });
  return updated || null;
};

export const deleteCategory = async (id: string) => {
  const deleted = await Category.findByIdAndDelete(id);
  return !!deleted;
};
