// src/utils/imageHost.js
// 图片双链路：默认走海外 CDN（img.juxin-manufacturing.com）；
// 探测到访客在中国大陆时，把 <img> 内嵌图换成杭州 OSS 源站直连
// （阿里云默认域名，免备案、国内不跨境；对 <img> 显示无影响）。
//
// 只改内嵌图。"查看原图"等 <a href> 链接**不要**用它改写——
// OSS 默认域名带 Content-Disposition: attachment，点开会触发下载而非预览，那种场景保持走 CDN。

export const CDN_HOST = 'https://img.juxin-manufacturing.com'
export const OSS_CN_HOST = 'https://juxin-images-cn.oss-cn-hangzhou.aliyuncs.com'

// region: 'CN' | 'OW'(overseas)。仅 CN 且 URL 属于 CDN host 时改写；其余一律原样返回（安全兜底）。
export function rewriteImageHost(url, region) {
  if (region !== 'CN' || typeof url !== 'string') return url
  if (url.startsWith(CDN_HOST + '/')) return OSS_CN_HOST + url.slice(CDN_HOST.length)
  return url
}
