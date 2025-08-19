import express from 'express'
import passport from 'passport'
import { Request, Response } from 'express'
import jwt from "jsonwebtoken"
import { IVerifyOptions } from 'passport-local'
import { requireAuth } from '../middlewares/isAuthenticated'
import { createRefreshToken, generateAccessToken } from '../utils/tokens'
import { RefreshToken } from '../schemas/RefreshTokenSchema'
import { IUser } from '../models/IUser'

const router = express.Router()

router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, async (err: Error | null, user: IUser | false, info: IVerifyOptions | undefined) => {
    if (err) return next(err)
    if (!user) return res.status(401).json({ error: info?.message || "Login failed" })

    // Access token
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "15m" }
    )

    // Refresh token (DB + cookie)
    const refreshToken = await createRefreshToken(user._id.toString())
    res.cookie("refreshToken", refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 4 * 24 * 60 * 60 * 1000,
    })

    res.json({ message: "Login successful", accessToken })
  })(req, res, next)
})

router.post('/refreshToken', async (req: Request, res: Response) => {
  const refreshTokenValue = req.cookies.refreshToken
  if (!refreshTokenValue) res.status(401).json({ error: 'No refresh token' })

  const storedToken = await RefreshToken.findOne({ token: refreshTokenValue, isValid: true })
  if (!storedToken) { res.status(403).json({ error: 'Invalid or expired refresh token' }); return; }
  if (storedToken.expiresAt < new Date()) {
    storedToken.isValid = false
    await storedToken.save()
    res.status(403).json({ error: 'Refresh token expired' })
  }

  // Rotate: invalidate old token
  storedToken.isValid = false
  await storedToken.save()

  // Issue new tokens
  const payload = { id: storedToken.userId }
  const accessToken = generateAccessToken(payload)
  const newRefreshToken = await createRefreshToken(storedToken.userId.toString())

  // Send new refresh in cookie
  res.cookie('refreshToken', newRefreshToken.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 4 * 24 * 60 * 60 * 1000,
  })

  res.json({ accessToken })
})

router.post("/logout", async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken
  if (token) {
    await RefreshToken.updateOne({ token }, { isValid: false })
    res.clearCookie("refreshToken")
  }
  res.json({ message: "Logged out" })
})

router.get('/getLoggedUser', requireAuth, (req: Request, res: Response) => {
  res.json({ message: 'Logged user data', user: req.user })
})

export default router
