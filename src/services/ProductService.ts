import IProduct from "../models/IProduct";
import { Product } from "../schemas/ProductSchema";

// Create a new product
export const createProduct = async (productToSave: IProduct) => {
  const newProduct = new Product(productToSave);
  const response = await newProduct.save();
  return response._id;
};

// Get all products
export const getAllProducts = async () => {
  const products = await Product.find();
  return products;
};

// Get a single product by ID
export const getProductById = async (id: string) => {
  const product = await Product.findById(id);
  return product || null;
};

// Get products by shop
export const getProductsByShop = async (shopId: string) => {
  return await Product.find({ shop: shopId });
};

// Get products by category
export const getProductsByCategory = async (categoryId: string) => {
  return await Product.find({ category: categoryId });
};

// Search products by name
export const searchProductsByName = async (query: string) => {
  return await Product.find({ name: new RegExp(query, 'i') }); // case-insensitive search
};

// Update a product by ID
export const updateProduct = async (id: string, modifiedProduct: Partial<IProduct>) => {
  const updated = await Product.findByIdAndUpdate(id, modifiedProduct, { new: true });
  return updated || null;
};

// Delete a product by ID
export const deleteProduct = async (id: string) => {
  const deleted = await Product.findByIdAndDelete(id);
  return !!deleted;
};