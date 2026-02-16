#!/usr/bin/env node

/**
 * Axiom + OMC Integration Plugin 安装脚本
 * 自动安装插件到 Claude Code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 检测操作系统
function getClaudePluginDir() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  return path.join(homeDir, '.claude', 'plugins');
}

// 检查 Python 环境
function checkPythonEnvironment() {
  logStep(1, '检查 Python 环境');

  try {
    const pythonVersion = execSync('python --version', { encoding: 'utf-8' }).trim();
    logSuccess(`Python 已安装: ${pythonVersion}`);

    // 检查必需的 Python 包
    const requiredPackages = ['pyyaml', 'networkx', 'markdown'];
    const missingPackages = [];

    for (const pkg of requiredPackages) {
      try {
        execSync(`python -c "import ${pkg}"`, { stdio: 'ignore' });
        logSuccess(`Python 包已安装: ${pkg}`);
      } catch (error) {
        missingPackages.push(pkg);
        logWarning(`Python 包缺失: ${pkg}`);
      }
    }

    if (missingPackages.length > 0) {
      logWarning(`需要安装以下 Python 包: ${missingPackages.join(', ')}`);
      log('运行命令: pip install ' + missingPackages.join(' '), 'yellow');
      return false;
    }

    return true;
  } catch (error) {
    logError('Python 未安装或不在 PATH 中');
    logError('请先安装 Python 3.8+ 并确保在 PATH 中');
    return false;
  }
}

// 创建插件目录
function createPluginDirectory() {
  logStep(2, '创建插件目录');

  const pluginDir = getClaudePluginDir();
  const targetDir = path.join(pluginDir, 'axiom-omc-integration');

  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
    logSuccess(`创建 Claude 插件目录: ${pluginDir}`);
  }

  if (fs.existsSync(targetDir)) {
    logWarning(`插件目录已存在: ${targetDir}`);
    log('将覆盖现有安装', 'yellow');
  } else {
    fs.mkdirSync(targetDir, { recursive: true });
    logSuccess(`创建插件目录: ${targetDir}`);
  }

  return targetDir;
}

// 复制插件文件
function copyPluginFiles(targetDir) {
  logStep(3, '复制插件文件');

  const sourceDir = path.join(__dirname, '..');

  // 复制文件列表
  const filesToCopy = [
    'plugin.json',
    'README.md',
    'CHANGELOG.md'
  ];

  const dirsToCopy = [
    'skills',
    'commands',
    'workflows',
    'config',
    'docs'
  ];

  // 复制文件
  for (const file of filesToCopy) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      logSuccess(`复制文件: ${file}`);
    } else {
      logWarning(`文件不存在: ${file}`);
    }
  }

  // 复制目录
  for (const dir of dirsToCopy) {
    const sourcePath = path.join(sourceDir, dir);
    const targetPath = path.join(targetDir, dir);

    if (fs.existsSync(sourcePath)) {
      copyDirectory(sourcePath, targetPath);
      logSuccess(`复制目录: ${dir}`);
    } else {
      logWarning(`目录不存在: ${dir}`);
    }
  }
}

// 递归复制目录
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

// 创建符号链接到项目 .agent 目录
function createSymlinks(targetDir) {
  logStep(4, '创建符号链接');

  const projectRoot = process.cwd();
  const agentDir = path.join(projectRoot, '.agent');

  if (!fs.existsSync(agentDir)) {
    logWarning('.agent 目录不存在，跳过符号链接创建');
    logWarning('请在项目根目录运行此脚本');
    return false;
  }

  const linkPath = path.join(targetDir, '.agent-link');

  try {
    if (fs.existsSync(linkPath)) {
      fs.unlinkSync(linkPath);
    }

    // 创建符号链接（Windows 需要管理员权限）
    if (process.platform === 'win32') {
      logWarning('Windows 系统创建符号链接需要管理员权限');
      logWarning('如果失败，请以管理员身份运行此脚本');
    }

    fs.symlinkSync(agentDir, linkPath, 'dir');
    logSuccess(`创建符号链接: ${linkPath} -> ${agentDir}`);
    return true;
  } catch (error) {
    logError(`创建符号链接失败: ${error.message}`);
    logWarning('插件将无法访问项目 .agent 目录');
    return false;
  }
}

// 验证安装
function verifyInstallation(targetDir) {
  logStep(5, '验证安装');

  const requiredFiles = [
    'plugin.json',
    'README.md',
    'skills/start.md',
    'skills/prd.md',
    'commands/command-router.js',
    'commands/memory-manager.js'
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(targetDir, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`验证文件: ${file}`);
    } else {
      logError(`文件缺失: ${file}`);
      allFilesExist = false;
    }
  }

  return allFilesExist;
}

// 显示安装后说明
function showPostInstallInstructions() {
  log('\n' + '='.repeat(60), 'green');
  log('安装完成！', 'green');
  log('='.repeat(60), 'green');

  log('\n📚 使用说明:', 'cyan');
  log('1. 重启 Claude Code 以加载插件');
  log('2. 使用以下命令启动 Axiom + OMC 集成:');
  log('   /axiom-omc:start', 'yellow');
  log('');
  log('3. 可用的自定义技能:');
  log('   /axiom-omc:prd          - 生成产品需求文档', 'yellow');
  log('   /axiom-omc:analyze-error - 分析错误并查询已知问题', 'yellow');
  log('   /axiom-omc:evolve        - 触发知识演化', 'yellow');
  log('   /axiom-omc:reflect       - 生成反思报告', 'yellow');
  log('   /axiom-omc:patterns      - 查看代码模式库', 'yellow');
  log('   /axiom-omc:knowledge     - 查询知识库', 'yellow');
  log('');
  log('4. 查看完整文档:');
  log('   ~/.claude/plugins/axiom-omc-integration/README.md', 'yellow');
  log('');
  log('5. 配置文件位置:');
  log('   ~/.claude/plugins/axiom-omc-integration/config/', 'yellow');
  log('');

  log('⚠️  注意事项:', 'yellow');
  log('- 确保项目根目录存在 .agent/ 目录');
  log('- 确保已安装必需的 Python 包 (pyyaml, networkx, markdown)');
  log('- Windows 用户可能需要管理员权限创建符号链接');
  log('');
}

// 主函数
function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('Axiom + OMC Integration Plugin 安装程序', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  // 检查 Python 环境
  const pythonOk = checkPythonEnvironment();
  if (!pythonOk) {
    logError('\n安装失败：Python 环境不满足要求');
    process.exit(1);
  }

  // 创建插件目录
  const targetDir = createPluginDirectory();

  // 复制插件文件
  copyPluginFiles(targetDir);

  // 创建符号链接
  createSymlinks(targetDir);

  // 验证安装
  const installOk = verifyInstallation(targetDir);

  if (installOk) {
    showPostInstallInstructions();
    process.exit(0);
  } else {
    logError('\n安装失败：部分文件缺失');
    process.exit(1);
  }
}

// 运行主函数
main();
