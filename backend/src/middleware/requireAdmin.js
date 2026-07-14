const jwt = require('jsonwebtoken')

const requireAdmin = (req, res, next) => {
  const authHeader = req.get('authorization') || ''
  const hasBearer = authHeader.toLowerCase().trim().startsWith('bearer ')

  if (!hasBearer) {
    return res.status(401).json({ ok: false, error: 'unauthorized: missing token' })
  }

  const token = authHeader.substring(7)

  if (!token) {
    return res.status(401).json({ ok: false, error: 'unauthorized: missing token' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

    if (
      !decodedToken ||
            decodedToken.username !== process.env.ADMIN_USERNAME ||
            decodedToken.role !== 'admin'
    ) {
      return res.status(403).json({ ok: false, error: 'forbidden: not admin' })
    }

    req.admin = decodedToken

    return next()

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, error: 'unauthorized: token expired' })
    }
    return res.status(401).json({ ok: false, error: 'unauthorized: invalid token' })
  }
}

module.exports = { requireAdmin }