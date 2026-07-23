import { defineConfig } from 'vitest/config'

// 后端是 CommonJS（package.json 无 "type"），测试文件用 require() 即可。
// globals: true → 无需从 'vitest' import describe/it/expect/vi。
// env.NODE_ENV=test → 复用源码里 logger 的静音开关、config.js 的 TEST_MONGODB_URI 分支。
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: { NODE_ENV: 'test' },
    include: ['tests/**/*.test.js'],
  },
})
