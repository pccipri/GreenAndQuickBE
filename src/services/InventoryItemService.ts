import { IInventoryItem } from "../models/IInventoryItem";
import { InventoryItem } from "../schemas/InventoryItemSchema";

export const createInventoryItem = async (data: IInventoryItem) => {
  const item = new InventoryItem(data);
  const saved = await item.save();
  return saved.toJSON();
};

export const getAllInventoryItems = async () => {
  const items = await InventoryItem.find();
  return items.map((item) => item.toJSON());
};

export const getInventoryItemById = async (id: string) => {
  return await InventoryItem.findById(id);
};

export const getInventoryByProduct = async (productId: string) => {
  return await InventoryItem.find({ productId });
};

export const getInventoryByShop = async (shopId: string) => {
  return await InventoryItem.find({ shopId });
};

export const updateInventoryItem = async (id: string, data: Partial<IInventoryItem>) => {
  return await InventoryItem.findByIdAndUpdate(id, data, { new: true });
};

export const adjustInventoryStock = async (id: string, delta: number) => {
  return await InventoryItem.findByIdAndUpdate(id, { $inc: { stock: delta } }, { new: true });
};

export const deleteInventoryItem = async (id: string) => {
  const deleted = await InventoryItem.findByIdAndDelete(id);
  return !!deleted;
};

export const getLowStockItems = async () => {
  return await InventoryItem.find({ $expr: { $lte: ["$stock", "$lowStockThreshold"] } });
};