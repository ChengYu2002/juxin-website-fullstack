// src/controllers/chatController.js
// 作用：POST /api/chat —— P2 带工具对话（LangGraph；无记忆，历史由前端整包传）
// 请求体：{ messages: [{role,content}], conversationId? }
// 响应：  { reply, conversationId }

const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages')
const { runAgent } = require('../agent/graph')
const { isChitchat, fastReply } = require('../agent/fastReply')
const { SYSTEM_PROMPT } = require('../agent/systemPrompt')
const logger = require('../utils/logger')

// 前端历史 {role,content} → LangChain 消息对象
function toLcMessages(messages) {
  return messages.map((m) =>
    m.role === 'assistant' ? new AIMessage(m.content) : new HumanMessage(m.content),
  )
}

// 根据买家最近一条消息的语言，生成"本轮用什么语言"的强指令。
// 系统提示整体是中文，短英文问句易被带偏成中文回复 → 用一条置于末尾的指令压住。
function languageDirective(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const hasCJK = /[㐀-鿿぀-ヿ가-힯]/.test(lastUser)
  return hasCJK
    ? '【本轮语言】买家用中文，请全程用中文回复，一个英文句子都不要夹。'
    : '【LANGUAGE】The buyer is NOT writing Chinese. Reply ENTIRELY in the buyer\'s language ' +
      '(the language of their latest message). Do NOT include ANY Chinese characters.'
}

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

    const directive = languageDirective(messages)
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''

    let reply
    if (isChitchat(lastUser)) {
      // 快车道：纯寒暄 → qwen-flash 直答（无工具、无图），快 2-3 倍
      reply = await fastReply(messages, directive)
    } else {
      // 主线：qwen-plus + 工具 + 防幻觉。system prompt 后端注入（防注入），
      // 末尾追加"本轮语言"指令压住中英混排/语言跑偏。
      const lcMessages = [
        new SystemMessage(SYSTEM_PROMPT),
        ...toLcMessages(messages),
        new SystemMessage(directive),
      ]
      reply = await runAgent(lcMessages)
    }

    res.json({ reply, conversationId: conversationId ?? null })
  } catch (err) {
    logger.error('[chat] 出错:', err.message)
    // 限流/配额等给前端友好提示，其余交给全局 errorHandler
    const status = err.status ?? err?.response?.status
    if (status === 429) {
      return res.status(429).json({ error: 'AI 暂时繁忙或配额已满，请稍后再试' })
    }
    next(err)
  }
}

module.exports = { postChat }
