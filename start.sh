#!/usr/bin/env bash
# ============================================================
# Alpaca Trade — 一键启动脚本
# 本地模式：后端 (FastAPI) + 前端 (Vite dev server)
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Alpaca Trade — 期权交易终端              ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo -e "${RED}✗ 未找到 python3${NC}"
  exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ 未找到 node${NC}"
  exit 1
fi

# Kill any existing processes on our ports
for PORT in 8000 5173; do
  PID=$(lsof -ti:$PORT 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo -e "${YELLOW} 端口 $PORT 被占用，关闭进程 $PID...${NC}"
    kill -9 $PID 2>/dev/null || true
    sleep 0.5
  fi
done

# Start backend
echo -e "${GREEN}► 启动后端服务 (端口 8000)...${NC}"
python3 backend/main.py &
BACKEND_PID=$!
echo -e "  PID: $BACKEND_PID"

# Wait for backend to be ready
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端就绪${NC}"
    break
  fi
  sleep 0.5
done

# Start frontend dev server
echo -e "${GREEN}► 启动前端开发服务器 (端口 5173)...${NC}"
npx vite --host 0.0.0.0 &
FRONTEND_PID=$!
echo -e "  PID: $FRONTEND_PID"
sleep 2

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  启动成功！${NC}"
echo -e "${GREEN}  前端: http://localhost:5173              ${NC}"
echo -e "${GREEN}  后端: http://localhost:8000              ${NC}"
echo -e "${GREEN}  按 Ctrl+C 停止所有服务                   ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}  提示: 如需连接 Alpaca 交易，请创建 .env 文件${NC}"
echo -e "${YELLOW}  VITE_ALPACA_API_KEY=your_key            ${NC}"
echo -e "${YELLOW}  VITE_ALPACA_SECRET_KEY=your_secret      ${NC}"
echo ""

# Trap interrupt and kill both processes
trap "echo ''; echo -e '${YELLOW}正在停止服务...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '${GREEN}已停止${NC}'; exit 0" SIGINT SIGTERM

# Wait for either process to exit
wait
