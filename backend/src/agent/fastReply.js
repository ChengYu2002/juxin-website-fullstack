// src/agent/fastReply.js
// 快车道：问候/闲聊这类"明确不涉及产品"的消息，用 qwen-flash 直答（无工具、无图、轻 prompt）。
// 比 qwen-plus 快 2-3 倍；安全，因为没有任何产品数据要复述——flash 也无从编造。
// 判定用"锚定的白名单正则"，稍带产品味就不命中 → 回主线 qwen-plus 安全路线。

const { ChatOpenAI } = require('@langchain/openai')
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages')
const { LLM_BASE_URL, LLM_API_KEY } = require('../utils/config')
const logger = require('../utils/logger')

const flash = new ChatOpenAI({
  model: 'qwen-flash',
  apiKey: LLM_API_KEY,
  temperature: 0.4, // 寒暄可以有点温度
  maxTokens: 96, // 寒暄就一两句，砍短=更快
  maxRetries: 1,
  configuration: { baseURL: LLM_BASE_URL },
})

// 尽量短：prompt 越短，flash 预填充越快
const FAST_PROMPT =
  '你是巨鑫售前助理 Jason（主营购物手推车、多用途手推车）。这是简单寒暄，用买家的语言友好回一句，顺势问对方想找什么产品或留个邮箱。别编产品型号/规格。'

// 明确的问候/闲聊白名单：整句锚定，命中即"纯寒暄"（带产品内容不会命中）
const CHITCHAT =
  /^(你好|您好|哈喽|嗨|hi|hello|hey|在吗|在不在|谢谢|多谢|thanks|thank\s*you|thx|ok|okay|好的|好嘞|嗯+|收到|辛苦了|拜拜|再见|bye|see\s*you|早上?好|中午好|下午好|晚上好|good\s*(morning|afternoon|evening|night)|请问|你是谁|你叫什么|who\s*are\s*you)[\s!！。.~,，?？、]*$/i

function isChitchat(text) {
  const t = String(text || '').trim()
  if (!t || t.length > 20) return false
  return CHITCHAT.test(t)
}

/**
 * flash 直答寒暄。
 * @param {Array<{role,content}>} messages - 前端历史（{role,content}）
 * @param {string} langDirective - 本轮语言指令（与主线一致）
 * @returns {Promise<string>}
 */
async function fastReply(messages, langDirective) {
  const lc = [
    new SystemMessage(FAST_PROMPT),
    ...messages.map((m) =>
      m.role === 'assistant' ? new AIMessage(m.content) : new HumanMessage(m.content),
    ),
    new SystemMessage(langDirective),
  ]
  const _t = Date.now()
  const res = await flash.invoke(lc)
  logger.info(`[chat] 快车道(flash) ${Date.now() - _t}ms`)
  return typeof res.content === 'string' ? res.content : JSON.stringify(res.content)
}

module.exports = { isChitchat, fastReply }
