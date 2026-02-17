/**
 * CommandSystem 集成测试
 */

import { CommandSystem } from './src/core/CommandSystem.js';
import { CommandParser } from './src/core/CommandParser.js';
import { PluginLoader } from './src/core/PluginLoader.js';
import { hookSystem } from './src/core/HookSystem.js';

console.log('='.repeat(60));
console.log('CommandSystem 集成测试');
console.log('='.repeat(60));
console.log();

// 测试 1: 创建 CommandSystem
console.log('测试 1: 创建 CommandSystem');
const commandSystem = new CommandSystem();
console.log('✅ CommandSystem 创建成功');
console.log();

// 测试 2: 创建 CommandParser
console.log('测试 2: 创建 CommandParser');
const parser = new CommandParser();
console.log('✅ CommandParser 创建成功');
console.log();

// 测试 3: 解析命令
console.log('测试 3: 解析命令');
const testCases = [
  'help',
  'list --group=workflow',
  'workflow:start brainstorming --context=\'{"key":"value"}\'',
  'status -v',
  'help workflow:start'
];

for (const input of testCases) {
  const parsed = parser.parse(input);
  console.log(`  输入: ${input}`);
  console.log(`  命令: ${parsed.command}`);
  console.log(`  参数: ${JSON.stringify(parsed.args)}`);
  console.log(`  标志: ${JSON.stringify(parsed.flags)}`);
  console.log();
}

// 测试 4: 注册命令
console.log('测试 4: 注册命令');
commandSystem.registerCommand({
  name: 'test',
  description: '测试命令',
  aliases: ['t'],
  group: 'test',
  execute: async (parsed, context) => {
    return `测试命令执行成功！参数: ${parsed.args.join(', ')}`;
  }
});
console.log('✅ 命令注册成功');
console.log();

// 测试 5: 查找命令
console.log('测试 5: 查找命令');
const cmd1 = commandSystem.findCommand('test');
const cmd2 = commandSystem.findCommand('t'); // 别名
console.log(`  通过名称查找: ${cmd1 ? '✅ 成功' : '❌ 失败'}`);
console.log(`  通过别名查找: ${cmd2 ? '✅ 成功' : '❌ 失败'}`);
console.log();

// 测试 6: 执行命令
console.log('测试 6: 执行命令');
const result = await commandSystem.executeCommand('test arg1 arg2');
console.log(`  执行结果: ${JSON.stringify(result, null, 2)}`);
console.log(`  命令输出: ${result.result}`);
console.log();

// 测试 7: 创建 PluginLoader
console.log('测试 7: 创建 PluginLoader');
const pluginLoader = new PluginLoader(commandSystem);
console.log('✅ PluginLoader 创建成功');
console.log();

// 测试 8: 加载命令目录
console.log('测试 8: 加载命令目录');
const loadResult = await pluginLoader.loadDirectory('./commands', {
  recursive: true,
  pattern: /\.js$/
});
console.log(`  加载结果: ${JSON.stringify({
  total: loadResult.total,
  loaded: loadResult.loaded.length,
  failed: loadResult.failed.length
}, null, 2)}`);

if (loadResult.loaded.length > 0) {
  console.log('  已加载的命令:');
  for (const result of loadResult.loaded) {
    console.log(`    ${result.path}`);
    console.log(`      命令: ${result.commands.map(c => c.name).join(', ')}`);
  }
}

if (loadResult.failed.length > 0) {
  console.log('  加载失败:');
  for (const result of loadResult.failed) {
    console.log(`    ${result.path}: ${result.error}`);
  }
}
console.log();

// 测试 9: 获取所有命令
console.log('测试 9: 获取所有命令');
const allCommands = commandSystem.getAllCommands();
console.log(`  总命令数: ${allCommands.length}`);
console.log('  命令列表:');
for (const cmd of allCommands.sort((a, b) => a.name.localeCompare(b.name))) {
  const aliases = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
  console.log(`    ${cmd.name}${aliases} - ${cmd.description}`);
}
console.log();

// 测试 10: 按分组获取命令
console.log('测试 10: 按分组获取命令');
const groups = commandSystem.getGroups();
console.log(`  分组数: ${groups.length}`);
for (const group of groups.sort()) {
  const cmds = commandSystem.getCommandsByGroup(group);
  console.log(`    ${group}: ${cmds.length} 个命令`);
}
console.log();

// 测试 11: 搜索命令
console.log('测试 11: 搜索命令');
const searchResults = commandSystem.searchCommands('workflow');
console.log(`  搜索 "workflow": ${searchResults.length} 个结果`);
for (const cmd of searchResults) {
  console.log(`    ${cmd.name}`);
}
console.log();

// 测试 12: 执行 help 命令
console.log('测试 12: 执行 help 命令');
const helpResult = await commandSystem.executeCommand('help', {
  commandSystem,
  hookSystem
});
if (helpResult.success) {
  console.log(helpResult.result);
}
console.log();

// 测试 13: 执行 list 命令
console.log('测试 13: 执行 list 命令');
const listResult = await commandSystem.executeCommand('list', {
  commandSystem
});
if (listResult.success) {
  console.log(listResult.result);
}
console.log();

// 测试 14: 执行 version 命令
console.log('测试 14: 执行 version 命令');
const versionResult = await commandSystem.executeCommand('version', {
  commandSystem
});
if (versionResult.success) {
  console.log(versionResult.result);
}
console.log();

// 测试 15: 执行 status 命令
console.log('测试 15: 执行 status 命令');
const statusResult = await commandSystem.executeCommand('status', {
  commandSystem,
  hookSystem
});
if (statusResult.success) {
  console.log(statusResult.result);
}
console.log();

// 测试 16: 命令建议
console.log('测试 16: 命令建议（自动补全）');
const suggestions = commandSystem.getSuggestions('wor');
console.log(`  输入 "wor" 的建议: ${suggestions.join(', ')}`);
console.log();

// 最终统计
console.log('='.repeat(60));
console.log('最终统计');
console.log('='.repeat(60));
const stats = commandSystem.getStats();
console.log(`已注册命令: ${stats.commands}`);
console.log(`命令别名: ${stats.aliases}`);
console.log(`命令分组: ${stats.groups}`);
console.log(`已执行命令: ${stats.executed}`);
console.log(`失败次数: ${stats.failed}`);
console.log();

const pluginStats = pluginLoader.getStats();
console.log(`已加载插件: ${pluginStats.plugins}`);
console.log(`加载成功: ${pluginStats.loaded}`);
console.log(`加载失败: ${pluginStats.failed}`);
console.log();

console.log('='.repeat(60));
console.log('✅ 所有测试完成！');
console.log('='.repeat(60));
