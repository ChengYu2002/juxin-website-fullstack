// src/agent/llm.js
// 作用：LLM 客户端封装（OpenAI 兼容，provider 可切换）+ 429 退避重试
// P1 只用它「纯对话」；P2 起会往里传 tools。

const { OpenAI } = require('openai')
const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = require('../utils/config')
const logger = require('../utils/logger')

if (!LLM_API_KEY) {
  // 不 throw，避免没配 key 时整个后端起不来；调用时再报错更友好
  logger.error('[llm] 缺少 LLM_API_KEY，/api/chat 将不可用（见 .env.example）')
}

const client = new OpenAI({ baseURL: LLM_BASE_URL, apiKey: LLM_API_KEY })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * 调模型，带 429 退避重试。
 * - 服务器会给 "Please retry in Xs"：几秒=分钟限流→照等重试；几十秒=日配额耗尽→直接报清楚。
 * @param {object} params - 传给 chat.completions.create 的参数（不含 model）
 */
async function callModel(params) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await client.chat.completions.create({ model: LLM_MODEL, ...params })
    } catch (err) {
      if (err.status !== 429) throw err

      const msg = err.error?.message || err.message || ''
      const suggested = parseFloat((msg.match(/retry in ([\d.]+)s/) || [])[1])

      if (suggested > 15) {
        const e = new Error('LLM 免费日配额已用尽，请稍后再试或更换模型')
        e.status = 429
        throw e
      }
      if (attempt >= 3) throw err

      const wait = suggested ? suggested * 1000 : 2000 * 2 ** attempt
      logger.info(`[llm] 撞到限流(429)，等 ${(wait / 1000).toFixed(1)}s 后重试…`)
      await sleep(wait)
    }
  }
}

/**
 * P1 纯对话：给一串 messages，返回助手回复文本。
 * （无工具、无记忆——工具在 P2、记忆在 P4 加）
 * @param {Array<{role,content}>} messages
 * @returns {Promise<string>} 助手回复
 */
async function chat(messages) {
  const res = await callModel({ messages })
  return res.choices[0].message.content
}

module.exports = { client, callModel, chat }
