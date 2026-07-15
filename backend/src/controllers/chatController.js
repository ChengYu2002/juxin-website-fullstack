// src/controllers/chatController.js
// 作用：POST /api/chat —— P1 纯对话（无工具、无记忆）
// 请求体：{ messages: [{role,content}], conversationId? }
// 响应：  { reply, conversationId }

const { chat } = require('../agent/llm')
const { SYSTEM_PROMPT } = require('../agent/systemPrompt')
const logger = require('../utils/logger')

async function postChat(req, res, next) {
  try {
    const { messages, conversationId } = req.body

    // —— 基础校验 ——
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 必须是非空数组' })
    }
    const ok = messages.every(
      (m) => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role),
    )
    if (!ok) {
      return res.status(400).json({ error: '每条 message 需含 role(user|assistant) 和 content(string)' })
    }

    // system prompt 由后端注入，不信任前端传的身份设定（防 prompt 注入）
    const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

    const reply = await chat(fullMessages)

    res.json({ reply, conversationId: conversationId ?? null })
  } catch (err) {
    logger.error('[chat] 出错:', err.message)
    // 限流等已知错误给前端友好提示，其余交给全局 errorHandler
    if (err.status === 429) {
      return res.status(429).json({ error: err.message })
    }
    next(err)
  }
}

module.exports = { postChat }
