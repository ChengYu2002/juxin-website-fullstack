// src/lib/site.js
// 站点级 SEO 常量。集中一处,方便统一改。
//
// 线上真实域名(canonical / og:url 基于它)。已确认为 www 开头。
export const SITE_URL = 'https://www.juxin-manufacturing.com'

export const SITE_NAME = 'Juxin Manufacturing'

export const DEFAULT_DESCRIPTION =
  'Juxin Manufacturing — China-based OEM/ODM manufacturer of shopping trolleys, utility carts, camping wagons and outdoor furniture. MOQ from 1000 pcs, export-ready packing, audited facilities.'

// 默认社交分享图(Open Graph)
export const DEFAULT_OG_IMAGE = 'https://img.juxin-manufacturing.com/website/1-1920.webp'

export const LOGO_URL = 'https://img.juxin-manufacturing.com/website/logo.svg'

// 拼接绝对 URL(path 以 / 开头)
export function absoluteUrl(path = '') {
  const base = SITE_URL.replace(/\/$/, '')
  if (!path) return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
