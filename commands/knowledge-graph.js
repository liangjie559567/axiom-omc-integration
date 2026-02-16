/**
 * Axiom + OMC 知识图谱
 * 管理知识节点和关系，支持节点查询、关系遍历、图谱分析
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 节点类型枚举
 */
const NodeType = {
  DECISION: 'decision',
  PATTERN: 'pattern',
  INSIGHT: 'insight',
  DOCUMENT: 'document',
  COMPONENT: 'component',
  ISSUE: 'issue'
};

/**
 * 关系类型枚举
 */
const RelationType = {
  DEPENDS_ON: 'depends_on',
  RELATED_TO: 'related_to',
  IMPLEMENTS: 'implements',
  EXTENDS: 'extends',
  USES: 'uses',
  REFERENCES: 'references'
};

/**
 * 知识图谱类
 */
class KnowledgeGraph {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.pythonScript = path.join(projectRoot, '.agent', 'knowledge', 'knowledge_graph.py');
    this.graphPath = path.join(projectRoot, '.agent', 'knowledge', 'knowledge_graph.json');
  }

  /**
   * 添加节点
   * @param {Object} node - 节点数据
   * @returns {Object} - 添加结果
   */
  addNode(node) {
    try {
      const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'node_temp.json');
      const tempDir = path.dirname(tempFile);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify(node, null, 2));

      const result = execSync(
        `python "${this.pythonScript}" add-node "${tempFile}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('添加节点失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取节点
   * @param {string} nodeId - 节点 ID
   * @returns {Object} - 节点数据
   */
  getNode(nodeId) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" get-node "${nodeId}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('获取节点失败:', error.message);
      return {
        node: null,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 更新节点
   * @param {string} nodeId - 节点 ID
   * @param {Object} updates - 更新数据
   * @returns {Object} - 更新结果
   */
  updateNode(nodeId, updates) {
    try {
      const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'update_temp.json');
      const tempDir = path.dirname(tempFile);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify({ nodeId, updates }, null, 2));

      const result = execSync(
        `python "${this.pythonScript}" update-node "${tempFile}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('更新节点失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 删除节点
   * @param {string} nodeId - 节点 ID
   * @returns {Object} - 删除结果
   */
  deleteNode(nodeId) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" delete-node "${nodeId}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('删除节点失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 添加边（关系）
   * @param {string} sourceId - 源节点 ID
   * @param {string} targetId - 目标节点 ID
   * @param {string} relationType - 关系类型
   * @param {Object} metadata - 关系元数据
   * @returns {Object} - 添加结果
   */
  addEdge(sourceId, targetId, relationType, metadata = {}) {
    try {
      const tempFile = path.join(this.projectRoot, '.agent', 'temp', 'edge_temp.json');
      const tempDir = path.dirname(tempFile);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify({
        sourceId,
        targetId,
        relationType,
        metadata
      }, null, 2));

      const result = execSync(
        `python "${this.pythonScript}" add-edge "${tempFile}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 清理临时文件
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('添加边失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 删除边
   * @param {string} sourceId - 源节点 ID
   * @param {string} targetId - 目标节点 ID
   * @returns {Object} - 删除结果
   */
  deleteEdge(sourceId, targetId) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" delete-edge "${sourceId}" "${targetId}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('删除边失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 查询节点（按类型、标签等）
   * @param {Object} filters - 查询过滤器
   * @returns {Array} - 节点列表
   */
  queryNodes(filters = {}) {
    try {
      const filtersJson = JSON.stringify(filters);
      const result = execSync(
        `python "${this.pythonScript}" query-nodes '${filtersJson}'`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('查询节点失败:', error.message);
      return [];
    }
  }

  /**
   * 获取节点的邻居
   * @param {string} nodeId - 节点 ID
   * @param {string} direction - 方向 (in | out | both)
   * @param {number} depth - 遍历深度
   * @returns {Array} - 邻居节点列表
   */
  getNeighbors(nodeId, direction = 'both', depth = 1) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" get-neighbors "${nodeId}" --direction ${direction} --depth ${depth}`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('获取邻居节点失败:', error.message);
      return [];
    }
  }

  /**
   * 查找路径
   * @param {string} sourceId - 源节点 ID
   * @param {string} targetId - 目标节点 ID
   * @param {number} maxDepth - 最大深度
   * @returns {Array} - 路径列表
   */
  findPaths(sourceId, targetId, maxDepth = 5) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" find-paths "${sourceId}" "${targetId}" --max-depth ${maxDepth}`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('查找路径失败:', error.message);
      return [];
    }
  }

  /**
   * 获取图谱统计信息
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
        total_nodes: 0,
        total_edges: 0,
        node_types: {},
        edge_types: {},
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 导出图谱
   * @param {string} format - 导出格式 (json | graphml | dot)
   * @param {string} outputPath - 输出路径
   * @returns {Object} - 导出结果
   */
  exportGraph(format = 'json', outputPath = null) {
    try {
      const args = [`python "${this.pythonScript}" export --format ${format}`];
      if (outputPath) {
        args.push(`--output "${outputPath}"`);
      }

      const result = execSync(
        args.join(' '),
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('导出图谱失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 导入图谱
   * @param {string} inputPath - 输入路径
   * @param {string} format - 导入格式 (json | graphml)
   * @param {boolean} merge - 是否合并（否则替换）
   * @returns {Object} - 导入结果
   */
  importGraph(inputPath, format = 'json', merge = false) {
    try {
      const args = [
        `python "${this.pythonScript}" import`,
        `--input "${inputPath}"`,
        `--format ${format}`
      ];
      if (merge) {
        args.push('--merge');
      }

      const result = execSync(
        args.join(' '),
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('导入图谱失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 分析图谱（中心性、社区检测等）
   * @param {string} analysisType - 分析类型
   * @returns {Object} - 分析结果
   */
  analyzeGraph(analysisType = 'centrality') {
    try {
      const result = execSync(
        `python "${this.pythonScript}" analyze --type ${analysisType}`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error('分析图谱失败:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = {
  KnowledgeGraph,
  NodeType,
  RelationType
};
