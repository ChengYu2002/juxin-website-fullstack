// src/services/geo.js
// 作用：通过 IP 获取地理位置信息（国家、大区）
// 注意：线上可能会慢/不稳定。这里失败返回 null，不影响主流程。

async function getGeoByIp(ip) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      country: data.country_name || null,
      region: data.region || null,
    }
  } catch {
    return null
  }
}

module.exports = { getGeoByIp }
