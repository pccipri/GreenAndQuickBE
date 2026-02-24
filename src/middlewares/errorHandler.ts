import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  status: number;
  details?: any;
  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.status ?? 500;
  res.status(status).json({
    message: err?.message ?? 'Internal Server Error',
    ...(err?.details ? { details: err.details } : {}),
  });
}
