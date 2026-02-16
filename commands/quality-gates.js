/**
 * 质量门检查
 * 提供 PRD、编译、提交等质量门检查功能
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 检查状态枚举
 */
const CheckStatus = {
  PASSED: 'passed',
  FAILED: 'failed',
  WARNING: 'warning',
  SKIPPED: 'skipped'
};

/**
 * PRD 质量门类
 */
class PRDGate {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = config;
    this.pythonScript = path.join(projectRoot, '.agent', 'guards', 'prd_gate.py');
  }

  /**
   * 执行 PRD 质量门检查
   * @param {Object} prdData - PRD 数据对象
   * @returns {Object} - 质量门结果
   */
  check(prdData) {
    try {
      // 将 PRD 数据写入临时文件
      const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'prd_temp.json');
      const tempDir = path.dirname(tempFile);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify(prdData, null, 2));

      // 调用 Python 脚本
      const args = [
        `"${this.pythonScript}"`,
        `"${tempFile}"`
      ];

      if (!this.config.require_confirmation) {
        args.push('--no-confirmation');
      }

      const result = execSync(
        `python ${args.join(' ')}`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      // 解析输出（Python 脚本会输出 JSON 格式的结果）
      const lines = result.split('\n');
      const jsonStart = lines.findIndex(l => l.trim().startsWith('{'));
      if (jsonStart >= 0) {
        const jsonStr = lines.slice(jsonStart).join('\n');
        return JSON.parse(jsonStr);
      }

      // 如果没有 JSON 输出，解析文本输出
      return this.parseTextOutput(result);
    } catch (error) {
      console.error('PRD 质量门检查失败:', error.message);
      return {
        gate_name: 'prd_gate',
        passed: false,
        checks: [{
          check_name: '执行检查',
          status: CheckStatus.FAILED,
          message: `检查失败: ${error.message}`,
          timestamp: new Date().toISOString()
        }],
        summary: { total: 1, passed: 0, failed: 1, warning: 0, skipped: 0 },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 解析文本输出
   * @param {string} output - 文本输出
   * @returns {Object} - 解析后的结果
   */
  parseTextOutput(output) {
    const lines = output.split('\n');
    const passed = output.includes('✅ 通过');

    return {
      gate_name: 'prd_gate',
      passed,
      checks: [],
      summary: { total: 0, passed: 0, failed: 0, warning: 0, skipped: 0 },
      timestamp: new Date().toISOString(),
      raw_output: output
    };
  }

  /**
   * 保存质量门报告
   * @param {Object} result - 质量门结果
   * @param {string} outputPath - 输出路径
   */
  saveReport(result, outputPath) {
    try {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('保存质量门报告失败:', error.message);
    }
  }
}

/**
 * 编译质量门类
 */
class CompileGate {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  /**
   * 执行编译检查
   * @returns {Object} - 检查结果
   */
  check() {
    try {
      // 检查 Python 语法
      const result = execSync(
        'python -m py_compile $(find . -name "*.py" -not -path "*/venv/*" -not -path "*/.venv/*")',
        { encoding: 'utf-8', cwd: this.projectRoot, shell: '/bin/bash' }
      );

      return {
        gate_name: 'compile_gate',
        passed: true,
        checks: [{
          check_name: 'Python 语法检查',
          status: CheckStatus.PASSED,
          message: '所有 Python 文件语法正确',
          timestamp: new Date().toISOString()
        }],
        summary: { total: 1, passed: 1, failed: 0, warning: 0, skipped: 0 },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        gate_name: 'compile_gate',
        passed: false,
        checks: [{
          check_name: 'Python 语法检查',
          status: CheckStatus.FAILED,
          message: `语法错误: ${error.message}`,
          timestamp: new Date().toISOString()
        }],
        summary: { total: 1, passed: 0, failed: 1, warning: 0, skipped: 0 },
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * 提交质量门类
 */
class CommitGate {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  /**
   * 执行提交前检查
   * @returns {Object} - 检查结果
   */
  check() {
    const checks = [];

    // 检查是否有未暂存的更改
    try {
      const status = execSync('git status --porcelain', {
        encoding: 'utf-8',
        cwd: this.projectRoot
      });

      if (status.trim()) {
        checks.push({
          check_name: 'Git 状态检查',
          status: CheckStatus.PASSED,
          message: '有待提交的更改',
          timestamp: new Date().toISOString()
        });
      } else {
        checks.push({
          check_name: 'Git 状态检查',
          status: CheckStatus.WARNING,
          message: '没有待提交的更改',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      checks.push({
        check_name: 'Git 状态检查',
        status: CheckStatus.FAILED,
        message: `检查失败: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }

    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === CheckStatus.PASSED).length,
      failed: checks.filter(c => c.status === CheckStatus.FAILED).length,
      warning: checks.filter(c => c.status === CheckStatus.WARNING).length,
      skipped: checks.filter(c => c.status === CheckStatus.SKIPPED).length
    };

    return {
      gate_name: 'commit_gate',
      passed: summary.failed === 0,
      checks,
      summary,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  PRDGate,
  CompileGate,
  CommitGate,
  CheckStatus
};
