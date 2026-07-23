// vitest.setup.js
// 注入 @testing-library/jest-dom 的断言（toBeInTheDocument / toBeDisabled 等）。
// RTL 在 globals 开启时会自动 cleanup，无需手写。
import '@testing-library/jest-dom/vitest'
