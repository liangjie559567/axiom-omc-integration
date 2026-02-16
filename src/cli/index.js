#!/usr/bin/env node

/**
 * CLI 入口文件
 * 提供命令行接口
 */

import { createCLISystem } from './cli-system.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取配置
let config = {};
try {
  const configPath = join(process.cwd(), '.axiom-omc.json');
  config = JSON.parse(readFileSync(configPath, 'utf-8'));
} catch (error) {
  // 使用默认配置
}

// 创建 CLI 系统
const cli = createCLISystem(config);

// 初始化
await cli.initialize();

// 解析命令行参数
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Axiom-OMC 整合系统 CLI

用法: axiom-omc <command> [args...]

Agent 命令:
  agent:list                    列出所有 Agent
  agent:info <agentId>          查看 Agent 详情
  agent:execute <agentId>       执行 Agent
  agent:status <executionId>    查看执行状态
  agent:history [agentId]       查看执行历史
  agent:cancel <executionId>    取消执行

工作流命令:
  workflow:list                 列出所有工作流
  workflow:start <workflowId>   启动工作流
  workflow:status <instanceId>  查看工作流状态
  workflow:next <instanceId>    转换到下一阶段
  workflow:goto <instanceId> <phase>  跳转到指定阶段
  workflow:active               查看活动工作流
  workflow:stop <instanceId>    停止工作流

记忆命令:
  memory:decision:add <json>    添加决策记录
  memory:decision:list [filters] 列出决策记录
  memory:knowledge:add <json>   添加知识节点
  memory:knowledge:search <query> 搜索知识图谱
  memory:stats                  查看统计信息

同步命令:
  sync:register <axiom> <omc>   注册同步映射
  sync:run [mappingId]          执行同步
  sync:list                     列出同步映射
  sync:history [mappingId]      查看同步历史

示例:
  axiom-omc agent:list
  axiom-omc agent:execute architect '{"task":"Design architecture"}'
  axiom-omc workflow:start omc-default
  axiom-omc memory:decision:add '{"title":"Use PostgreSQL","type":"technical"}'
  axiom-omc sync:run
  `);
  process.exit(0);
}

// 构建命令行
const commandLine = args.join(' ');

try {
  // 执行命令
  const result = await cli.execute(commandLine);

  // 输出结果
  if (result.success) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } else {
    console.error('错误:', result.error);
    process.exit(1);
  }
} catch (error) {
  console.error('执行失败:', error.message);
  process.exit(1);
} finally {
  // 清理
  await cli.destroy();
}
