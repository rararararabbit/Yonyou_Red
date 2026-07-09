#!/usr/bin/env bash
# 首次在服务器上初始化测试环境（不影响正式版 /Yonyou_red/）
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Yonyou_Red_test}"
REPO_URL="${REPO_URL:-https://github.com/rararararabbit/Yonyou_Red.git}"
BRANCH="${BRANCH:-main}"
BASE_PATH="${BASE_PATH:-/Yonyou_red_test}"
PORT="${PORT:-3002}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"

echo "==> 测试环境目录: $APP_DIR"
echo "==> 访问路径: ${BASE_PATH}/"
echo "==> Node 端口: $PORT"

command -v node >/dev/null || { echo "未安装 Node.js 18+"; exit 1; }
command -v git >/dev/null || { echo "未安装 git"; exit 1; }

mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  echo "==> 目录已存在，跳过 clone"
else
  echo "==> 克隆仓库..."
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.test.example .env
  echo "==> 已创建 .env（请按需编辑 SMTP / API Key）"
else
  echo "==> 保留已有 .env"
fi

echo "==> 安装依赖并构建..."
npm ci --registry="$NPM_REGISTRY"
export BASE_PATH="$BASE_PATH" PORT="$PORT" NODE_ENV=production DEPLOY_ENV=staging
npm run build

command -v pm2 >/dev/null || npm install -g pm2 --registry="$NPM_REGISTRY"

if pm2 describe yonyou-red-test >/dev/null 2>&1; then
  pm2 reload yonyou-red-test --update-env
else
  pm2 start deploy/ecosystem-test.config.cjs --update-env
fi
pm2 save

echo ""
echo "==> 测试应用已启动 (PM2: yonyou-red-test, 端口 $PORT)"
echo ""
echo "==> 下一步：配置 Nginx（仅首次）"
echo "    1. 将 deploy/nginx-test-location.conf 内容追加到 nginx 的 server 块"
echo "    2. 或执行:"
echo "       sudo cp deploy/nginx-test-location.conf /etc/nginx/snippets/yonyou-red-test.conf"
echo "       并在 server { } 内加一行: include /etc/nginx/snippets/yonyou-red-test.conf;"
echo "    3. sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "==> 测试地址: http://123.56.7.111${BASE_PATH}/"
echo "==> 正式版不受影响: http://123.56.7.111/Yonyou_red/"
