import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { isPasswordValid } from '../utils/encryption'
import { User } from '../schemas/UserSchema'
import { getUserById } from '../services/UserService'

passport.use(
  new LocalStrategy(
    {
      usernameField: 'usernameOrEmail', // Set the username field to accept either username or email
      passwordField: 'password',
    },
    async (usernameOrEmail: string, password: string, done) => {
      try {
        const user = await User.findOne({
          $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        })
        if (!user)
          return done(null, false, { message: 'Incorrect username or email.' })

        const isMatch = isPasswordValid(password, user.password)
        if (!isMatch)
          return done(null, false, { message: 'Incorrect password.' })

        return done(null, user)
      } catch (error) {
        return done(error)
      }
    },
  ),
)

passport.serializeUser((user: any, done) => {
  done(null, user._id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await getUserById(id)
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})
