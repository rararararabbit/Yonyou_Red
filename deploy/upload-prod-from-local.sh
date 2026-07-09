#!/usr/bin/env bash
# 在本机 Mac 打包并上传到服务器正式目录（默认 Vol. 01，不影响测试环境）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_HOST="${SSH_HOST:-123.56.7.111}"
SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"
APP_DIR="${APP_DIR:-/var/www/Yonyou_Red}"
TARBALL="/tmp/yonyou-red-prod.tar.gz"

echo "==> 打包源码..."
staging="/tmp/yonyou-red-prod-src"
rm -rf "$staging" "$TARBALL"
mkdir -p "$staging"
rsync -a \
  --exclude node_modules \
  --exclude .git \
  --exclude dist \
  --exclude .env \
  --exclude deploy.tar.gz \
  --exclude yonyou-red-prod.tar.gz \
  "$ROOT/" "$staging/"
tar -czf "$TARBALL" -C "$staging" .

echo "==> 上传到 ${SSH_USER}@${SSH_HOST}:${APP_DIR} ..."
ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "mkdir -p '$APP_DIR'"
scp -P "$SSH_PORT" "$TARBALL" "${SSH_USER}@${SSH_HOST}:/tmp/yonyou-red-prod.tar.gz"

echo "==> 解压并在服务器构建（Vol. 01）..."
ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" bash -s <<REMOTE
set -euo pipefail
mkdir -p "$APP_DIR"
tar -xzf /tmp/yonyou-red-prod.tar.gz -C "$APP_DIR"
rm -f /tmp/yonyou-red-prod.tar.gz
export APP_DIR="$APP_DIR"
bash "$APP_DIR/deploy/build-on-server.sh"
REMOTE

echo ""
echo "==> 正式版部署完成"
echo "    正式版 (Vol. 01): http://${SSH_HOST}/Yonyou_red/"
echo "    测试版 (Vol. 02): http://${SSH_HOST}/Yonyou_red_test/"
