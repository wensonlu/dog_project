#!/bin/bash

echo "=== 前端状态检查 ==="
echo "前端端口 5173:"
lsof -ti:5173 > /dev/null && echo "✓ 前端服务正在运行" || echo "✗ 前端服务未运行"

echo ""
echo "=== 后端状态检查 ==="
echo "后端端口 5001:"
lsof -ti:5001 > /dev/null && echo "✓ 后端服务正在运行" || echo "✗ 后端服务未运行"

echo ""
echo "=== 后端健康检查 ==="
curl -s http://localhost:5001/health | jq . 2>/dev/null || curl -s http://localhost:5001/health

echo ""
echo "=== 后端API测试 ==="
echo "测试 /api/dogs:"
curl -s http://localhost:5001/api/dogs | head -100

echo ""
echo "=== 前端页面检查 ==="
echo "测试前端页面:"
curl -s http://localhost:5173 | grep -q "root" && echo "✓ 前端页面可访问" || echo "✗ 前端页面无法访问"
