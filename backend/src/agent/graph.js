// src/agent/graph.js
// P2 编排：LangGraph StateGraph
//   START → agent(调模型,带工具) → 有 tool_calls? ─是→ tools(执行,喂回) → 回 agent
//                                            └─否→ END(出最终回答)
// 模型：主线走 LLM_MODEL(生产=qwen-plus) via DashScope OpenAI-兼容端点，用 ChatOpenAI 指过去。
//       （纯寒暄另走 fastReply.js 的 qwen-flash 快车道，不经本图。）

const { ChatOpenAI } = require('@langchain/openai')
const { StateGraph, MessagesAnnotation, START, END } = require('@langchain/langgraph')
const { ToolNode } = require('@langchain/langgraph/prebuilt')
const { HumanMessage, ToolMessage, SystemMessage } = require('@langchain/core/messages')

const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = require('../utils/config')
const { tools } = require('./tools')
const { getPublicByIdOrSlug } = require('../services/productService')
const logger = require('../utils/logger')

const baseModel = new ChatOpenAI({
  model: LLM_MODEL,
  apiKey: LLM_API_KEY,
  temperature: 0, // 尽量忠实复述工具数值，减少数字被"改写/张冠李戴"
  maxTokens: 640, // 封顶回复长度：安全的硬上限，配合简洁 prompt 兜住极端长回复
  maxRetries: 2, // 瞬时限流让 SDK 自己退避重试；日配额耗尽会抛错，由 controller 兜底
  configuration: { baseURL: LLM_BASE_URL },
})
const model = baseModel.bindTools(tools) // 默认 auto：模型自己决定要不要调工具
const modelForced = baseModel.bindTools(tools, { tool_choice: 'required' }) // 强制必须调一个工具

const toolNode = new ToolNode(tools)

// 产品类意图：命中就强制第一轮调工具，杜绝"跳过工具直接编产品"。
// 正则只是"尽量多命中"，真正的兜底是下面 runAgent 里的链接对库校验。
const PRODUCT_HINT =
  /推荐|有哪些|哪些|哪款|哪种|哪个|几款|选择|适合|有没有|有吗|型号|规格|参数|moq|起订|装箱|装柜|集装箱|尺寸|重量|净重|毛重|承重|载|轮|颜色|红色|橙色|黄色|绿色|蓝色|青色|紫色|黑色|白色|灰色|粉色|棕色|折叠|手推车|购物车|拖车|推车|产品|买菜|购物|逛超市|搬家|搬运|搬东西|搬|重物|大件|用啥|用什么|trolley|cart|wagon|red|orange|yellow|green|blue|purple|black|white|gr[ea]y|pink|brown|jx[-\s]?\w/i

function latestUserText(msgs) {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i] instanceof HumanMessage) return String(msgs[i].content || '')
  }
  return ''
}

// agent 节点：调模型。产品类问题的"第一轮"（还没有任何工具结果）强制调工具，防止凭空编造。
// config.configurable.forceProductTool = true 时无条件强制（用于校验失败后的纠正重试）。
async function agentNode(state, config) {
  const msgs = state.messages
  const hasToolResult = msgs.some((m) => m instanceof ToolMessage)
  const forceCfg = config?.configurable?.forceProductTool === true
  const forceTool = !hasToolResult && (forceCfg || PRODUCT_HINT.test(latestUserText(msgs)))
  const _t = Date.now()
  const res = await (forceTool ? modelForced : model).invoke(msgs)
  logger.info(`[agent] 模型往返 ${Date.now() - _t}ms (forced=${forceTool}, 有tool_calls=${!!res.tool_calls?.length})`)
  if (res.tool_calls?.length) {
    logger.info(
      `[agent]${forceTool ? '(forced)' : ''} tool_calls →`,
      res.tool_calls.map((t) => `${t.name}(${JSON.stringify(t.args)})`).join(', '),
    )
  }
  return { messages: [res] }
}

// 兜底校验：回复里每个 /products/<id> 链接都必须在库里真实存在，否则判为幻觉
async function hasFakeProductLink(text) {
  const ids = [...String(text).matchAll(/\/products\/([a-z0-9][a-z0-9_-]*)/gi)].map((m) =>
    m[1].toLowerCase(),
  )
  for (const id of [...new Set(ids)]) {
    if (!(await getPublicByIdOrSlug(id))) {
      logger.info(`[agent] 检测到不存在的产品链接: /products/${id}`)
      return true
    }
  }
  return false
}

// 条件边：最后一条 AI 消息有 tool_calls 就去执行工具，否则结束
function shouldContinue(state) {
  const last = state.messages[state.messages.length - 1]
  return last.tool_calls?.length ? 'tools' : END
}

// 构建LangGraph StateGraph：START → agent → (有tool_calls? → tools → agent) → END
const workflow = new StateGraph(MessagesAnnotation)
  .addNode('agent', agentNode)
  .addNode('tools', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue, ['tools', END])
  .addEdge('tools', 'agent')

const compiled = workflow.compile()

function lastText(result) {
  const last = result.messages[result.messages.length - 1]
  return typeof last.content === 'string' ? last.content : JSON.stringify(last.content)
}

const FALLBACK =
  '抱歉，我需要再核对一下具体型号。方便留个邮箱吗？我让业务同事把准确的产品清单和资料发给您。'

/**
 * 跑一轮 agent，并做"链接对库校验"兜底：
 * 1) 正常跑；2) 若回复含不存在的产品链接 → 强制调工具重试一次；3) 仍有假链接 → 安全兜底话术。
 * @param {import('@langchain/core/messages').BaseMessage[]} messages - 含 system 的完整消息数组
 * @returns {Promise<string>} 最终助手回复文本
 */
async function runAgent(messages) {
  let text = lastText(await compiled.invoke({ messages }))
  if (!(await hasFakeProductLink(text))) return text

  // 纠正重试：追加强提示 + 无条件强制调工具
  logger.info('[agent] 幻觉兜底：强制调工具重试')
  const corrective = [
    ...messages,
    new SystemMessage(
      '警告：你上一轮提到了数据库里不存在的型号。只能推荐 searchProducts 返回的真实型号，' +
        '必须先调用工具、只用工具返回的 id 和 path，严禁编造任何型号或链接。请重新作答。',
    ),
  ]
  text = lastText(await compiled.invoke({ messages: corrective }, { configurable: { forceProductTool: true } }))
  if (await hasFakeProductLink(text)) {
    logger.info('[agent] 幻觉兜底：重试后仍有假链接，返回兜底话术')
    return FALLBACK
  }
  return text
}

module.exports = { runAgent, compiled }
