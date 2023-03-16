import { prisma } from '@database'
import bcrypt from 'bcrypt'

/**
 * @type {import('express').RequestHandler}
 */
export default async (req, res) => {
  const { username, email, phoneNumber, password, gender, dateOfBirth, role } =
    req.body

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phoneNumber }],
    },
  })

  if (user) {
    if (user.email === email) {
      return res.status(400).send('Email already exists!')
    }
    if (user.phoneNumber === phoneNumber) {
      return res.status(400).send('Phone number already exists')
    }
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const result = await prisma.user.create({
    data: {
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      gender,
      dateOfBirth,
      role,
    },
  })
  return res.status(200).send('User created')
}
