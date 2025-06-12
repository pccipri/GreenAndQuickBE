import { IShopGroup } from "../models/IShopGroup";
import { ShopGroup } from "../schemas/ShopGroupSchema";

// Create shop group
export const createShopGroup = async (groupData: IShopGroup) => {
  const group = new ShopGroup(groupData);
  const saved = await group.save();
  return saved.toJSON();
};

// Get all shop groups
export const getAllShopGroups = async () => {
  const groups = await ShopGroup.find();
  return groups.map((group) => group.toJSON());
};

// Get shop group by ID
export const getShopGroupById = async (id: string) => {
  const group = await ShopGroup.findById(id);
  return group || null;
};

// Update shop group
export const updateShopGroup = async (id: string, updatedData: Partial<IShopGroup>) => {
  const updated = await ShopGroup.findByIdAndUpdate(id, updatedData, { new: true });
  return updated || null;
};

// Delete shop group
export const deleteShopGroup = async (id: string) => {
  const deleted = await ShopGroup.findByIdAndDelete(id);
  return !!deleted;
};