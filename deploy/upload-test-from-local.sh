#!/usr/bin/env bash
# 在本机 Mac 打包并上传到服务器测试目录（服务器无法 git clone GitHub 时使用）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_HOST="${SSH_HOST:-123.56.7.111}"
SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"
APP_DIR="${APP_DIR:-/var/www/Yonyou_Red_test}"
TARBALL="/tmp/yonyou-red-test.tar.gz"

echo "==> 打包源码（排除 node_modules / dist / .git）..."
staging="/tmp/yonyou-red-test-src"
rm -rf "$staging" "$TARBALL"
mkdir -p "$staging"
rsync -a \
  --exclude node_modules \
  --exclude .git \
  --exclude dist \
  --exclude .env \
  --exclude deploy.tar.gz \
  --exclude yonyou-red-test.tar.gz \
  "$ROOT/" "$staging/"
tar -czf "$TARBALL" -C "$staging" .

echo "==> 上传到 ${SSH_USER}@${SSH_HOST}:${APP_DIR} ..."
ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "mkdir -p '$APP_DIR'"
scp -P "$SSH_PORT" "$TARBALL" "${SSH_USER}@${SSH_HOST}:/tmp/yonyou-red-test.tar.gz"

echo "==> 解压并在服务器构建..."
ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" bash -s <<REMOTE
set -euo pipefail
mkdir -p "$APP_DIR"
tar -xzf /tmp/yonyou-red-test.tar.gz -C "$APP_DIR"
rm -f /tmp/yonyou-red-test.tar.gz
export APP_DIR="$APP_DIR"
bash "$APP_DIR/deploy/build-test-on-server.sh"
REMOTE

echo ""
echo "==> 上传部署完成"
echo "    测试地址: http://${SSH_HOST}/Yonyou_red_test/"
echo ""
echo "若尚未配置 Nginx，在服务器执行："
echo "  sudo cp $APP_DIR/deploy/nginx-test-location.conf /etc/nginx/snippets/yonyou-red-test.conf"
echo "  并在 server { } 内添加: include /etc/nginx/snippets/yonyou-red-test.conf;"
echo "  sudo nginx -t && sudo systemctl reload nginx"
