#!/usr/bin/env bash
# 跳过系统依赖安装，仅部署应用（服务器已有 node/git/nginx 时使用）
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Yonyou_Red}"
BASE_PATH="${BASE_PATH:-/Yonyou_red}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"

echo "==> 检查环境..."
command -v node >/dev/null || { echo "未安装 node，请先安装 Node.js 18+"; exit 1; }
command -v git >/dev/null || { echo "未安装 git"; exit 1; }
echo "node $(node -v), npm $(npm -v)"

echo "==> 拉取代码..."
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone https://github.com/rararararabbit/Yonyou_Red.git "$APP_DIR"
  cd "$APP_DIR"
fi

[ -f .env ] || cp .env.example .env

echo "==> 构建..."
npm ci --registry="$NPM_REGISTRY"
export BASE_PATH="$BASE_PATH" NODE_ENV=production
npm run build

echo "==> 启动..."
command -v pm2 >/dev/null || npm install -g pm2 --registry="$NPM_REGISTRY"
pm2 start deploy/ecosystem.config.cjs --update-env 2>/dev/null || pm2 reload yonyou-red --update-env
pm2 save

echo "完成: http://123.56.7.111${BASE_PATH}/"
echo "如 nginx 未配置，请执行: cp deploy/nginx-server.conf /etc/nginx/conf.d/yonyou-red.conf && nginx -t && systemctl restart nginx"
