#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Yonyou_Red}"
BASE_PATH="${BASE_PATH:-/Yonyou_red}"

cd "$APP_DIR"

echo "==> 拉取最新代码..."
git fetch origin main
git reset --hard origin/main

echo "==> 安装依赖..."
npm ci

echo "==> 构建生产包..."
export BASE_PATH="$BASE_PATH"
export NODE_ENV=production
npm run build

echo "==> 重启应用..."
pm2 reload yonyou-red --update-env || pm2 start deploy/ecosystem.config.cjs --update-env

echo "==> 部署完成: http://123.56.7.111${BASE_PATH}/"
