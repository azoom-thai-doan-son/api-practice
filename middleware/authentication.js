import jwt from 'jsonwebtoken'

/**
 * @type {import('express').RequestHandler}
 */
export default (req, res, next) => {
  if (!req.token)
    return res.status(403).send('A token is required for authentication')
  try {
    const payload = jwt.verify(req.token, process.env.JWT_SECRET_KEY)
    req.user = payload
  } catch (err) {
    return res.status(401).send('Invalid Token')
  }

  next()
}
