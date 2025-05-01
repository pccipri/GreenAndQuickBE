import express from 'express';
import CategoryController from '../controllers/CategoryController';

const apiController = express.Router();

// Dynamic route to handle requests for any resource
apiController.use('/category', CategoryController);

export default apiController;
