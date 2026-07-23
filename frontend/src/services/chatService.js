// src/services/chatService.js
// 售前 AI 助理对话接口（P1 纯对话）

/**
 * 发送对话历史，拿助手回复。
 * @param {Array<{role:'user'|'assistant', content:string}>} messages 完整对话历史（前端持有）
 * @param {string} [conversationId] 匿名会话 ID（localStorage）
 * @returns {Promise<{reply:string, conversationId:string|null}>}
 */
export async function sendChat(messages, conversationId) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, conversationId }),
  })

  if (!res.ok) {
    let errorMessage = 'Chat is temporarily unavailable. Please try again shortly.'
    try {
      const data = await res.json()
      if (data?.error) errorMessage = data.error
    } catch {
      // ignore JSON parse errors
    }
    const error = new Error(errorMessage)
    error.status = res.status
    throw error
  }

  return await res.json()
}
