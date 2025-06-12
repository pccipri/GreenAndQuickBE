import { IOrder } from "../models/IOrder";
import { Order } from "../schemas/OrderSchema";

// Create a new order
export const createOrder = async (orderToSave: IOrder) => {
  const newOrder = new Order(orderToSave);
  const response = await newOrder.save();
  return !!response;
};

// Get all orders
export const getAllOrders = async () => {
  const orders = await Order.find();
  return orders.map(order => order.toJSON());
};

// Get a single order by ID
export const getOrderById = async (id: string) => {
  const order = await Order.findById(id);
  return order || false;
};

// Get orders by user
export const getOrdersByUser = async (userId: string) => {
  const orders = await Order.find({ user: userId });
  return orders.map(order => order.toJSON());
};

// Update an order (e.g., status)
export const updateOrder = async (id: string, modifiedOrder: Partial<IOrder>) => {
  const updatedOrder = await Order.findByIdAndUpdate(id, modifiedOrder, { new: true });
  return updatedOrder || false;
};

// Delete an order
export const deleteOrder = async (id: string) => {
  const deletedOrder = await Order.findByIdAndDelete(id);
  return !!deletedOrder;
};