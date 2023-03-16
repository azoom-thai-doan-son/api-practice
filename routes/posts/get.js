import { prisma } from '@database'
import authentication from '@middleware/authentication'
/**
 * @type {import('express').RequestHandler}
 */
export default async (req, res) => {
  const { page, limit, keyword, authorId, orderBy, orderDirection } = req.query
  const _limit = (+page - 1) * +limit
  const take = +limit

  const posts = await prisma.post.findMany({
    where: {
      OR: [{ title: { contains: keyword } }, { body: { contains: keyword } }],
      AND: [{ authorId: { equals: authorId } }],
    },
    take,
    limit: _limit,
    orderBy: {
      [orderBy]: orderDirection,
    },
  })
  return res.status(200).json(posts)
}
