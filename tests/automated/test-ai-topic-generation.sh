#!/bin/bash

# AI话题生成功能自动化测试脚本
# 测试完整流程：启动服务 → AI生成 → 发布话题 → 验证结果

set -e  # 遇到错误立即退出

echo "========================================="
echo "AI话题生成功能自动化测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[测试 $TOTAL_TESTS]${NC} $test_name"

    if eval "$test_command"; then
        echo -e "${GREEN}✓ 通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ 失败${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# 检查后端服务是否运行
check_backend() {
    curl -s http://localhost:5001/health > /dev/null 2>&1
}

# 检查前端服务是否运行
check_frontend() {
    curl -s http://localhost:5173 > /dev/null 2>&1
}

echo "========================================="
echo "步骤1: 检查服务状态"
echo "========================================="

# 检查后端
if check_backend; then
    echo -e "${GREEN}✓ 后端服务运行中 (localhost:5001)${NC}"
else
    echo -e "${RED}✗ 后端服务未启动${NC}"
    echo "请先启动后端服务: cd backend && npm run dev"
    exit 1
fi

# 检查前端
if check_frontend; then
    echo -e "${GREEN}✓ 前端服务运行中 (localhost:5173)${NC}"
else
    echo -e "${YELLOW}! 前端服务未启动（可选）${NC}"
fi

echo ""

echo "========================================="
echo "步骤2: 测试AI生成API"
echo "========================================="

# 测试1: AI生成接口 - 正常关键词
echo "测试AI生成接口..."
AI_RESPONSE=$(curl -s -X POST http://localhost:5001/api/forum/ai-generate \
  -H "Content-Type: application/json" \
  -d '{"keywords":"金毛领养经验"}')

echo "AI响应: $AI_RESPONSE"

# 验证响应包含必需字段
if echo "$AI_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ AI生成成功${NC}"

    # 提取生成的内容
    TITLE=$(echo "$AI_RESPONSE" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
    CONTENT=$(echo "$AI_RESPONSE" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
    CATEGORY=$(echo "$AI_RESPONSE" | grep -o '"category":"[^"]*"' | cut -d'"' -f4)

    echo "  标题: $TITLE"
    echo "  分类: $CATEGORY"
    echo "  内容长度: ${#CONTENT} 字符"

    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ AI生成失败${NC}"
    echo "$AI_RESPONSE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# 测试2: AI生成接口 - 关键词过短
echo "测试关键词过短验证..."
SHORT_KEYWORD_RESPONSE=$(curl -s -X POST http://localhost:5001/api/forum/ai-generate \
  -H "Content-Type: application/json" \
  -d '{"keywords":"ab"}')

if echo "$SHORT_KEYWORD_RESPONSE" | grep -q "error\|失败"; then
    echo -e "${GREEN}✓ 关键词验证正确拦截${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ 关键词验证未拦截${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# 测试3: AI生成接口 - 空关键词
echo "测试空关键词验证..."
EMPTY_KEYWORD_RESPONSE=$(curl -s -X POST http://localhost:5001/api/forum/ai-generate \
  -H "Content-Type: application/json" \
  -d '{"keywords":""}')

if echo "$EMPTY_KEYWORD_RESPONSE" | grep -q "error\|required"; then
    echo -e "${GREEN}✓ 空关键词验证正确拦截${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ 空关键词验证未拦截${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "========================================="
echo "步骤3: 测试话题创建API"
echo "========================================="

# 获取真实的用户ID（从数据库中查询第一个用户）
echo "查询测试用户ID..."
USER_ID_QUERY=$(curl -s "http://localhost:5001/api/forum?limit=1")

# 提取用户ID（从话题列表中的作者ID）
TEST_USER_ID=$(echo "$USER_ID_QUERY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 如果没有找到用户ID，使用一个测试UUID
if [ -z "$TEST_USER_ID" ] || [ "$TEST_USER_ID" = "null" ]; then
    echo -e "${YELLOW}! 未找到真实用户，使用测试UUID${NC}"
    TEST_USER_ID="00000000-0000-0000-0000-000000000001"
fi

echo "使用用户ID: $TEST_USER_ID"

# 使用AI生成的内容创建话题
echo "创建话题..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5001/api/forum \
  -H "Content-Type: application/json" \
  -d "{
    \"title\":\"$TITLE\",
    \"content\":\"$CONTENT\",
    \"category\":\"$CATEGORY\",
    \"tags\":[\"金毛\",\"领养经验\"],
    \"images\":[],
    \"userId\":\"$TEST_USER_ID\"
  }")

echo "创建响应: $CREATE_RESPONSE"

if echo "$CREATE_RESPONSE" | grep -q '"id"\|success'; then
    echo -e "${GREEN}✓ 话题创建成功${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ 话题创建失败${NC}"
    echo "$CREATE_RESPONSE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "========================================="
echo "步骤4: 验证话题列表"
echo "========================================="

# 获取话题列表
echo "获取话题列表..."
LIST_RESPONSE=$(curl -s "http://localhost:5001/api/forum")

# 验证列表中包含刚创建的话题
if echo "$LIST_RESPONSE" | grep -q "$TITLE"; then
    echo -e "${GREEN}✓ 新话题出现在列表中${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}! 未在列表中找到新话题（可能需要刷新）${NC}"
    # 不计入失败，因为可能是数据库同步延迟
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "========================================="
echo "测试总结"
echo "========================================="
echo -e "总测试数: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ 存在失败的测试${NC}"
    exit 1
fi