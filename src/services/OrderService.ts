import { IOrder } from '../models/IOrder';
import { Order } from '../schemas/OrderSchema';
import { Types } from 'mongoose';

// Create a new order
export const createOrder = async (orderToSave: IOrder) => {
  const newOrder = new Order(orderToSave);
  const response = await newOrder.save();
  return !!response;
};

// Get all orders
export const getAllOrders = async () => {
  const orders = await Order.find();
  return orders.map((order) => order.toJSON());
};

// Get a single order by ID
export const getOrderById = async (id: string) => {
  const order = await Order.findById(id);
  return order || false;
};

// Get orders by user
export const getOrdersByUser = async (userId: string) => {
  const orders = await Order.find({ customerId: new Types.ObjectId(userId) });
  return orders.map((order) => order.toJSON());
};

// Get orders by shop
export const getOrdersByShop = async (shopId: string) => {
  const orders = await Order.find({ 'items.shopId': new Types.ObjectId(shopId) });
  return orders.map((order) => order.toJSON());
};

// Update an order (e.g., status)
export const updateOrder = async (
  id: string,
  modifiedOrder: Partial<IOrder>,
  changedBy?: string,
) => {
  const updateQuery: any = { $set: modifiedOrder };

  if (modifiedOrder.status && changedBy) {
    updateQuery.$push = {
      statusHistory: {
        status: modifiedOrder.status,
        changedAt: new Date(),
        changedBy: new Types.ObjectId(changedBy),
      },
    };
  }

  const updatedOrder = await Order.findByIdAndUpdate(id, updateQuery, { new: true });
  return updatedOrder || false;
};

// Delete an order
export const deleteOrder = async (id: string) => {
  const deletedOrder = await Order.findByIdAndDelete(id);
  return !!deletedOrder;
};
