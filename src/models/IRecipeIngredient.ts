export default interface IRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  linkedProductId?: string | null;
}

export type IRecipeIngredientDTO = Omit<IRecipeIngredient, 'linkedProductId'> & {
  linkedProduct?: {
    id: string;
    name: string;
    price: number | null;
    shopId?: string | null;
  } | null;
};
