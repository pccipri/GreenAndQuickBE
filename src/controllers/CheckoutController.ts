import { Router, Request, Response } from 'express';
import { checkoutService } from '@/services/CheckoutService';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireActiveUser } from '@/middlewares/isAuthenticated';

const router = Router();

router.use(requireAuth, requireActiveUser);

/**
 * POST /checkout/cash
 * Process Cash on Delivery checkout
 */
router.post(
  '/cash',
  asyncHandler(async (req: Request, res: Response) => {
    const { deliveryAddress } = req.body;
    const orders = await checkoutService.checkoutCash(req.user!._id, deliveryAddress);
    res.status(201).json(orders);
  }),
);

/**
 * POST /checkout/card
 * Initialize Stripe Card checkout
 */
router.post(
  '/card',
  asyncHandler(async (req: Request, res: Response) => {
    const { deliveryAddress, saveCard, saveAddress } = req.body;
    const fullName = `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim();

    const paymentIntents = await checkoutService.checkoutCard(
      req.user!._id,
      req.user!.email,
      fullName || req.user!.username,
      deliveryAddress,
      saveCard,
      saveAddress,
    );

    res.json(paymentIntents);
  }),
);

export default router;
