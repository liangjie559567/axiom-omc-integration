/**
 * Axiom + OMC 记忆管理器
 * 统一记忆层接口，整合决策记录、用户偏好、上下文管理、知识图谱
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 记忆管理器类
 */
class MemoryManager {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.pythonScript = path.join(projectRoot, '.agent', 'adapters', 'memory_manager.py');
    this.decisionsPath = path.join(projectRoot, '.agent', 'memory', 'project_decisions.md');
    this.knowledgeGraphPath = path.join(projectRoot, '.agent', 'knowledge', 'knowledge_graph.json');
  }

  /**
   * 记录决策
   * @param {Object} decision - 决策数据
   * @returns {Object} - 记录结果
   */
  recordDecision(decision) {
    try {
      const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'decision_temp.json');
      const tempDir = path.dirname(tempFile);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify(decision, null, 2));

      const result = execSync(
        `python "${this.pythonScript}" record-decision "${tempFile}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('记录决策失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 搜索记忆
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Object} - 搜索结果
   */
  search(query, options = {}) {
    try {
      const optionsJson = JSON.stringify(options);
      const result = execSync(
        `python "${this.pythonScript}" search "${query}" '${optionsJson}'`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('搜索记忆失败:', error.message);
      return {
        results: [],
        total: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取决策历史
   * @param {number} limit - 返回数量限制
   * @returns {Array} - 决策列表
   */
  getDecisionHistory(limit = 20) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" get-decisions --limit ${limit}`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('获取决策历史失败:', error.message);
      return [];
    }
  }

  /**
   * 查询知识图谱
   * @param {string} nodeId - 节点 ID
   * @returns {Object} - 节点数据
   */
  queryKnowledgeGraph(nodeId) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" query-kg "${nodeId}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('查询知识图谱失败:', error.message);
      return {
        node: null,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 添加知识图谱节点
   * @param {Object} node - 节点数据
   * @returns {Object} - 添加结果
   */
  addKnowledgeNode(node) {
    try {
      const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'node_temp.json');
      const tempDir = path.dirname(tempFile);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify(node, null, 2));

      const result = execSync(
        `python "${this.pythonScript}" add-kg-node "${tempFile}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('添加知识图谱节点失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计数据
   */
  getStats() {
    try {
      const result = execSync(
        `python "${this.pythonScript}" stats`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('获取统计信息失败:', error.message);
      return {
        decisions: 0,
        knowledge_nodes: 0,
        patterns: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 版本控制 - 创建快照
   * @param {string} description - 快照描述
   * @returns {Object} - 快照结果
   */
  createSnapshot(description) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" create-snapshot "${description}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('创建快照失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 版本控制 - 回滚到快照
   * @param {string} snapshotId - 快照 ID
   * @returns {Object} - 回滚结果
   */
  rollbackToSnapshot(snapshotId) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" rollback "${snapshotId}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('回滚快照失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = { MemoryManager };
