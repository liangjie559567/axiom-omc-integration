/**
 * Axiom + OMC 状态同步
 * 用于在两个系统之间同步状态和数据，支持增量同步和冲突检测
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 状态同步管理器类
 */
class StateSync {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.omcDir = path.join(projectRoot, '.omc');
    this.agentDir = path.join(projectRoot, '.agent');
    this.pythonScript = path.join(projectRoot, '.agent', 'scripts', 'sync_state.py');

    // 文件路径
    this.projectMemoryPath = path.join(this.omcDir, 'project-memory.json');
    this.projectDecisionsPath = path.join(this.agentDir, 'memory', 'project_decisions.md');
    this.syncLogPath = path.join(this.agentDir, 'logs', 'sync_log.json');
  }

  /**
   * 同步所有数据
   * @param {string} direction - 同步方向 (bidirectional | omc_to_axiom | axiom_to_omc)
   * @returns {Object} - 同步结果
   */
  syncAll(direction = 'bidirectional') {
    try {
      const result = execSync(
        `python "${this.pythonScript}" "${this.projectRoot}" ${direction}`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('状态同步失败:', error.message);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        direction,
        synced: [],
        skipped: [],
        errors: [error.message],
        conflicts: []
      };
    }
  }

  /**
   * 检查数据一致性
   * @returns {Object} - 一致性检查结果
   */
  checkConsistency() {
    try {
      const result = execSync(
        `python "${this.pythonScript}" "${this.projectRoot}" --check`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('一致性检查失败:', error.message);
      return {
        consistent: false,
        issues: [{ type: 'check_failed', message: error.message }],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取同步历史
   * @param {number} limit - 返回数量限制
   * @returns {Array} - 同步历史列表
   */
  getSyncHistory(limit = 20) {
    try {
      if (fs.existsSync(this.syncLogPath)) {
        const data = JSON.parse(fs.readFileSync(this.syncLogPath, 'utf-8'));
        return data.slice(-limit);
      }
    } catch (error) {
      console.error('获取同步历史失败:', error.message);
    }
    return [];
  }

  /**
   * 同步 OMC → Axiom
   * @returns {Object} - 同步结果
   */
  syncOmcToAxiom() {
    return this.syncAll('omc_to_axiom');
  }

  /**
   * 同步 Axiom → OMC
   * @returns {Object} - 同步结果
   */
  syncAxiomToOmc() {
    return this.syncAll('axiom_to_omc');
  }

  /**
   * 双向同步
   * @returns {Object} - 同步结果
   */
  syncBidirectional() {
    return this.syncAll('bidirectional');
  }
}

module.exports = { StateSync };
