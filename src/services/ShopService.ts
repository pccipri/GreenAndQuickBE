import { IShop } from '../models/IShop';
import { Shop } from '../schemas/ShopSchema';

// Create a shop
export const createShop = async (shopData: IShop) => {
  const existing = await Shop.findOne({ owner: shopData.owner });
  if (existing) {
    throw new Error('User already owns a shop.');
  }

  const shop = new Shop(shopData);
  const saved = await shop.save();
  return saved.toJSON();
};

// Get all shops
export const getAllShops = async () => {
  const shops = await Shop.find();
  return shops.map((shop) => shop.toJSON());
};

// Get a shop by ID
export const getShopById = async (id: string) => {
  const shop = await Shop.findById(id);
  return shop || null;
};

// Get shop by owner
export const getShopByOwner = async (owner: string) => {
  return await Shop.findOne({ owner });
};

// Update a shop
export const updateShop = async (id: string, updatedData: Partial<IShop>) => {
  const updated = await Shop.findByIdAndUpdate(id, updatedData, { new: true });
  return updated || null;
};

// Delete a shop
export const deleteShop = async (id: string) => {
  const deleted = await Shop.findByIdAndDelete(id);
  return !!deleted;
};
