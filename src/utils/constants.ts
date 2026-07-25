export const USER_ROLES = ['customer', 'admin', 'shopOwner'] as const;

export const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const DURATION_TYPES = ['MINUTES', 'HOURS'] as const;

export const INGREDIENT_UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pcs'] as const;

export const NUTRIENT_UNITS = ['kcal', 'kJ', 'g', 'mg', 'µg'] as const;

export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DESSERT'] as const;

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

export const REVIEW_TARGET_TYPES = ['product', 'shop', 'recipe'] as const;

export const DEFAULT_RATING_VALUE = 0;
export const DEFAULT_REVIEW_COUNT = 0;

export const DIETARY_TAGS = [
  'vegan',
  'vegetarian',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'keto',
  'halal',
  'post',
  'high-protein',
  'low-calorie',
] as const;

export const SEED_ADMIN_EMAIL = 'admin@greenquick.com';
export const SEED_ADMIN_USERNAME = 'admin';
export const SEED_ADMIN_PASSWORD = 'AdminPassword123!';
export const SEED_ADMIN_FIRST_NAME = 'System';
export const SEED_ADMIN_LAST_NAME = 'Admin';

export const NUTRIENT_LABELS = [
  'Energy',
  'Fat',
  'Saturates',
  'Carbohydrate',
  'Sugars',
  'Protein',
  'Salt',
] as const;

export const PRODUCT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Meat',
  'Eggs',
  'Honey & Bee Products',
  'Herbs & Spices',
  'Preserved Foods',
  'Baked Goods',
  'Other',
] as const;

export const PUBLIC_IMAGE_BUCKET = 'public-images';
export const PRIVATE_DOCUMENT_BUCKET = 'private-documents';
