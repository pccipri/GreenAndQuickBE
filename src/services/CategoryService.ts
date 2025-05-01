import ICategory from "../models/ICategory"
import { Category } from "../schemas/CategorySchema"



// Create a new category
export const createCategory = async (categoryToSave: ICategory) => {
  const newCategory = new Category(categoryToSave)
  const response = await newCategory.save()

  if (response) {
    return true
  }

  return false
}

// Get all categories
export const getAllCategories = async () => {
  const categories = await Category.find()
  return categories.map(category => category.toJSON())
}

// Get a single category by ID
export const getCategoryById = async (id: string) => {
  const category = await Category.findById(id)

  if (!category) {
    return false
  }

  return category
}

// Update a category by ID
export const updateCategory = async (
  id: string,
  modifiedCategory: ICategory,
) => {
  const updatedCategory = await Category.findByIdAndUpdate(id, modifiedCategory)

  return !!updatedCategory
}

// Delete a category by ID
export const deleteCategory = async (id: string) => {
  const deletedCategory = await Category.findByIdAndDelete(id)

  return !!deletedCategory
}
