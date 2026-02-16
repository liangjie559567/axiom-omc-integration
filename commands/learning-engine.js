/**
 * Axiom + OMC 学习引擎
 * 从历史决策中自动学习，识别模式，生成洞察，优化推荐权重
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 学习引擎类
 */
class LearningEngine {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.pythonScript = path.join(projectRoot, '.agent', 'knowledge', 'learning_engine.py');
    this.decisionsPath = path.join(projectRoot, '.agent', 'memory', 'project_decisions.md');
    this.patternsPath = path.join(projectRoot, '.agent', 'knowledge', 'patterns.json');
    this.insightsPath = path.join(projectRoot, '.agent', 'knowledge', 'insights.json');
  }

  /**
   * 从历史决策中学习
   * @param {number} timeWindowDays - 时间窗口（天数），null 表示全部历史
   * @returns {Object} - 学习报告
   */
  learnFromDecisions(timeWindowDays = null) {
    try {
      const args = [`python "${this.pythonScript}" learn`];
      if (timeWindowDays !== null) {
        args.push(`--time-window ${timeWindowDays}`);
      }

      const result = execSync(
        args.join(' '),
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('学习失败:', error.message);
      return {
        success: false,
        patterns_identified: 0,
        insights_generated: 0,
        weights_updated: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 识别决策模式
   * @param {Array} decisions - 决策列表（可选，不提供则从文件加载）
   * @returns {Array} - 识别的模式列表
   */
  identifyPatterns(decisions = null) {
    try {
      let args = [`python "${this.pythonScript}" identify-patterns`];

      if (decisions) {
        const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'decisions_temp.json');
        const tempDir = path.dirname(tempFile);

        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        fs.writeFileSync(tempFile, JSON.stringify(decisions, null, 2));
        args.push(`--input "${tempFile}"`);
      }

      const result = execSync(
        args.join(' '),
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (decisions) {
        const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'decisions_temp.json');
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('识别模式失败:', error.message);
      return [];
    }
  }

  /**
   * 生成洞察
   * @param {Array} decisions - 决策列表
   * @param {Array} patterns - 模式列表
   * @returns {Array} - 生成的洞察列表
   */
  generateInsights(decisions, patterns) {
    try {
      const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'learning_input.json');
      const tempDir = path.dirname(tempFile);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify({ decisions, patterns }, null, 2));

      const result = execSync(
        `python "${this.pythonScript}" generate-insights --input "${tempFile}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('生成洞察失败:', error.message);
      return [];
    }
  }

  /**
   * 获取学习历史
   * @param {number} limit - 返回数量限制
   * @returns {Array} - 学习历史列表
   */
  getLearningHistory(limit = 20) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" get-history --limit ${limit}`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('获取学习历史失败:', error.message);
      return [];
    }
  }

  /**
   * 获取推荐权重
   * @returns {Object} - 推荐权重配置
   */
  getRecommendationWeights() {
    try {
      const result = execSync(
        `python "${this.pythonScript}" get-weights`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('获取推荐权重失败:', error.message);
      return {
        pattern_frequency: 0.3,
        success_rate: 0.4,
        recency: 0.2,
        context_similarity: 0.1,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 更新推荐权重
   * @param {Object} weights - 新的权重配置
   * @returns {Object} - 更新结果
   */
  updateRecommendationWeights(weights) {
    try {
      const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'weights_temp.json');
      const tempDir = path.dirname(tempFile);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify(weights, null, 2));

      const result = execSync(
        `python "${this.pythonScript}" update-weights --input "${tempFile}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('更新推荐权重失败:', error.message);
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
        total_decisions: 0,
        patterns_identified: 0,
        insights_generated: 0,
        learning_sessions: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 触发完整学习循环
   * @param {Object} options - 学习选项
   * @returns {Object} - 学习结果
   */
  triggerLearningCycle(options = {}) {
    try {
      const optionsJson = JSON.stringify(options);
      const result = execSync(
        `python "${this.pythonScript}" trigger-cycle '${optionsJson}'`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('触发学习循环失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = { LearningEngine };
