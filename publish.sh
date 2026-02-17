#!/bin/bash

# Axiom-OMC Integration v1.0.0 MVP 发布脚本
# 使用方法: ./publish.sh

set -e  # 遇到错误立即退出

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Axiom-OMC Integration v1.0.0 MVP - 发布脚本                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤 1: 最终测试
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 1: 运行最终测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}运行所有测试...${NC}"
npm test

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 测试通过${NC}"
else
    echo -e "${RED}✗ 测试失败，请修复后再发布${NC}"
    exit 1
fi
echo ""

# 步骤 2: 代码质量检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 2: 代码质量检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v npm run lint &> /dev/null; then
    echo -e "${YELLOW}运行代码检查...${NC}"
    npm run lint || true
    echo -e "${GREEN}✓ 代码检查完成${NC}"
else
    echo -e "${YELLOW}⚠ 未配置 lint 命令，跳过${NC}"
fi
echo ""

# 步骤 3: 运行演示
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 3: 运行演示脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}运行演示脚本...${NC}"
node demo.js > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 演示脚本运行成功${NC}"
else
    echo -e "${RED}✗ 演示脚本运行失败${NC}"
    exit 1
fi
echo ""

# 步骤 4: 确认版本号
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 4: 确认版本号"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

VERSION=$(node -p "require('./package.json').version")
echo -e "当前版本: ${GREEN}v${VERSION}${NC}"
echo ""

read -p "确认发布版本 v${VERSION}? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}发布已取消${NC}"
    exit 1
fi
echo ""

# 步骤 5: Git 提交和标签
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 5: Git 提交和标签"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}发现未提交的更改${NC}"
    git status -s
    echo ""
    read -p "是否提交所有更改? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Release v${VERSION}"
        echo -e "${GREEN}✓ 更改已提交${NC}"
    else
        echo -e "${RED}发布已取消${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ 没有未提交的更改${NC}"
fi
echo ""

# 创建标签
echo -e "${YELLOW}创建 Git 标签...${NC}"
git tag -a "v${VERSION}" -m "Release v${VERSION} MVP"
echo -e "${GREEN}✓ 标签已创建: v${VERSION}${NC}"
echo ""

# 推送到远程
read -p "是否推送到远程仓库? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}推送到远程...${NC}"
    git push origin main
    git push origin "v${VERSION}"
    echo -e "${GREEN}✓ 已推送到远程${NC}"
else
    echo -e "${YELLOW}⚠ 跳过推送到远程${NC}"
fi
echo ""

# 步骤 6: NPM 发布
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 6: NPM 发布"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "是否发布到 NPM? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}检查 NPM 登录状态...${NC}"
    npm whoami > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 已登录 NPM${NC}"
        echo ""

        echo -e "${YELLOW}发布到 NPM...${NC}"
        npm publish

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 已发布到 NPM${NC}"
        else
            echo -e "${RED}✗ NPM 发布失败${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ 未登录 NPM，请先运行: npm login${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ 跳过 NPM 发布${NC}"
fi
echo ""

# 步骤 7: GitHub Release
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 7: GitHub Release"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}请手动创建 GitHub Release:${NC}"
echo ""
echo "1. 访问: https://github.com/liangjie559567/axiom-omc-integration/releases/new"
echo "2. 选择标签: v${VERSION}"
echo "3. 标题: Axiom-OMC Integration v${VERSION} MVP"
echo "4. 描述: 复制 RELEASE-NOTES.md 的内容"
echo "5. 点击 'Publish release'"
echo ""

# 完成
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "发布完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 Axiom-OMC Integration v${VERSION} 发布成功！           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "发布信息:"
echo "  版本: v${VERSION}"
echo "  NPM: https://www.npmjs.com/package/axiom-omc-integration"
echo "  GitHub: https://github.com/liangjie559567/axiom-omc-integration"
echo ""

echo "下一步:"
echo "  1. 创建 GitHub Release"
echo "  2. 在社区分享发布公告"
echo "  3. 监控 Issues 和用户反馈"
echo "  4. 开始规划 v1.0.1"
echo ""

echo -e "${GREEN}感谢使用 Axiom-OMC Integration！${NC}"
