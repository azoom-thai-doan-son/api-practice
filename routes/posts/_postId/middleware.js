/**
 * @type {import('express').RequestHandler}
 */
const getPost = async (req, res, next) => {
  req.post = await getPostById(req.params.postId)
  next()
}

/**
 * @type {import('express').RequestHandler}
 */
const verifyPermissionOnPost = async (req, res, next) => {}

export { getPost as middleware1, verifyPermissionOnPost as middleware2 }
