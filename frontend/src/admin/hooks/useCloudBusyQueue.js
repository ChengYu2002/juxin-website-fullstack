// src/admin/hooks/useCloudBusyQueue.js
import { useCallback, useRef, useState } from 'react'

/**
 * useCloudBusyQueue
 * 目标：让所有“云端操作”串行执行，并自动控制 BusyOverlay
 *
 * 用法：
 * const { busy, runCloudTask, isBusy } = useCloudBusyQueue({ onError: setError })
 * await runCloudTask('上传中...', async () => { ... })
 *
 * 特性：
 * - 串行队列：防止并发导致 overlay 提前关闭、状态错乱
 * - 自动开关 busy：不用在每个函数里 setBusy(true/false)
 * - 统一错误处理：可选 onError 回调
 */

export default function useCloudBusyQueue(options = {}) {
  const { onError } = options

  const [busy, setBusy] = useState({ open: false, text: '' })

  // 队列尾巴：所有任务都串到这个 promise 后面
  // useRef 用于在多次渲染间保持同一个引用, 渲染不会触发重新渲染
  const tailRef = useRef(Promise.resolve()) // promise.resolve() 初始值，表示“空队列”, 任务队列的队尾指针

  // 活跃任务计数：支持“极端情况”下并发任务也不会提前关 overlay
  const activeRef = useRef(0)

  // useCallback 确保函数引用稳定，每次 render 不要生成新函数
  const setBusyOpen = useCallback((open, text = '') => {
    setBusy({ open, text })
  }, [])

  const runCloudTask = useCallback(
    (text, taskFn) => {
      if (typeof taskFn !== 'function') {
        throw new Error('runCloudTask(text, taskFn): taskFn must be a function')
      }

      // 关键：把任务接到队列尾巴 -> 串行执行
      const run = async () => {
        try {
          activeRef.current += 1
      		setBusyOpen(true, text || '云端操作中，请耐心等候')

          const res = await taskFn()
          return res
        } catch (err) {
          // 统一错误出口：可交给页面 setError / toast
          const msg = err?.message ? String(err.message) : '云端操作失败'

          if (onError && typeof onError === 'function') {
            onError(msg)
          }
          throw err
        } finally {
          activeRef.current -= 1
          // 只有当最后一个任务结束，才关闭 overlay（更稳）
          if (activeRef.current <= 0) {
            activeRef.current = 0
            setBusyOpen(false, '')
          }
        }
      }

      // 串到 tail 后面；并确保即使前面失败，队列也不断（用 catch 吃掉 tail 的 rejection, 而不是显示rejection）
      const p = tailRef.current.catch(() => {}).then(run)
      tailRef.current = p
      return p

    },
    [onError, setBusyOpen]
  )

  const isBusy = busy.open

  return { busy, isBusy, runCloudTask }

}