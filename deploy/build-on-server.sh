#!/usr/bin/env bash
# CI 同步代码后在服务器上构建并重启（不执行 git pull）
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Yonyou_Red}"
BASE_PATH="${BASE_PATH:-/Yonyou_red}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"

cd "$APP_DIR"

echo "==> 安装依赖..."
npm ci --registry="$NPM_REGISTRY"

echo "==> 构建生产包..."
export BASE_PATH="$BASE_PATH"
export NODE_ENV=production
npm run build

echo "==> 重启应用..."
pm2 reload yonyou-red --update-env 2>/dev/null || pm2 start deploy/ecosystem.config.cjs --update-env
pm2 save 2>/dev/null || true

echo "==> 部署完成: http://123.56.7.111${BASE_PATH}/"
