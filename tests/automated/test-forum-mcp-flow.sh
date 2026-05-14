#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5001/api}"
USER_ID="${2:-}"

if [[ -z "$USER_ID" ]]; then
  echo "Usage: $0 [BASE_URL] <USER_ID>"
  exit 1
fi

echo "[1/6] get forum context"
curl -s "${BASE_URL}/forum/context?pageType=topic_list&route=/forum&sort=latest&category=all&userId=${USER_ID}" | jq '.page.type, .data.visibleTopics | length' >/dev/null

echo "[2/6] search topics (mcp format)"
curl -s "${BASE_URL}/forum?format=mcp&limit=5&cursor=0&query=领养&userId=${USER_ID}" | jq '.items | length' >/dev/null

echo "[3/6] draft topic"
DRAFT_TOPIC=$(curl -s -X POST "${BASE_URL}/forum/draft-topic" -H 'Content-Type: application/json' -d "{\"prompt\":\"新手领养狗狗注意事项\",\"category\":\"领养经验\",\"tone\":\"warm\",\"length\":\"medium\",\"userId\":\"${USER_ID}\"}")
TITLE=$(echo "$DRAFT_TOPIC" | jq -r '.title')
CONTENT=$(echo "$DRAFT_TOPIC" | jq -r '.content')

echo "[4/6] precheck + confirm create topic"
PRECHECK_TOPIC=$(curl -s -X POST "${BASE_URL}/forum/precheck/topic" -H 'Content-Type: application/json' -d "{\"title\":\"${TITLE}\",\"content\":\"${CONTENT}\",\"category\":\"领养经验\",\"tags\":[\"测试\"],\"images\":[],\"userId\":\"${USER_ID}\"}")
TOPIC_TOKEN=$(echo "$PRECHECK_TOPIC" | jq -r '.confirmToken')
CONFIRM_TOPIC=$(curl -s -X POST "${BASE_URL}/forum/confirm/topic" -H 'Content-Type: application/json' -d "{\"confirmToken\":\"${TOPIC_TOKEN}\",\"userId\":\"${USER_ID}\"}")
TOPIC_ID=$(echo "$CONFIRM_TOPIC" | jq -r '.topicId')

echo "[5/6] draft reply"
DRAFT_REPLY=$(curl -s -X POST "${BASE_URL}/forum/draft-reply" -H 'Content-Type: application/json' -d "{\"topicId\":\"${TOPIC_ID}\",\"userIntent\":\"补充经验并给建议\",\"tone\":\"friendly\",\"length\":\"medium\",\"userId\":\"${USER_ID}\"}")
REPLY_CONTENT=$(echo "$DRAFT_REPLY" | jq -r '.draft')

echo "[6/6] precheck + confirm create reply"
PRECHECK_REPLY=$(curl -s -X POST "${BASE_URL}/forum/precheck/reply" -H 'Content-Type: application/json' -d "{\"topicId\":\"${TOPIC_ID}\",\"content\":\"${REPLY_CONTENT}\",\"userId\":\"${USER_ID}\"}")
REPLY_TOKEN=$(echo "$PRECHECK_REPLY" | jq -r '.confirmToken')
curl -s -X POST "${BASE_URL}/forum/confirm/reply" -H 'Content-Type: application/json' -d "{\"confirmToken\":\"${REPLY_TOKEN}\",\"userId\":\"${USER_ID}\"}" | jq '.ok' >/dev/null

echo "Forum MCP flow smoke test passed"
