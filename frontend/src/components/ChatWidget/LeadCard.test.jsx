// src/components/ChatWidget/LeadCard.test.jsx
// 留资确认卡：发送前买家亲手核对。测校验门控、占位名、成功态、错误话术映射。
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LeadCard from './LeadCard'

const validLead = { name: 'Alice', email: 'alice@example.com', summary: 'Need 500 trolleys' }

function setup(lead = validLead, onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onCancel = vi.fn()
  const user = userEvent.setup()
  render(<LeadCard lead={lead} onSubmit={onSubmit} onCancel={onCancel} />)
  return { user, onSubmit, onCancel }
}

describe('LeadCard', () => {
  it('用 lead 预填三个字段（summary → message）', () => {
    setup()
    expect(screen.getByPlaceholderText('Website Visitor')).toHaveValue('Alice')
    expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('alice@example.com')
    expect(screen.getByRole('button', { name: /confirm and send/i })).toBeEnabled()
  })

  it('邮箱无效时禁用发送，并提示', async () => {
    const { user } = setup()
    const email = screen.getByPlaceholderText('you@example.com')
    await user.clear(email)
    await user.type(email, 'not-an-email')
    expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm and send/i })).toBeDisabled()
  })

  it('message 为空时禁用发送', async () => {
    const { user } = setup({ ...validLead, summary: '' })
    expect(screen.getByRole('button', { name: /confirm and send/i })).toBeDisabled()
    // 补上内容后恢复可用
    await user.type(screen.getByPlaceholderText(/Product, quantity/i), 'hi')
    expect(screen.getByRole('button', { name: /confirm and send/i })).toBeEnabled()
  })

  it('name 留空 → 提交占位名 Website Visitor（不动后端）', async () => {
    const { user, onSubmit } = setup({ ...validLead, name: '' })
    await user.click(screen.getByRole('button', { name: /confirm and send/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Website Visitor',
      email: 'alice@example.com',
      message: 'Need 500 trolleys',
    })
  })

  it('提交成功 → 显示 Sent 确认态', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /confirm and send/i }))
    expect(await screen.findByText(/Sent —/i)).toBeInTheDocument()
  })

  it('429 错误 → 映射成友好话术，不甩技术原文', async () => {
    const onSubmit = vi.fn().mockRejectedValue(Object.assign(new Error('duplicate submission'), { status: 429 }))
    const { user } = setup(validLead, onSubmit)
    await user.click(screen.getByRole('button', { name: /confirm and send/i }))
    expect(await screen.findByText(/already got this/i)).toBeInTheDocument()
    expect(screen.queryByText(/duplicate submission/i)).not.toBeInTheDocument()
  })

  it('点 ✗ 触发 onCancel', async () => {
    const { user, onCancel } = setup()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
