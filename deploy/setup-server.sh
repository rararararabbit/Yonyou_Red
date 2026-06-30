#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Yonyou_Red}"
BASE_PATH="${BASE_PATH:-/Yonyou_red}"
PORT="${PORT:-3001}"
REPO_URL="${REPO_URL:-https://github.com/rararararabbit/Yonyou_Red.git}"

echo "==> 安装系统依赖 (Node.js 20, nginx, git, pm2)..."
if command -v apt-get >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs nginx git
elif command -v yum >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  yum install -y nodejs nginx git
else
  echo "请手动安装 Node.js 20、nginx、git 后重新运行"
  exit 1
fi

npm install -g pm2

echo "==> 克隆/更新代码到 ${APP_DIR}..."
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

if [ ! -f "$APP_DIR/.env" ]; then
  echo "==> 创建 .env（请稍后编辑 SMTP 等配置）..."
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

echo "==> 安装依赖并构建..."
npm ci
export BASE_PATH="$BASE_PATH"
export NODE_ENV=production
npm run build

echo "==> 配置 nginx..."
cp "$APP_DIR/deploy/nginx-server.conf" /etc/nginx/conf.d/yonyou-red.conf
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> 启动应用 (pm2)..."
pm2 start "$APP_DIR/deploy/ecosystem.config.cjs" --update-env || pm2 reload yonyou-red --update-env
pm2 save
pm2 startup systemd -u root --hp /root || true

echo ""
echo "部署完成！访问地址："
echo "  http://123.56.7.111${BASE_PATH}/"
echo ""
echo "后续请编辑 ${APP_DIR}/.env 配置 SMTP 等密钥。"
