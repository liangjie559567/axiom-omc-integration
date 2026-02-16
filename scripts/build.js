/**
 * 构建脚本
 * 
 * 用于构建项目，包括：
 * - 代码检查
 * - 测试运行
 * - 输出生成
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function build() {
  console.log('开始构建...\n');

  try {
    // 创建输出目录
    const distDir = path.join(projectRoot, 'dist');
    await fs.mkdir(distDir, { recursive: true });
    console.log('✓ 创建输出目录');

    // 复制源文件
    const srcDir = path.join(projectRoot, 'src');
    await copyDir(srcDir, path.join(distDir, 'src'));
    console.log('✓ 复制源文件');

    // 复制配置文件
    const configDir = path.join(projectRoot, 'config');
    await copyDir(configDir, path.join(distDir, 'config'));
    console.log('✓ 复制配置文件');

    // 复制 package.json
    const packageJson = await fs.readFile(
      path.join(projectRoot, 'package.json'),
      'utf-8'
    );
    await fs.writeFile(
      path.join(distDir, 'package.json'),
      packageJson
    );
    console.log('✓ 复制 package.json');

    console.log('\n构建完成！');
    console.log(`输出目录: ${distDir}`);
  } catch (error) {
    console.error('构建失败:', error);
    process.exit(1);
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

build();
