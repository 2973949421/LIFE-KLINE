#!/bin/bash

echo "=========================================="
echo "OpenCode Go API 测试脚本"
echo "=========================================="
echo ""

API_KEY="sk-ykrhEuzmR7Egf2wUmq0OWubAltpSYNx2NpubuhdQhWOoytpp0ANl3ozaQqueIo6z"
BASE_URL="https://opencode.ai/zen/go/v1/chat/completions"
MODEL="deepseek-v4-flash"

echo "测试 API 端点: $BASE_URL"
echo "使用模型: $MODEL"
echo ""

# 测试 API 调用
echo "发送测试请求..."
RESPONSE=$(curl -s -w "\n[HTTP_CODE]:%{http_code}" -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": \"你好，请简短回复\"}],
    \"max_tokens\": 20
  }")

HTTP_CODE=$(echo "$RESPONSE" | grep -o '\[HTTP_CODE\]:[0-9]*' | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed 's/\[HTTP_CODE\]:[0-9]*//g')

echo ""
echo "HTTP 状态码: $HTTP_CODE"
echo ""
echo "响应内容:"
echo "$BODY" | head -30
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API 测试成功！"
    echo ""
    echo "现在可以启动开发服务器:"
    echo "  pnpm dev"
    echo ""
    echo "然后访问 http://localhost:3000 测试完整功能"
else
    echo "❌ API 测试失败"
    echo ""
    echo "请检查:"
    echo "1. API Key 是否正确"
    echo "2. 网络连接是否正常"
    echo "3. OpenCode Go 账户是否有余额"
fi

echo ""
echo "=========================================="
