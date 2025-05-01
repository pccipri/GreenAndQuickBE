import express, { Request, Response, Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../services/ProductService";
import IProduct from "../models/IProduct";

const router = Router();

// Create a new product
router.post("/", async (req: Request, res: Response) => {
  try {
    const product: IProduct = req.body;
    const response = await createProduct(product);
    res.status(201).json(response);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to create product", error: error.message });
  }
});

// Get all products
router.get("/", async (req: Request, res: Response) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
});

// Get a single product by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: error.message });
  }
});

// Update a product by ID
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const modifiedProduct = req.body;

    const updatedProduct = await updateProduct(id, modifiedProduct);

    if (!updatedProduct) {
      res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
  }
});

// Delete a product by ID
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedProduct = await deleteProduct(id);

    if (!deletedProduct) {
      res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to delete product", error: error.message });
  }
});

export default router;
