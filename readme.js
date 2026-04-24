export default async function handler(req, res) {
    // 1. 获取访客的真实 IP (Vercel 提供的请求头)
    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '127.0.0.1';

    let quality = "纯净 ✅";
    let isp = "未知运营商";
    let country = "未知";

    try {
        // 2. 调用免费的 ip-api 接口获取 IP 信息和风险特征
        // 注意：ip-api 免费版有频次限制，如果流量大，建议替换为带 API Key 的商业接口 (如 ipinfo.io 或 proxycheck)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,isp,proxy,hosting`);
        const data = await response.json();

        if (data.status === "success") {
            isp = data.isp;
            country = data.country;
            // 简单判断 IP 质量：如果是代理或机房 IP，则标记风险提示
            if (data.proxy || data.hosting) {
                quality = "代理/VPN/机房 ⚠️";
            }
        }
    } catch (e) {
        console.error("API Error");
    }

    // 3. 动态拼接生成 SVG 图片 (可以根据个人喜好修改颜色和样式)
    const svg = `
  <svg width="460" height="120" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1e1e2e" rx="8"/>
    <text x="20" y="35" font-family="'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif" font-weight="bold" font-size="16" fill="#cba6f7">🔍 访客网络信息</text>
    <text x="20" y="65" font-family="'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', monospace" font-size="14" fill="#a6e3a1">IP 地址：${ip}</text>
    <text x="20" y="85" font-family="'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', monospace" font-size="14" fill="#89b4fa">运营商/地区：${isp}（${country}）</text>
    <text x="20" y="105" font-family="'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', monospace" font-size="14" fill="${quality.includes('⚠️') ? '#f38ba8' : '#a6e3a1'}">IP 质量：${quality}</text>
  </svg>
  `;

    // 4. 设置响应头，伪装成图片并强制不缓存（确保访客每次刷新都会重新获取最新数据）
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.status(200).send(svg);
}
