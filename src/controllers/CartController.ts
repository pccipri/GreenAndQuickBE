import { Router, Request, Response } from 'express';
import { cartService } from '@/services/CartService';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireActiveUser } from '@/middlewares/isAuthenticated';
import { validate } from '@/middlewares/validate';
import { addToCartSchema, updateCartItemSchema } from '@/validations/cartValidation';
import { IdParams } from '@/models/generic/Routes';

const router = Router();

router.use(requireAuth, requireActiveUser);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.getCart(req.user!._id);
    res.json(cart);
  }),
);

router.post(
  '/items',
  validate(addToCartSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;
    const cart = await cartService.addItem(req.user!._id, productId, quantity);
    res.json(cart);
  }),
);

router.patch(
  '/items/:id',
  validate(updateCartItemSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const cart = await cartService.updateItemQuantity(
      req.user!._id,
      req.params.id,
      req.body.quantity,
    );
    res.json(cart);
  }),
);

router.delete(
  '/items/:id',
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const cart = await cartService.removeItem(req.user!._id, req.params.id);
    res.json(cart);
  }),
);

router.delete(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await cartService.clearCart(req.user!._id);
    res.json(result);
  }),
);

export default router;
