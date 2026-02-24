import express from 'express';
import CategoryController from '../controllers/CategoryController';
import AuthController from '../controllers/AuthController';
import UserController from '../controllers/UserController';
import FavoriteController from '../controllers/FavoriteController';
import StripeController from '../controllers/StripeController';
import InventoryItemController from '../controllers/InventoryItemController';
import OrderController from '../controllers/OrderController';
import ProductController from '../controllers/ProductController';
import ReviewController from '../controllers/ReviewController';
import ShopController from '../controllers/ShopController';
import RecipeController from '../controllers/RecipeController';
import ShopGroupController from '../controllers/ShopGroupController';
import SubscriptionController from '../controllers/SubscriptionController';
import MailController from '../controllers/MailController';

const apiController = express.Router();

// Dynamic route to handle requests for any resource
apiController.use('/category', CategoryController);
apiController.use('/product', ProductController);
apiController.use('/order', OrderController);
apiController.use('/review', ReviewController);
apiController.use('/shop', ShopController);
apiController.use('/shopGroup', ShopGroupController);
apiController.use('/inventoryItem', InventoryItemController);
apiController.use('/subscription', SubscriptionController);
apiController.use('/user', UserController);
apiController.use('/auth', AuthController);
apiController.use('/favorite', FavoriteController);
apiController.use('/payment', StripeController);
apiController.use('/recipes', RecipeController);
// Used for testing emails
// apiController.use('/email', MailController);

export default apiController;
