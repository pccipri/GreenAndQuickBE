import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod'; // ZodTypeAny → ZodType
import { HttpError } from './errorHandler';

export const validate = (schema: ZodType, target: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req[target]);
      req[target] = validatedData;
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
