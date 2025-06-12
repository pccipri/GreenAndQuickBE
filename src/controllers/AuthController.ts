import express from 'express'
import passport from 'passport'
import { isAuthenticated } from '../middlewares/isAuthenticated'

const router = express.Router()

// Get logged User
router.get('/getLoggedUser', (req, res) => {
  if (req.user) {
    res.json({ message: 'Logged user data', user: req.user })
  } else {
    res.status(204).json({ message: 'User not logged' })
  }
})

router.get('/isAuthenticated', (req, res) => {
  // Check if user is authenticated
  // You can implement any logic here to determine authentication status
  const isAuthenticated = req.isAuthenticated()

  res.status(200).json({ isAuthenticated })
})

// Login User
router.post('/login', (req, res, next) => {
  // Check if the user is already authenticated
  if (req.isAuthenticated()) {
    // If the user is already authenticated, return an error response
    res.status(400).json({ error: 'User is already logged in.' })
  }

  // If the user is not already authenticated, proceed with the authentication process
  passport.authenticate(
    'local',
    (err: Error, user: any, info: { message: string }) => {
      if (err) {
        return next(err)
      }
      if (!user) {
        // Authentication failed, return error response
        return res.status(401).json({ error: info.message })
      }
      // Authentication successful, log in the user
      req.login(user, err => {
        if (err) {
          return next(err)
        }

        // Return success response
        return res.status(200).json({ message: 'Login successfully.' })
      })
    },
  )(req, res, next)
})

// Logout route
router.post('/logout', isAuthenticated, (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err)
    }
    res.status(200).json({ message: 'Logged out successfully.' })
  })
})

export default router
