require('dotenv').config()

const PORT = process.env.PORT || 3001

const MONGODB_URI =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI   // 测试时用这个
    : process.env.MONGODB_URI        // 平时用这个

module.exports = {
  MONGODB_URI,
  PORT,
}