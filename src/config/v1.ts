import express from 'express';
import CategoryController from '../controllers/CategoryController';
import AuthController from '../controllers/AuthController';
import UserController from '../controllers/UserController';

const apiController = express.Router();

// Dynamic route to handle requests for any resource
apiController.use('/category', CategoryController);
apiController.use('/user', UserController);
apiController.use('/auth', AuthController);

export default apiController;
