// src/admin/auth.test.js
// admin JWT 在 localStorage 的读/写/清除。jsdom 提供 localStorage。
import { describe, it, expect, beforeEach } from 'vitest'
import { setAdminToken, getAdminToken, clearAdminToken } from './auth'

describe('admin auth token 存储', () => {
  beforeEach(() => localStorage.clear())

  it('未设置时 getAdminToken 返回 null', () => {
    expect(getAdminToken()).toBeNull()
  })

  it('set 后能 get 到同一个 token', () => {
    setAdminToken('jwt-abc.123')
    expect(getAdminToken()).toBe('jwt-abc.123')
    expect(localStorage.getItem('admin_jwt')).toBe('jwt-abc.123')
  })

  it('clear 后再 get 返回 null', () => {
    setAdminToken('to-be-cleared')
    clearAdminToken()
    expect(getAdminToken()).toBeNull()
  })
})
