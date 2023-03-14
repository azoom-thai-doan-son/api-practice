const bearerPrefix = 'Bearer '

/**
 * Get `Bearer` token
 * @type {import('express').RequestHandler}
 */
export default (req, res, next) => {
  const { authorization } = req.headers
  if (authorization && authorization.startsWith(bearerPrefix)) {
    req.token = authorization.slice(bearerPrefix.length)
  }
  next()
}
