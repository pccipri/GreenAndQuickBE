import IProduct from "../models/IProduct";
import { Product } from "../schemas/ProductSchema";

// Create a new product
export const createProduct = async (productToSave: IProduct) => {
  const newProduct = new Product(productToSave);
  const response = await newProduct.save();

  return !!response;
};

// Get all products
export const getAllProducts = async () => {
  const products = await Product.find();
  return products.map((product) => product.toJSON());
};

// Get a single product by ID
export const getProductById = async (id: string) => {
  const product = await Product.findById(id);

  return product || false;
};

// Update a product by ID
export const updateProduct = async (id: string, modifiedProduct: IProduct) => {
  const updatedProduct = await Product.findByIdAndUpdate(id, modifiedProduct);

  return !!updatedProduct;
};

// Delete a product by ID
export const deleteProduct = async (id: string) => {
  const deletedProduct = await Product.findByIdAndDelete(id);

  return !!deletedProduct;
};
