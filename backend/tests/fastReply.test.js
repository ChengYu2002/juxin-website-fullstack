// tests/fastReply.test.js
// isChitchat：寒暄白名单正则。命中=纯寒暄走快车道；带产品味/超长/空 → 不命中回主线。
const { isChitchat } = require('../src/agent/fastReply')

describe('isChitchat', () => {
  it('命中常见问候/闲聊（中英）', () => {
    for (const t of ['你好', '您好', 'hi', 'hello', '在吗', '谢谢', 'thanks', 'ok', '再见', 'good morning', '你是谁']) {
      expect(isChitchat(t)).toBe(true)
    }
  })

  it('允许句尾标点/波浪线', () => {
    expect(isChitchat('你好！')).toBe(true)
    expect(isChitchat('hello~')).toBe(true)
    expect(isChitchat('在吗？？')).toBe(true)
  })

  it('带产品味的句子不命中（回主线更安全）', () => {
    for (const t of ['你好，JX-160SP 的 MOQ 是多少', '有购物手推车吗', 'what is the load capacity', '推荐一款露营车']) {
      expect(isChitchat(t)).toBe(false)
    }
  })

  it('超过 20 字直接不算寒暄', () => {
    expect(isChitchat('你好'.repeat(11))).toBe(false)
  })

  it('空/非字符串安全兜底', () => {
    expect(isChitchat('')).toBe(false)
    expect(isChitchat('   ')).toBe(false)
    expect(isChitchat(null)).toBe(false)
    expect(isChitchat(undefined)).toBe(false)
  })
})
