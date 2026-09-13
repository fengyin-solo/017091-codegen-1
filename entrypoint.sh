#!/bin/sh
# 启动成功与访问地址（交付标准：启动后立即可见）
echo ""
echo "=============================================="
echo "  Startup Success"
echo "  Frontend Admin: http://localhost:8080"
echo "=============================================="
echo ""
exec nginx -g "daemon off;"
