const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Users = require('../models/users.js')

router.post('/register', async (req, res) => {
  if (
    !req.body.first_name ||
    !req.body.last_name ||
    !req.body.company ||
    !req.body.email ||
    !req.body.password
  ) {
    res.status(406).json({
      message:
        'First name, last name, company, email, and password are required fields'
    })
    return
  }
  try {
    const [org] = await Users.newOrg({ name: req.body.company })
    req.body.password = bcrypt.hashSync(req.body.password, 8)
    const newUser = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      org_id: org,
      email: req.body.email,
      password: req.body.password,
      role: 'user'
    }
    const user = await Users.newUser(newUser)
    const token = generateToken(user)
    res.status(201).json({ token: token })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Server error creating new user' })
  }
})

router.post('/login', async (req, res) => {
  let { email, password } = req.body
  try {
    const user = await Users.getUser(email)
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = generateToken(user)
      res.status(200).json({ token })
    } else {
      res.status(401).json({ message: 'Invalid credentials' })
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Server error while logging in' })
  }
})

function generateToken(user) {
  const payload = {
    subject: user.id,
    email: user.email,
    role: user.role
  }

  const secret = process.env.JWT_SECRET || 'Secrets'

  const options = {
    expiresIn: '7d'
  }

  return jwt.sign(payload, secret, options)
}

module.exports = router