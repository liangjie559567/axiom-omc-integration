#!/bin/bash
# 插件功能测试脚本

echo "=== 测试 1: 查看插件状态 ==="
/plugin

echo -e "\n=== 测试 2: 测试技能 ==="
/axiom-omc:start

echo -e "\n=== 测试 3: 测试命令 ==="
/axiom-omc:prd

echo -e "\n=== 测试 4: 查看代理 ==="
/axiom-omc:agents

echo -e "\n=== 测试完成 ==="
