import { ROLE } from '@const/index'
import { prisma } from '@database'

/**
 * @type {import('express').RequestHandler}
 */
export default async (req, res) => {
  const {
    username,
    email,
    phoneNumber,
    password,
    gender,
    dateOfBirth,
    createdAt,
    updatedAt,
    role = ROLE.user,
  } = req.body
  console.log('body', req.body)

  const result = await prisma.user.create({
    data: {
      username,
      email,
      phoneNumber,
      password,
      gender,
      dateOfBirth,
      createdAt,
      updatedAt,
      role,
    },
  })
  return res.json(result)
}
