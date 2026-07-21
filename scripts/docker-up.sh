#!/bin/bash
# =============================================================================
# docker-up.sh — 本地 Docker 一键打包 + 健康检查
# -----------------------------------------------------------------------------
# 作用：把整个应用(前端已构建进后端镜像 + 本地 mongo)用 Docker 起起来，
#       自动等它真正能服务了，再跑一串健康检查，最后打印访问地址。
#       省得每次手敲 `docker compose ... up --build`、`sleep`、`curl` 一长串。
#
# 用法：
#   ./scripts/docker-up.sh            基础设施健康检查(不调用 LLM，不消耗额度，限流期也安全)
#   ./scripts/docker-up.sh --chat     额外打一发聊天冒烟(会调用 LLM，消耗额度/受限流影响)
#
# 和 scripts/start.sh 的区别：
#   start.sh    = 原生开发(nodemon+vite)，改代码热更新最快，用于日常写代码。
#   docker-up.sh(本脚本) = 整包 Docker 验证，贴近生产运行方式，用于"打包看效果"。
#
# set -e：任何命令返回非 0 就立即退出，避免出错后还往下跑给出误导性的"成功"。
# =============================================================================
set -e

# 无论从哪个目录调用，都定位到仓库根目录再操作(docker-compose.yml 在根)。
# $0 = 脚本自身路径；dirname 取其所在目录；/.. 上到仓库根；pwd 转成绝对路径。
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# —— 可调参数 ——
PORT=3001            # 后端容器对外暴露的端口(docker-compose.yml 里映射的)
SERVICE=web          # compose 里的服务名
READY_TIMEOUT=60     # 等待"就绪"的最长秒数，超了判失败

# -----------------------------------------------------------------------------
# 1) 重建并后台启动
#    --profile dev : 才会一并起本地 mongo 容器(生产连 Atlas，不需要它)
#    --build       : 每次都重新构建镜像，确保跑的是最新代码(改动过才会真重建，靠缓存很快)
#    -d            : 后台运行(detached)，脚本才能继续往下做检查
# -----------------------------------------------------------------------------
echo "▶ 重建并启动 dev 容器 (docker compose --profile dev up --build)…"
docker compose --profile dev up --build -d

# -----------------------------------------------------------------------------
# 2) 等"真正就绪"
#    不等 docker 自带的 healthcheck(它可能还在 starting)，而是直接轮询首页是否返回 200
#    —— "能返回 200" 才是"应用真的能服务了"最可靠的信号。
#    每 2 秒探一次，最多 READY_TIMEOUT 秒。
# -----------------------------------------------------------------------------
echo "▶ 等待服务就绪 (轮询首页 200，最多 ${READY_TIMEOUT}s)…"
ready=""
for _ in $(seq 1 $((READY_TIMEOUT / 2))); do
  # -s 静默 / -o /dev/null 丢弃正文 / -w 只输出 HTTP 状态码 / 连不上则给 000
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:$PORT/" || echo 000)
  if [ "$code" = "200" ]; then ready=1; break; fi
  sleep 2
done

# 超时都没等到 200：打印最近日志帮定位，然后以失败码退出。
if [ -z "$ready" ]; then
  echo "  ✗ 超时未就绪。最近日志："
  docker compose logs "$SERVICE" --tail 30
  exit 1
fi

# -----------------------------------------------------------------------------
# 3) 健康检查(纯基础设施，不碰 LLM)
#    - 容器状态：docker 视角的运行/健康状态
#    - 模型：进容器读运行时 env，确认实际用的是哪个 LLM_MODEL(防 .env 配错)
#    - 产品数：调公开 API 数一下有多少产品，确认后端+DB 链路通、数据在
# -----------------------------------------------------------------------------
status=$(docker compose ps "$SERVICE" --format '{{.Status}}' 2>/dev/null || echo '?')
model=$(docker compose exec -T "$SERVICE" sh -c 'echo $LLM_MODEL' 2>/dev/null | tr -d '\r' || echo '?')
# 数 JSON 里 "id": 出现次数 ≈ 产品条数(够用的粗略校验)
count=$(curl -s --max-time 8 "http://localhost:$PORT/api/products" | grep -oE '"id":' | wc -l | tr -d ' ')

echo ""
echo "✓ 健康检查"
echo "  容器:   $status"
echo "  模型:   $model"
echo "  首页:   HTTP 200"
echo "  产品数: $count"

# -----------------------------------------------------------------------------
# 4) 可选：聊天冒烟(默认不做，因为会真调 LLM、消耗额度、还可能撞限流)
#    传 --chat 才执行：发一句"你好"，把回复取出来看一眼链路是否端到端通。
# -----------------------------------------------------------------------------
if [ "${1:-}" = "--chat" ]; then
  echo ""
  echo "▶ 聊天冒烟(消耗额度，可能受限流影响)…"
  reply=$(curl -s --max-time 40 -X POST "http://localhost:$PORT/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"你好"}]}' \
    | python3 -c "import sys,json;print(json.load(sys.stdin).get('reply','(空/超时)'))" 2>/dev/null || echo "(请求失败)")
  echo "  你好 → $reply"
fi

# -----------------------------------------------------------------------------
# 5) 打印访问地址
#    额外给出本机局域网 IP，方便手机连同一 WiFi 直接测(真机看移动端效果)。
#    ipconfig getifaddr en0 = macOS 取 Wi-Fi 网卡 IP；取不到就退回 Linux 的 hostname -I。
# -----------------------------------------------------------------------------
ip=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo '你的电脑IP')
echo ""
echo "→ 本机     http://localhost:$PORT"
echo "→ 手机WiFi http://$ip:$PORT"
