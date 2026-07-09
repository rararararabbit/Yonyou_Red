#!/usr/bin/env bash
# 更新测试环境（不影响正式版 yonyou-red / 3001 / /Yonyou_red/）
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Yonyou_Red_test}"
BASE_PATH="${BASE_PATH:-/Yonyou_red_test}"
PORT="${PORT:-3002}"
BRANCH="${BRANCH:-main}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"

cd "$APP_DIR"

echo "==> [测试环境] 拉取代码 ($BRANCH)..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

[ -f .env ] || cp .env.test.example .env

echo "==> 安装依赖..."
npm ci --registry="$NPM_REGISTRY"

echo "==> 构建..."
export BASE_PATH="$BASE_PATH" PORT="$PORT" NODE_ENV=production DEPLOY_ENV=staging
npm run build

echo "==> 重启测试进程..."
pm2 reload yonyou-red-test --update-env || pm2 start deploy/ecosystem-test.config.cjs --update-env
pm2 save

echo "==> 测试环境部署完成: http://123.56.7.111${BASE_PATH}/"
