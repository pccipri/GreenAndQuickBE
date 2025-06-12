import { Types } from "mongoose";
import { IFavourite } from "../models/IFavourite";
import { Favourite } from "../schemas/FavouriteSchema";

export const createFavourite = async (FavouriteToSave: IFavourite) => {
  const newFavourite = new Favourite(FavouriteToSave);
  const response = await newFavourite.save();
  return !!response;
};

export const getAllFavourites = async () => {
  const favourites = await Favourite.find();
  return favourites.map(f => f.toJSON());
};

export const getFavouriteById = async (id: string) => {
  const favourite = await Favourite.findById(id);
  return favourite || false;
};

export const getFavouritesByUser = async (userId: string) => {
  const favourites = await Favourite.find({ user: userId });
  return favourites || [];
};

export const updateFavourite = async (id: string, modifiedFavourite: IFavourite) => {
  const updatedFavourite = await Favourite.findByIdAndUpdate(id, modifiedFavourite);
  return !!updatedFavourite;
};

export const deleteFavourite = async (id: string) => {
  const deletedFavourite = await Favourite.findByIdAndDelete(id);
  return !!deletedFavourite;
};

export const toggleProductInFavorite = async (userId: string, productId: string) => {
  const favourite = await Favourite.findOne({ user: userId });

  if (!favourite) {
    // Create a new favourite if it doesn't exist
    const newFavourite = new Favourite({
      user: userId,
      products: [productId]
    });
    await newFavourite.save();
    return { added: true };
  }

  const productObjectId = new Types.ObjectId(productId);
  const alreadyExists = favourite.products.some(p => p.equals(productObjectId));

  if (alreadyExists) {
    // Remove the product
    favourite.products = favourite.products.filter(p => !p.equals(productObjectId));
    await favourite.save();
    return { added: false };
  } else {
    // Add the product
    favourite.products.push(productObjectId);
    await favourite.save();
    return { added: true };
  }
};

