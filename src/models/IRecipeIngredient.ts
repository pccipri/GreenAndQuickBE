export default interface IRecipeIngredient {
  label: string;
  value: number;
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
