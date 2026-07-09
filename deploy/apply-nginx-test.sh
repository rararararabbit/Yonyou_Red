#!/usr/bin/env bash
# 在服务器上运行：从备份恢复并正确添加 /Yonyou_red_test/
set -euo pipefail

CONF="${NGINX_CONF:-/etc/nginx/conf.d/default.conf}"
MARKER="Yonyou_red_test"

pick_backup() {
  for f in "${CONF}.bak.fix2" "${CONF}.bak.fix" "${CONF}.bak" "${CONF}.bak."*; do
    [ -f "$f" ] || continue
    if nginx -t -c /etc/nginx/nginx.conf 2>/dev/null; then
      :
    fi
    if grep -q "location /Yonyou_red/" "$f" && ! grep -q "unexpected" "$f" 2>/dev/null; then
      if ! grep -q "$MARKER" "$f" || grep -q "proxy_pass http://127.0.0.1:3001" "$f"; then
        echo "$f"
        return 0
      fi
    fi
  done
  ls -t "${CONF}.bak"* 2>/dev/null | head -1 || true
}

if grep -q "$MARKER" "$CONF" 2>/dev/null; then
  if nginx -t 2>/dev/null; then
    echo "==> 配置已存在且语法正确"
    curl -sI http://127.0.0.1/Yonyou_red_test/ | head -3
    exit 0
  fi
fi

BACKUP="$(pick_backup)"
if [ -n "$BACKUP" ] && [ -f "$BACKUP" ]; then
  echo "==> 从备份恢复: $BACKUP"
  cp "$BACKUP" "$CONF"
else
  echo "警告: 未找到备份，尝试修复当前文件"
fi

if grep -q "$MARKER" "$CONF"; then
  echo "==> 备份中已有 $MARKER，跳过插入"
else
  echo "==> 在 /Yonyou_red/ 块后插入测试 location ..."
  awk '
    BEGIN { inserted=0; after_red=0 }
    {
      print
      if (!inserted && /location \/Yonyou_red\/ \{/) after_red=1
      else if (after_red && /^[[:space:]]*\}[[:space:]]*$/) {
        print ""
        print "    location = /Yonyou_red_test {"
        print "        return 301 /Yonyou_red_test/;"
        print "    }"
        print ""
        print "    location /Yonyou_red_test/ {"
        print "        proxy_pass http://127.0.0.1:3002/Yonyou_red_test/;"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "        proxy_read_timeout 120s;"
        print "    }"
        inserted=1
        after_red=0
      }
    }
  ' "$CONF" > /tmp/nginx-yonyou-fixed.conf
  mv /tmp/nginx-yonyou-fixed.conf "$CONF"
fi

echo "==> 检查 nginx ..."
nginx -t
systemctl reload nginx

echo ""
echo "==> 探测:"
curl -sI http://127.0.0.1/Yonyou_red_test/ | head -5
grep -n "Yonyou_red" "$CONF"
