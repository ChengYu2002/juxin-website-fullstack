// src/controllers/uploadController.js
const crypto = require('crypto')
const logger = require('../utils/logger')
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')

const OSS_REGION = process.env.OSS_REGION || 'cn-hangzhou'
const OSS_BUCKET = process.env.OSS_BUCKET
const OSS_ENDPOINT = process.env.OSS_ENDPOINT || `https://oss-${OSS_REGION}.aliyuncs.com`
const OSS_PUBLIC_BASE_URL = process.env.OSS_PUBLIC_BASE_URL

logger.info('[upload] OSS_REGION=', JSON.stringify(OSS_REGION))
logger.info('[upload] OSS_BUCKET=', JSON.stringify(OSS_BUCKET))
logger.info('[upload] OSS_ENDPOINT=', JSON.stringify(OSS_ENDPOINT))
logger.info('[upload] OSS_PUBLIC_BASE_URL=', JSON.stringify(OSS_PUBLIC_BASE_URL))

// 安全护栏：只允许操作这些域名下的图片
const ALLOWED_HOSTS = new Set([
  'img.juxin-manufacturing.com',                     // CDN
  'juxin-images-cn.oss-cn-hangzhou.aliyuncs.com',    // OSS
])

if (!OSS_BUCKET) {
  throw new Error('Missing env: OSS_BUCKET')
}


// 配置 S3 客户端
const oss = new S3Client({
  region: OSS_REGION,
  endpoint: OSS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    secretAccessKey: process.env.OSS_ACCESS_KEY_SECRET,
  },
  forcePathStyle: false,
})

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
// MIME 的基本格式: type/subtype 例如 image/jpeg，text/html，application/json 等等

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function buildPublicUrl(key) {
  // ✅ 优先用你配置的公开 base（CDN/自定义域名/桶域名）
  if (OSS_PUBLIC_BASE_URL) return `${OSS_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`

  // ⚠️ fallback兜底：按 endpoint 拼（不一定总对，取决于 OSS endpoint/桶策略）
  // 更推荐一定配 OSS_PUBLIC_BASE_URL
  const ep = OSS_ENDPOINT.replace(/\/$/, '')
  // 兼容常见格式：https://oss-cn-hangzhou.aliyuncs.com -> https://<bucket>.oss-cn-hangzhou.aliyuncs.com/<key>
  if (ep.includes('aliyuncs.com')) {
    const host = ep.replace(/^https?:\/\//, '')
    return `https://${OSS_BUCKET}.${host}/${key}`
  }
  return `${ep}/${OSS_BUCKET}/${key}`
}

// 从公开 URL 解析出对象 key
function keyFromUrl(imageUrl) {
  console.log('keyFromUrl imageUrl=', imageUrl)
  if (!imageUrl) {
    const err = new Error('Empty url')
    err.status = 400
    throw err
  }

  let u

  try {
    u = new URL(imageUrl)
  } catch {
    const err = new Error('Invalid url')
    err.status = 400
    throw err
  }

  // ✅ ① 域名白名单检验（最关键）
  if (!ALLOWED_HOSTS.has(u.hostname)) {
    const err = new Error(`Forbidden host: ${u.hostname}`)
    err.status = 400
    throw err
  }

  // ✅ ② 取 pathname 作为 key（去掉开头的 /）
  // 例如：/products/12345.jpg -> products/12345.jpg
  let key = decodeURIComponent(u.pathname.replace(/^\/+/, ''))

  // ✅ ③ 基础安全清洗（防奇怪路径）
  if (!key || key.includes('..') || key.includes('\\')) {
    const err = new Error('Invalid key')
    err.status = 400
    throw err
  }

  return key
}


async function deleteFromOSS(key) {
  if (!key) return

  // 安全护栏：只允许删 products/ 目录
  if (!key.startsWith('products/')) {
    const err = new Error('Invalid key prefix')
    err.status = 400
    throw err
  }

  await oss.send(new DeleteObjectCommand({
    Bucket: OSS_BUCKET,
    Key: key,
  }))
}

// input: array of urls, 不是 req/res， 设计不在router掉用
async function deleteBatchByUrls(urls = []) {
  const results = { ok: [], notFound: [], failed: [], skipped: [] }

  const keys = []
  for (const raw of urls || []) {
    const u = (raw && String(raw).trim()) || ''
    if (!u) continue

    try {
      const key = keyFromUrl(u)
      if (key) keys.push(key)
      else results.failed.push({ url: u, code: 'BadUrl', msg: 'keyFromUrl returned empty' })
    } catch (err) {
      results.failed.push({
        url: u,
        code: err?.name || 'BadUrl',
        msg: (err?.message && String(err.message)) || 'keyFromUrl threw',
      })
    }
  }

  const uniqueKeys = [...new Set(keys)]
  if (uniqueKeys.length === 0) return results

  for (const key of uniqueKeys) {
    // ✅ 安全护栏：不允许删非 products/，但不要整批 throw
    if (!key.startsWith('products/')) {
      results.skipped.push({ key, reason: 'invalid prefix' })
      continue
    }

    try {
      await oss.send(new DeleteObjectCommand({ Bucket: OSS_BUCKET, Key: key }))
      results.ok.push(key)
    } catch (err) {
      const code = err?.name || err?.Code || err?.code || ''
      const msg = (err?.message && String(err.message)) || ''

      const isNotFound =
        code === 'NoSuchKey' || code === 'NotFound' || /NoSuchKey|NotFound|404/i.test(msg)

      if (isNotFound) results.notFound.push(key)
      else results.failed.push({ key, code, msg })
    }
  }

  return results
}


exports.uploadImages = async (req, res, next) => {
  try {
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ ok: false, error: 'No files uploaded' })
    }

    // 保护：一次最多传多少张
    if (files.length > 5) {
      return res.status(400).json({ ok: false, error: 'Too many files (max 5)' })
    }

    const items = []

    for (const file of files) {
      const mime = file.mimetype || ''

      // 保护：只允许特定类型
      if (!ALLOWED_MIME.has(mime)) {
        return res.status(400).json({
          ok: false, error: `Invalid file type: ${mime}, Only jpg/png/webp images are allowed`
        })
      }

      // 保护：单个文件大小限制
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ ok: false, error: `File too large: ${file.originalname}` })
      }

      const ext = EXT_BY_MIME[mime] || 'bin'

      // ✅ 生成唯一 key：时间 + 随机 + 可读目录
      const rand = crypto.randomBytes(8).toString('hex')
      const key = `products/${Date.now()}-${rand}.${ext}`

      await oss.send(new PutObjectCommand({
        Bucket: OSS_BUCKET,
        Key: key,
        Body: file.buffer,	                			// multer 内存存储的 buffer
        ContentType: mime,            						// 设置正确的 MIME 类型
        ContentDisposition: 'inline',             // 强制浏览器预览而不是下载
        CacheControl: 'public, max-age=31536000', // 缓存一年
      })
      )

      items.push({
        key,
        url: buildPublicUrl(key),
        contentType: mime,
        size: file.size,
      })
    }

    return res.json({ ok: true, items })
  } catch (error) {
    return next(error)
  }
}

exports.deleteImage = async (req, res, next) => {
  try {
    const url = String(req.query.url || '').trim()

    if (!url) {
      return res.status(400).json({ ok: false, error: 'Missing url parameter' })
    }

    const key = keyFromUrl(url)
    await deleteFromOSS(key)
    return res.json({ ok: true })

  } catch (error) {
    return next(error)
  }
}

exports.deleteBatchByUrls = deleteBatchByUrls


