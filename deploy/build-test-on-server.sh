#!/usr/bin/env bash
# 在服务器上构建并重启测试环境（代码已通过 scp/tar 同步，无需 git）
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Yonyou_Red_test}"
BASE_PATH="${BASE_PATH:-/Yonyou_red_test}"
PORT="${PORT:-3002}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.test.example .env
  echo "==> 已创建 .env，请按需编辑 SMTP 等配置"
fi

echo "==> 安装依赖..."
npm ci --registry="$NPM_REGISTRY"

echo "==> 构建测试包（默认 Vol. 02）..."
export BASE_PATH="$BASE_PATH" PORT="$PORT" NODE_ENV=production DEPLOY_ENV=staging
export VITE_DEFAULT_VOLUME=vol-02
npm run build:test

echo "==> 启动/重启测试进程..."
command -v pm2 >/dev/null || npm install -g pm2 --registry="$NPM_REGISTRY"
pm2 reload yonyou-red-test --update-env 2>/dev/null \
  || pm2 start deploy/ecosystem-test.config.cjs --update-env
pm2 save 2>/dev/null || true

echo "==> 测试环境就绪: http://123.56.7.111${BASE_PATH}/"
