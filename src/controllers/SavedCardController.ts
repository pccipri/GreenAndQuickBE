import { Router, Request, Response } from 'express';
import { savedCardService } from '@/services/SavedCardService';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireActiveUser } from '@/middlewares/isAuthenticated';
import { IdParams } from '@/models/generic/Routes';

const router = Router();
router.use(requireAuth, requireActiveUser);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const cards = await savedCardService.list(req.user!._id);
    res.json(cards);
  }),
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentMethodId } = req.body;
    const fullName = `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim();

    const card = await savedCardService.attach(
      req.user!._id,
      req.user!.email,
      fullName || req.user!.username,
      paymentMethodId,
    );

    res.status(201).json(card);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const result = await savedCardService.remove(req.user!._id, req.params.id);
    res.json(result);
  }),
);

router.patch(
  '/:id/default',
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const card = await savedCardService.setDefault(req.user!._id, req.params.id);
    res.json(card);
  }),
);

export default router;
