import { Request, Response } from 'express'

// Middleware to check if the user is authenticated
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: Function,
) => {
  if (req.user) {
    // User is authenticated, continue to the next middleware
    return next()
  } else {
    // User is not authenticated, return an error
    return res.status(401).json({ message: 'User is not logged in.' })
  }
}
