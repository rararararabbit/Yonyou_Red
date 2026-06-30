#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/Yonyou_Red}"
BASE_PATH="${BASE_PATH:-/Yonyou_red}"
PORT="${PORT:-3001}"
REPO_URL="${REPO_URL:-https://github.com/rararararabbit/Yonyou_Red.git}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"

log() { echo ""; echo "==> $*"; }

node_major_version() {
  node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1 || echo "0"
}

install_system_deps() {
  log "检查系统依赖..."

  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y curl git nginx ca-certificates
    if ! command -v node >/dev/null 2>&1 || [ "$(node_major_version)" -lt 18 ]; then
      log "安装 Node.js（优先使用系统源，避免 nodesource 超时）..."
      apt-get install -y nodejs npm || {
        log "系统源 Node 不可用，尝试 nodesource（可能较慢）..."
        curl -fsSL --connect-timeout 30 --max-time 120 https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
      }
    fi
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y curl git nginx ca-certificates
    if ! command -v node >/dev/null 2>&1 || [ "$(node_major_version)" -lt 18 ]; then
      log "安装 Node.js（优先使用系统源）..."
      dnf install -y nodejs npm || {
        log "系统源 Node 不可用，尝试 nodesource（可能较慢）..."
        curl -fsSL --connect-timeout 30 --max-time 120 https://rpm.nodesource.com/setup_20.x | bash -
        dnf install -y nodejs
      }
    fi
  elif command -v yum >/dev/null 2>&1; then
    yum install -y curl git nginx ca-certificates
    if ! command -v node >/dev/null 2>&1 || [ "$(node_major_version)" -lt 18 ]; then
      log "安装 Node.js（优先使用系统源）..."
      yum install -y nodejs npm || {
        log "系统源 Node 不可用，尝试 nodesource（可能较慢）..."
        curl -fsSL --connect-timeout 30 --max-time 120 https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
      }
    fi
  else
    echo "未检测到 apt/dnf/yum，请手动安装 Node.js 18+、git、nginx 后重试"
    exit 1
  fi

  log "当前版本: node $(node -v), npm $(npm -v), git $(git --version | head -1)"
}

install_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    log "pm2 已安装: $(pm2 -v)"
    return
  fi
  log "安装 pm2（使用国内 npm 镜像）..."
  npm install -g pm2 --registry="$NPM_REGISTRY"
}

clone_or_update_repo() {
  log "克隆/更新代码到 ${APP_DIR}..."
  mkdir -p "$(dirname "$APP_DIR")"
  if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git pull origin main
  else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
  fi

  if [ ! -f "$APP_DIR/.env" ]; then
    log "创建 .env（请稍后编辑 SMTP 等配置）..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  fi
}

build_app() {
  log "安装依赖并构建（npm 镜像: ${NPM_REGISTRY}）..."
  cd "$APP_DIR"
  npm ci --registry="$NPM_REGISTRY"
  export BASE_PATH="$BASE_PATH"
  export NODE_ENV=production
  npm run build
}

configure_nginx() {
  log "配置 nginx..."
  cp "$APP_DIR/deploy/nginx-server.conf" /etc/nginx/conf.d/yonyou-red.conf
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
}

start_app() {
  log "启动应用 (pm2)..."
  pm2 start "$APP_DIR/deploy/ecosystem.config.cjs" --update-env 2>/dev/null || pm2 reload yonyou-red --update-env
  pm2 save
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
}

log "开始部署智绘用友红..."
install_system_deps
install_pm2
clone_or_update_repo
build_app
configure_nginx
start_app

echo ""
echo "部署完成！访问地址："
echo "  http://123.56.7.111${BASE_PATH}/"
echo ""
echo "后续请编辑 ${APP_DIR}/.env 配置 SMTP 等密钥。"
