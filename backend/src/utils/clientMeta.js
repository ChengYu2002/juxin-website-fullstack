// src/utils/clientMeta.js

function getClientMeta(req) {
  const ip =
    (req.headers['x-forwarded-for']?.toString().split(',')[0] || '').trim() ||
      req.ip

  const userAgent = req.headers['user-agent'] || 'unknown'

  return { ip, userAgent }
}

module.exports = { getClientMeta }