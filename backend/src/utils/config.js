require('dotenv').config()

const PORT = process.env.PORT || 3001

const MONGODB_URI =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI   // 测试时用这个
    : process.env.MONGODB_URI        // 平时用这个

// ---------- LLM (OpenAI 兼容, 可切换 provider) ----------
// provider 只靠这三个环境变量切换，代码不动（见 .env.example）
const LLM_BASE_URL = process.env.LLM_BASE_URL
const LLM_API_KEY = process.env.LLM_API_KEY
const LLM_MODEL = process.env.LLM_MODEL

module.exports = {
  MONGODB_URI,
  PORT,
  LLM_BASE_URL,
  LLM_API_KEY,
  LLM_MODEL,
}