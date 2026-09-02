import { Request, Response, NextFunction } from 'express';

import { ZodError, ZodType } from 'zod';

import { HttpError } from './errorHandler';

export const validate = (
  schema: ZodType,
  target: 'body' | 'query' | 'params' = 'body',
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req[target]);

      if (target === 'query') {
        Object.keys(req.query).forEach((key) => {
          delete (req.query as any)[key];
        });

        Object.assign(req.query, validatedData);
      } else {
        req[target] = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(new HttpError(400, 'validation.failed', details));
      }

      next(error);
    }
  };
};