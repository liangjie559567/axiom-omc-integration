/**
 * MCP集成层
 * 提供与外部服务的连接和协议适配
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger.js';

const logger = new Logger('MCPIntegrationLayer');

/**
 * 服务状态枚举
 */
export const ServiceStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error'
};

/**
 * 协议类型枚举
 */
export const ProtocolType = {
  HTTP: 'http',
  WEBSOCKET: 'websocket',
  GRPC: 'grpc',
  CUSTOM: 'custom'
};

/**
 * MCP集成层类
 */
export class MCPIntegrationLayer extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      healthCheckInterval: 30000, // 30秒
      reconnectAttempts: 3,
      reconnectDelay: 5000,
      timeout: 10000,
      ...options
    };

    // 服务注册表
    this.services = new Map();

    // 协议适配器
    this.adapters = new Map();

    // 连接池
    this.connections = new Map();

    // 健康检查定时器
    this.healthCheckTimers = new Map();

    logger.info('MCP集成层已初始化', this.options);
  }

  /**
   * 注册协议适配器
   * @param {string} protocol - 协议类型
   * @param {Object} adapter - 适配器实例
   */
  registerAdapter(protocol, adapter) {
    if (!adapter.connect || !adapter.disconnect || !adapter.send) {
      throw new Error('适配器必须实现 connect, disconnect, send 方法');
    }

    this.adapters.set(protocol, adapter);
    logger.info('协议适配器已注册', { protocol });
  }

  /**
   * 注册服务
   * @param {string} serviceId - 服务ID
   * @param {Object} config - 服务配置
   */
  registerService(serviceId, config) {
    const service = {
      id: serviceId,
      name: config.name,
      protocol: config.protocol || ProtocolType.HTTP,
      endpoint: config.endpoint,
      status: ServiceStatus.DISCONNECTED,
      metadata: config.metadata || {},
      healthCheck: config.healthCheck,
      retryCount: 0,
      lastHealthCheck: null,
      registeredAt: Date.now()
    };

    this.services.set(serviceId, service);
    logger.info('服务已注册', { serviceId, name: service.name });

    this.emit('service_registered', service);

    return service;
  }

  /**
   * 注销服务
   * @param {string} serviceId - 服务ID
   */
  async unregisterService(serviceId) {
    const service = this.services.get(serviceId);

    if (!service) {
      logger.warn('服务未找到', { serviceId });
      return;
    }

    // 断开连接
    if (service.status === ServiceStatus.CONNECTED) {
      await this.disconnect(serviceId);
    }

    // 停止健康检查
    this._stopHealthCheck(serviceId);

    // 移除服务
    this.services.delete(serviceId);

    logger.info('服务已注销', { serviceId });
    this.emit('service_unregistered', { serviceId });
  }

  /**
   * 连接服务
   * @param {string} serviceId - 服务ID
   * @returns {Promise<boolean>} 连接是否成功
   */
  async connect(serviceId) {
    const service = this.services.get(serviceId);

    if (!service) {
      throw new Error(`服务未找到: ${serviceId}`);
    }

    if (service.status === ServiceStatus.CONNECTED) {
      logger.warn('服务已连接', { serviceId });
      return true;
    }

    service.status = ServiceStatus.CONNECTING;
    this.emit('service_connecting', { serviceId });

    try {
      const adapter = this.adapters.get(service.protocol);

      if (!adapter) {
        throw new Error(`协议适配器未找到: ${service.protocol}`);
      }

      // 连接服务
      const connection = await adapter.connect(service.endpoint, {
        timeout: this.options.timeout,
        metadata: service.metadata
      });

      this.connections.set(serviceId, connection);
      service.status = ServiceStatus.CONNECTED;
      service.retryCount = 0;

      logger.info('服务已连接', { serviceId });
      this.emit('service_connected', { serviceId });

      // 启动健康检查
      if (service.healthCheck) {
        this._startHealthCheck(serviceId);
      }

      return true;

    } catch (error) {
      service.status = ServiceStatus.ERROR;
      logger.error('服务连接失败', { serviceId, error: error.message });
      this.emit('service_error', { serviceId, error });

      // 尝试重连
      if (service.retryCount < this.options.reconnectAttempts) {
        service.retryCount++;
        logger.info('尝试重连', { serviceId, attempt: service.retryCount });

        setTimeout(() => {
          this.connect(serviceId);
        }, this.options.reconnectDelay);
      }

      return false;
    }
  }

  /**
   * 断开服务
   * @param {string} serviceId - 服务ID
   */
  async disconnect(serviceId) {
    const service = this.services.get(serviceId);

    if (!service) {
      throw new Error(`服务未找到: ${serviceId}`);
    }

    if (service.status !== ServiceStatus.CONNECTED) {
      logger.warn('服务未连接', { serviceId });
      return;
    }

    try {
      const adapter = this.adapters.get(service.protocol);
      const connection = this.connections.get(serviceId);

      if (adapter && connection) {
        await adapter.disconnect(connection);
      }

      this.connections.delete(serviceId);
      service.status = ServiceStatus.DISCONNECTED;

      // 停止健康检查
      this._stopHealthCheck(serviceId);

      logger.info('服务已断开', { serviceId });
      this.emit('service_disconnected', { serviceId });

    } catch (error) {
      logger.error('服务断开失败', { serviceId, error: error.message });
      throw error;
    }
  }

  /**
   * 发送请求到服务
   * @param {string} serviceId - 服务ID
   * @param {Object} request - 请求数据
   * @returns {Promise<Object>} 响应数据
   */
  async send(serviceId, request) {
    const service = this.services.get(serviceId);

    if (!service) {
      throw new Error(`服务未找到: ${serviceId}`);
    }

    if (service.status !== ServiceStatus.CONNECTED) {
      // 尝试连接
      const connected = await this.connect(serviceId);
      if (!connected) {
        throw new Error(`服务未连接: ${serviceId}`);
      }
    }

    try {
      const adapter = this.adapters.get(service.protocol);
      const connection = this.connections.get(serviceId);

      if (!adapter || !connection) {
        throw new Error(`适配器或连接未找到: ${serviceId}`);
      }

      const response = await adapter.send(connection, request, {
        timeout: this.options.timeout
      });

      this.emit('request_sent', { serviceId, request, response });

      return response;

    } catch (error) {
      logger.error('请求发送失败', { serviceId, error: error.message });
      this.emit('request_error', { serviceId, request, error });
      throw error;
    }
  }

  /**
   * 批量发送请求
   * @param {string} serviceId - 服务ID
   * @param {Array} requests - 请求数组
   * @returns {Promise<Array>} 响应数组
   */
  async sendBatch(serviceId, requests) {
    const results = [];

    for (const request of requests) {
      try {
        const response = await this.send(serviceId, request);
        results.push({ success: true, response });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 获取服务状态
   * @param {string} serviceId - 服务ID
   * @returns {Object} 服务状态
   */
  getServiceStatus(serviceId) {
    const service = this.services.get(serviceId);

    if (!service) {
      return null;
    }

    return {
      id: service.id,
      name: service.name,
      status: service.status,
      protocol: service.protocol,
      endpoint: service.endpoint,
      lastHealthCheck: service.lastHealthCheck,
      retryCount: service.retryCount,
      registeredAt: service.registeredAt
    };
  }

  /**
   * 获取所有服务状态
   * @returns {Array} 服务状态数组
   */
  getAllServices() {
    return Array.from(this.services.values()).map(service => ({
      id: service.id,
      name: service.name,
      status: service.status,
      protocol: service.protocol,
      endpoint: service.endpoint,
      lastHealthCheck: service.lastHealthCheck
    }));
  }

  /**
   * 启动健康检查
   * @private
   */
  _startHealthCheck(serviceId) {
    const service = this.services.get(serviceId);

    if (!service || !service.healthCheck) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const isHealthy = await this._performHealthCheck(serviceId);

        if (!isHealthy && service.status === ServiceStatus.CONNECTED) {
          logger.warn('健康检查失败', { serviceId });
          this.emit('health_check_failed', { serviceId });

          // 尝试重连
          await this.disconnect(serviceId);
          await this.connect(serviceId);
        }

      } catch (error) {
        logger.error('健康检查错误', { serviceId, error: error.message });
      }
    }, this.options.healthCheckInterval);

    this.healthCheckTimers.set(serviceId, timer);
  }

  /**
   * 停止健康检查
   * @private
   */
  _stopHealthCheck(serviceId) {
    const timer = this.healthCheckTimers.get(serviceId);

    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(serviceId);
    }
  }

  /**
   * 执行健康检查
   * @private
   */
  async _performHealthCheck(serviceId) {
    const service = this.services.get(serviceId);

    if (!service || !service.healthCheck) {
      return true;
    }

    try {
      const response = await this.send(serviceId, service.healthCheck);
      service.lastHealthCheck = Date.now();

      return response && response.status === 'ok';

    } catch (error) {
      logger.warn('健康检查请求失败', { serviceId, error: error.message });
      return false;
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const total = this.services.size;
    const connected = Array.from(this.services.values())
      .filter(s => s.status === ServiceStatus.CONNECTED).length;
    const disconnected = Array.from(this.services.values())
      .filter(s => s.status === ServiceStatus.DISCONNECTED).length;
    const error = Array.from(this.services.values())
      .filter(s => s.status === ServiceStatus.ERROR).length;

    const byProtocol = {};
    for (const service of this.services.values()) {
      byProtocol[service.protocol] = (byProtocol[service.protocol] || 0) + 1;
    }

    return {
      total,
      connected,
      disconnected,
      error,
      byProtocol,
      adapters: this.adapters.size
    };
  }

  /**
   * 销毁集成层
   */
  async destroy() {
    // 断开所有连接
    for (const serviceId of this.services.keys()) {
      try {
        await this.disconnect(serviceId);
      } catch (error) {
        logger.error('断开服务失败', { serviceId, error: error.message });
      }
    }

    // 停止所有健康检查
    for (const serviceId of this.healthCheckTimers.keys()) {
      this._stopHealthCheck(serviceId);
    }

    // 清空数据
    this.services.clear();
    this.adapters.clear();
    this.connections.clear();
    this.healthCheckTimers.clear();

    this.removeAllListeners();

    logger.info('MCP集成层已销毁');
  }
}

export default MCPIntegrationLayer;
