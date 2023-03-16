import { prisma } from '@database'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const issueToken = payload => {
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: '2h',
  })
  return token
}

/**
 * @type {import('express').RequestHandler}
 */
export default async (req, res) => {
  const { emailOrPhoneNumber, password } = req.body
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrPhoneNumber }, { phoneNumber: emailOrPhoneNumber }],
    },
  })
  if (!user) return res.status(400).send("Email or Phone number doesn't exist")

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) return res.status(400).send('Incorrect password')

  const accessToken = issueToken({ id: user.id })
  return res.status(200).json({ accessToken })
}
