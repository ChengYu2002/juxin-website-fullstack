// src/utils/logger
// A simple logger utility that logs messages to the console
// 打印所有信息，除了在测试环境下
// (...params): 使用剩余参数语法，表示函数可以接受任意数量的参数，并将它们收集到一个数组中，命名为params
const info = (...params) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(...params)
  }
}

const error = (...params) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(...params)
  }
}

module.exports = {
  info, error
}