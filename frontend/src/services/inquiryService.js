// src/services/inquiryService.js
// const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function submitInquiry({ name, email, message, company = '' }) {
  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    // company 是蜜罐字段：正常用户为空，机器人常填，后端据此拦截
    body: JSON.stringify({ name, email, message, company })
  })

  if (!res.ok) {
    let errorMessage = 'Failed to submit inquiry'
    try {
      const errorData = await res.json()
      if (errorData?.error) {
        errorMessage = errorData.error
      }
    } catch {
      // ignore JSON parse errors
    }

    const error = new Error(errorMessage)
    error.status = res.status
    throw error
  }

  return await res.json()
}