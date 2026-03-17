import { toDtoWithImageUrl } from '@/presenters/GenericPresenter';
import IProduct, { ICreateProductDTO, ProductDto } from '../models/IProduct';
import { Product } from '../schemas/ProductSchema';
import { deletePublicImage } from './PublicImageStorageService';

// Create a new product
export const createProduct = async (productToSave: ICreateProductDTO) => {
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
export const getProductById = async (id: string, skipTransformToDto: boolean = false) => {
  const product = await Product.findById(id);
  return product
    ? skipTransformToDto
      ? product
      : toDtoWithImageUrl<ProductDto>(product, 'imagePath')
    : null;
};

// Get products by shop
export const getProductsByShop = async (shopId: string) => {
  const foundProducts = await Product.find({ shop: shopId });
  return foundProducts.map((product) => toDtoWithImageUrl<ProductDto>(product, 'imagePath'));
};

// Get products by category
export const getProductsByCategory = async (categoryId: string) => {
  const foundProducts = await Product.find({ category: categoryId });
  return foundProducts.map((product) => toDtoWithImageUrl<ProductDto>(product, 'imagePath'));
};

// Search products by name
export const searchProductsByName = async (query: string) => {
  const foundProducts = await Product.find({ name: new RegExp(query, 'i') }); // case-insensitive search
  return foundProducts.map((product) => toDtoWithImageUrl<ProductDto>(product, 'imagePath'));
};

// Update a product by ID
export const updateProduct = async (id: string, modifiedProduct: Partial<IProduct>) => {
  const updated = await Product.findByIdAndUpdate(id, modifiedProduct, { new: true });
  return updated ? toDtoWithImageUrl<ProductDto>(updated, 'imagePath') : null;
};

// Delete a product by ID
export const deleteProduct = async (id: string) => {
  const deleted = await Product.findByIdAndDelete(id);

  if (deleted && deleted.imagePath) {
    await deletePublicImage(deleted.imagePath);
  }

  return !!deleted;
};
