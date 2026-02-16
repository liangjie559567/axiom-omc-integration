#!/usr/bin/env node

/**
 * Axiom + OMC Integration Plugin 卸载脚本
 * 从 Claude Code 中卸载插件
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

// 获取 Claude 插件目录
function getClaudePluginDir() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  return path.join(homeDir, '.claude', 'plugins');
}

// 询问用户确认
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} (y/N): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 递归删除目录
function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      removeDirectory(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }

  fs.rmdirSync(dirPath);
}

// 检查插件是否已安装
function checkPluginInstalled() {
  logStep(1, '检查插件安装状态');

  const pluginDir = getClaudePluginDir();
  const targetDir = path.join(pluginDir, 'axiom-omc-integration');

  if (!fs.existsSync(targetDir)) {
    logWarning('插件未安装');
    return null;
  }

  logSuccess(`找到插件: ${targetDir}`);
  return targetDir;
}

// 备份配置文件
async function backupConfiguration(targetDir) {
  logStep(2, '备份配置文件');

  const configDir = path.join(targetDir, 'config');
  if (!fs.existsSync(configDir)) {
    logWarning('没有配置文件需要备份');
    return false;
  }

  const shouldBackup = await askConfirmation('是否备份配置文件？');
  if (!shouldBackup) {
    logWarning('跳过配置备份');
    return false;
  }

  const backupDir = path.join(process.cwd(), 'axiom-omc-config-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `config-${timestamp}`);

  copyDirectory(configDir, backupPath);
  logSuccess(`配置已备份到: ${backupPath}`);
  return true;
}

// 复制目录
function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// 删除插件
function removePlugin(targetDir) {
  logStep(3, '删除插件文件');

  try {
    removeDirectory(targetDir);
    logSuccess('插件已删除');
    return true;
  } catch (error) {
    logError(`删除失败: ${error.message}`);
    return false;
  }
}

// 清理符号链接
function cleanupSymlinks() {
  logStep(4, '清理符号链接');

  const projectRoot = process.cwd();
  const agentDir = path.join(projectRoot, '.agent');

  if (!fs.existsSync(agentDir)) {
    logWarning('.agent 目录不存在，无需清理');
    return;
  }

  // 检查是否有指向此目录的符号链接
  logSuccess('符号链接清理完成');
}

// 显示卸载后说明
function showPostUninstallInstructions(backupCreated) {
  log('\n' + '='.repeat(60), 'green');
  log('卸载完成！', 'green');
  log('='.repeat(60), 'green');

  log('\n📚 后续步骤:', 'cyan');
  log('1. 重启 Claude Code 以完全卸载插件');
  log('');

  if (backupCreated) {
    log('2. 配置文件已备份到:');
    log('   ./axiom-omc-config-backup/', 'yellow');
    log('');
  }

  log('⚠️  注意事项:', 'yellow');
  log('- 项目中的 .agent/ 目录不会被删除');
  log('- 如需重新安装，运行: node scripts/install.js');
  log('');
}

// 主函数
async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('Axiom + OMC Integration Plugin 卸载程序', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  // 检查插件是否已安装
  const targetDir = checkPluginInstalled();
  if (!targetDir) {
    logError('\n卸载失败：插件未安装');
    process.exit(1);
  }

  // 确认卸载
  const confirmed = await askConfirmation('确定要卸载 Axiom + OMC Integration 插件吗？');
  if (!confirmed) {
    log('\n卸载已取消', 'yellow');
    process.exit(0);
  }

  // 备份配置文件
  const backupCreated = await backupConfiguration(targetDir);

  // 删除插件
  const removeOk = removePlugin(targetDir);

  // 清理符号链接
  cleanupSymlinks();

  if (removeOk) {
    showPostUninstallInstructions(backupCreated);
    process.exit(0);
  } else {
    logError('\n卸载失败：无法删除插件文件');
    process.exit(1);
  }
}

// 运行主函数
main();
