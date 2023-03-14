import { prisma } from '@database'
/**
 * @type {import('express').RequestHandler}
 */
export default async (req, res) => {
  const posts = await prisma.post.findMany()
  return res.json(posts)
}
