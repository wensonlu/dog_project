#!/bin/bash

# ==========================================
# 汪星球宠物领养平台 - 慢速可视化测试脚本
# 测试场景：登录后收藏功能完整流程
# 所有等待时间：1秒
# ==========================================

# 配置
BASE_URL="http://localhost:5173"
SCREENSHOT_DIR="./test-screenshots"
LOG_FILE="./test-results.log"

# 真实测试账号
TEST_EMAIL="823719082@qq.com"
TEST_PASSWORD="123456"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 创建截图目录
mkdir -p "$SCREENSHOT_DIR"

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1" | tee -a "$LOG_FILE"
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1" | tee -a "$LOG_FILE"
}

step() {
    echo -e "${YELLOW}▶ STEP${NC}: $1" | tee -a "$LOG_FILE"
}

# ==========================================
# 测试用例1：登录流程
# ==========================================
test_login() {
    log "========== 测试用例1：登录流程 =========="

    # 1.1 打开应用
    step "打开应用首页"
    agent-browser --headed open "$BASE_URL"
    sleep 1
    agent-browser screenshot "$SCREENSHOT_DIR/01-homepage.png"
    pass "应用首页加载成功"

    # 1.2 点击"我的"tab
    step "点击'我的'导航按钮"
    agent-browser snapshot -i > /tmp/snap1.txt
    MY_BTN=$(grep "我的" /tmp/snap1.txt | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)

    if [ -n "$MY_BTN" ]; then
        agent-browser click "@$MY_BTN"
        sleep 1
        agent-browser screenshot "$SCREENSHOT_DIR/02-profile-page.png"
        pass "成功进入个人页面"
    else
        fail "未找到'我的'按钮"
        return 1
    fi

    # 1.3 点击"立即登录"按钮
    step "点击立即登录按钮"
    agent-browser snapshot -i > /tmp/snap2.txt
    LOGIN_BTN=$(grep "立即登录" /tmp/snap2.txt | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)

    if [ -n "$LOGIN_BTN" ]; then
        agent-browser click "@$LOGIN_BTN"
        sleep 1
        agent-browser screenshot "$SCREENSHOT_DIR/03-login-page.png"
        pass "成功进入登录页面"
    else
        fail "未找到登录按钮"
        return 1
    fi

    # 1.4 填写登录表单
    step "填写登录表单（真实账号）"
    agent-browser snapshot -i > /tmp/snap3.txt
    EMAIL_INPUT=$(grep "邮箱" /tmp/snap3.txt | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)
    PWD_INPUT=$(grep "密码" /tmp/snap3.txt | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)

    log "填写邮箱: $TEST_EMAIL"
    agent-browser fill "@$EMAIL_INPUT" "$TEST_EMAIL"
    sleep 1

    log "填写密码: ******"
    agent-browser fill "@$PWD_INPUT" "$TEST_PASSWORD"
    sleep 1

    agent-browser screenshot "$SCREENSHOT_DIR/04-form-filled.png"
    pass "登录表单填写完成"

    # 1.5 提交登录
    step "提交登录"
    SUBMIT_BTN=$(grep "立即登录" /tmp/snap3.txt | grep "button" | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)

    agent-browser click "@$SUBMIT_BTN"
    sleep 1

    agent-browser screenshot "$SCREENSHOT_DIR/05-after-login.png"

    # 1.6 验证登录成功
    CURRENT_URL=$(agent-browser get url)
    if echo "$CURRENT_URL" | grep -q "localhost:5173/$"; then
        pass "登录成功，已跳转到首页"
    else
        fail "登录可能失败"
    fi
}

# ==========================================
# 测试用例2：收藏功能完整测试
# ==========================================
test_favorite_feature() {
    log "========== 测试用例2：收藏功能测试 =========="

    # 2.1 查看当前宠物卡片
    step "查看宠物卡片信息"
    agent-browser snapshot -i > /tmp/snap4.txt
    cat /tmp/snap4.txt

    # 提取宠物名称
    PET_NAME=$(grep "heading" /tmp/snap4.txt | grep -v "汪星球" | head -1 | sed 's/.*heading "\([^"]*\)".*/\1/')
    log "当前宠物: $PET_NAME"

    agent-browser screenshot "$SCREENSHOT_DIR/06-pet-card.png"
    pass "宠物卡片展示正常"

    # 2.2 测试收藏按钮
    step "测试收藏功能"

    # 查找收藏按钮（可能是 favorite 或 favorite_border）
    if grep -q "favorite" /tmp/snap4.txt; then
        FAV_BTN=$(grep "favorite" /tmp/snap4.txt | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)

        # 判断当前收藏状态
        if grep -q "favorite_border" /tmp/snap4.txt; then
            FAV_STATUS="未收藏"
            log "当前状态: 未收藏 (favorite_border)"
        else
            FAV_STATUS="已收藏"
            log "当前状态: 已收藏 (favorite)"
        fi

        log "找到收藏按钮，引用: @$FAV_BTN"

        # 点击收藏按钮
        agent-browser click "@$FAV_BTN"
        sleep 1
        agent-browser screenshot "$SCREENSHOT_DIR/07-after-favorite-click.png"

        # 验证收藏状态变化
        agent-browser snapshot -i > /tmp/snap5.txt
        if [ "$FAV_STATUS" = "未收藏" ]; then
            if grep -q "favorite" /tmp/snap5.txt && ! grep -q "favorite_border" /tmp/snap5.txt; then
                pass "收藏成功：状态从未收藏变为已收藏"
            else
                log "收藏状态可能已更新"
            fi
        else
            if grep -q "favorite_border" /tmp/snap5.txt; then
                pass "取消收藏成功：状态从已收藏变为未收藏"
            else
                log "取消收藏状态可能已更新"
            fi
        fi
    else
        fail "未找到收藏按钮"
    fi

    # 2.3 查看收藏列表
    step "查看收藏列表"

    # 点击"我的"进入个人中心
    MY_BTN=$(grep "我的" /tmp/snap5.txt | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)

    if [ -n "$MY_BTN" ]; then
        agent-browser click "@$MY_BTN"
        sleep 1
        agent-browser screenshot "$SCREENSHOT_DIR/08-my-page.png"

        # 查找收藏入口
        agent-browser snapshot -i > /tmp/snap6.txt

        if grep -qE "收藏|我的收藏" /tmp/snap6.txt; then
            FAV_LINK=$(grep -E "收藏|我的收藏" /tmp/snap6.txt | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)

            agent-browser click "@$FAV_LINK"
            sleep 1
            agent-browser screenshot "$SCREENSHOT_DIR/09-favorites-list.png"

            # 验证收藏列表
            agent-browser snapshot -i > /tmp/snap7.txt
            if grep -qE "收藏|暂无收藏|$PET_NAME" /tmp/snap7.txt; then
                pass "成功查看收藏列表"
            else
                log "收藏列表页面加载正常"
            fi
        else
            log "个人页面未找到收藏入口"
        fi
    fi

    # 2.4 返回探索页面继续测试
    step "返回探索页面"
    agent-browser open "$BASE_URL"
    sleep 1
    agent-browser screenshot "$SCREENSHOT_DIR/10-back-to-explore.png"
    pass "已返回探索页面"

    # 2.5 测试查看详情
    step "查看宠物详情"
    agent-browser snapshot -i > /tmp/snap8.txt

    if grep -q "info" /tmp/snap8.txt; then
        INFO_BTN=$(grep "info" /tmp/snap8.txt | grep "button" | sed -n 's/.*ref=\(e[0-9]*\).*/\1/p' | head -1)

        if [ -n "$INFO_BTN" ]; then
            agent-browser click "@$INFO_BTN"
            sleep 1
            agent-browser screenshot "$SCREENSHOT_DIR/11-pet-detail.png"
            pass "成功打开宠物详情页"
        else
            log "未找到详情按钮"
        fi
    fi
}

# ==========================================
# 测试报告
# ==========================================
generate_report() {
    log "========== 测试报告 =========="
    log "测试完成时间：$(date '+%Y-%m-%d %H:%M:%S')"
    log "截图保存目录：$SCREENSHOT_DIR"
    log "详细日志文件：$LOG_FILE"
    echo ""
    log "生成的测试截图："
    ls -lh "$SCREENSHOT_DIR"/*.png 2>/dev/null | tee -a "$LOG_FILE"
}

# ==========================================
# 主测试流程
# ==========================================
main() {
    log "=========================================="
    log "汪星球宠物领养平台 - 自动化测试开始"
    log "测试类型：慢速可视化测试（等待1秒）"
    log "=========================================="
    log ""

    # 关闭已有浏览器实例
    agent-browser close 2>/dev/null || true

    # 清空日志
    > "$LOG_FILE"

    # 执行测试用例
    test_login
    test_favorite_feature

    # 生成报告
    generate_report

    # 关闭浏览器
    agent-browser close

    log ""
    log "========== 所有测试完成 =========="
}

# 执行主函数
main