export enum USER_ROLES {
  'CUSTOMER',
  'EMPLOYEE',
  'ADMIN',
}

export enum ORDER_STATUSES {
  'RECEIVED',
  'PREPARING',
  'READYFORDELIVERY',
  'DELIVERED',
  'CANCELLED',
}

export const DURATION_TYPES = ['MINUTES', 'HOURS'] as const;

export const INGREDIENT_UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pcs'] as const;

export const NUTRIENT_UNITS = ['kcal', 'kJ', 'g', 'mg', 'µg'] as const;

export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DESSERT'] as const;

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

export const NUTRIENT_LABELS = [
  'Energy',
  'Fat',
  'Saturates',
  'Carbohydrate',
  'Sugars',
  'Protein',
  'Salt',
] as const;
