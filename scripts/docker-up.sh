#!/bin/bash
# 本地 Docker 一键打包：重建 dev 容器(含本地 mongo) → 等就绪 → 健康检查 → 打印访问地址。
# 用法:
#   ./scripts/docker-up.sh            只做基础设施健康检查(不碰 LLM，不烧额度)
#   ./scripts/docker-up.sh --chat     额外打一发聊天冒烟(会消耗 LLM 额度/受限流影响)
# 原生最快 HMR 开发用 scripts/start.sh；这个用于整包 Docker 验证。
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT=3001
SERVICE=web
READY_TIMEOUT=60   # 秒

echo "▶ 重建并启动 dev 容器 (docker compose --profile dev up --build)…"
docker compose --profile dev up --build -d

echo "▶ 等待服务就绪 (轮询首页 200，最多 ${READY_TIMEOUT}s)…"
ready=""
for _ in $(seq 1 $((READY_TIMEOUT / 2))); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:$PORT/" || echo 000)
  if [ "$code" = "200" ]; then ready=1; break; fi
  sleep 2
done

if [ -z "$ready" ]; then
  echo "  ✗ 超时未就绪。最近日志："
  docker compose logs "$SERVICE" --tail 30
  exit 1
fi

# —— 健康检查 ——
status=$(docker compose ps "$SERVICE" --format '{{.Status}}' 2>/dev/null || echo '?')
model=$(docker compose exec -T "$SERVICE" sh -c 'echo $LLM_MODEL' 2>/dev/null | tr -d '\r' || echo '?')
count=$(curl -s --max-time 8 "http://localhost:$PORT/api/products" | grep -oE '"id":' | wc -l | tr -d ' ')

echo ""
echo "✓ 健康检查"
echo "  容器:   $status"
echo "  模型:   $model"
echo "  首页:   HTTP 200"
echo "  产品数: $count"

# —— 可选：聊天冒烟(会消耗 LLM 额度) ——
if [ "${1:-}" = "--chat" ]; then
  echo ""
  echo "▶ 聊天冒烟(消耗额度，可能受限流影响)…"
  reply=$(curl -s --max-time 40 -X POST "http://localhost:$PORT/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"你好"}]}' \
    | python3 -c "import sys,json;print(json.load(sys.stdin).get('reply','(空/超时)'))" 2>/dev/null || echo "(请求失败)")
  echo "  你好 → $reply"
fi

# —— 访问地址(手机同 WiFi) ——
ip=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo '你的电脑IP')
echo ""
echo "→ 本机     http://localhost:$PORT"
echo "→ 手机WiFi http://$ip:$PORT"
