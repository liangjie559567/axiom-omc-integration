#!/bin/bash
# 插件功能测试脚本

echo "=== 测试 1: 技能文件 ==="
ls -l skills/*.md | wc -l

echo -e "\n=== 测试 2: 代理定义 ==="
ls -l src/agents/definitions/*.js | wc -l

echo -e "\n=== 测试 3: 命令文件 ==="
ls -l commands/*.js 2>/dev/null | wc -l

echo -e "\n=== 测试 4: 工作流文件 ==="
ls -l workflows/*.yaml 2>/dev/null | wc -l

echo -e "\n=== 测试完成 ==="
