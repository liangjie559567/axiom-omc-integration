/**
 * MCP集成层测试
 */

import { jest } from '@jest/globals';
import MCPIntegrationLayer, { ServiceStatus, ProtocolType } from '../MCPIntegrationLayer.js';

describe('MCPIntegrationLayer', () => {
  let layer;
  let mockAdapter;

  beforeEach(() => {
    layer = new MCPIntegrationLayer({
      healthCheckInterval: 1000,
      reconnectAttempts: 2,
      reconnectDelay: 100,
      timeout: 5000
    });

    mockAdapter = {
      connect: jest.fn().mockResolvedValue({ id: 'conn-1' }),
      disconnect: jest.fn().mockResolvedValue(true),
      send: jest.fn().mockResolvedValue({ status: 'ok', data: 'test' })
    };
  });

  afterEach(async () => {
    await layer.destroy();
  });

  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(layer).toBeDefined();
      expect(layer.services.size).toBe(0);
      expect(layer.adapters.size).toBe(0);
    });
  });

  describe('协议适配器', () => {
    test('应该注册协议适配器', () => {
      layer.registerAdapter(ProtocolType.HTTP, mockAdapter);
      expect(layer.adapters.has(ProtocolType.HTTP)).toBe(true);
    });

    test('应该拒绝无效的适配器', () => {
      const invalidAdapter = { connect: jest.fn() };
      expect(() => {
        layer.registerAdapter(ProtocolType.HTTP, invalidAdapter);
      }).toThrow('适配器必须实现 connect, disconnect, send 方法');
    });
  });

  describe('服务注册', () => {
    test('应该注册服务', () => {
      const service = layer.registerService('service-1', {
        name: 'Test Service',
        protocol: ProtocolType.HTTP,
        endpoint: 'http://localhost:3000'
      });

      expect(service).toBeDefined();
      expect(service.id).toBe('service-1');
      expect(service.status).toBe(ServiceStatus.DISCONNECTED);
      expect(layer.services.has('service-1')).toBe(true);
    });

    test('应该触发服务注册事件', (done) => {
      layer.once('service_registered', (service) => {
        expect(service.id).toBe('service-1');
        done();
      });

      layer.registerService('service-1', {
        name: 'Test Service',
        endpoint: 'http://localhost:3000'
      });
    });

    test('应该注销服务', async () => {
      layer.registerService('service-1', {
        name: 'Test Service',
        endpoint: 'http://localhost:3000'
      });

      await layer.unregisterService('service-1');
      expect(layer.services.has('service-1')).toBe(false);
    });
  });

  describe('服务连接', () => {
    beforeEach(() => {
      layer.registerAdapter(ProtocolType.HTTP, mockAdapter);
      layer.registerService('service-1', {
        name: 'Test Service',
        protocol: ProtocolType.HTTP,
        endpoint: 'http://localhost:3000'
      });
    });

    test('应该连接服务', async () => {
      const connected = await layer.connect('service-1');

      expect(connected).toBe(true);
      expect(mockAdapter.connect).toHaveBeenCalled();

      const service = layer.services.get('service-1');
      expect(service.status).toBe(ServiceStatus.CONNECTED);
    });

    test('应该触发连接事件', async () => {
      const events = [];

      layer.on('service_connecting', (e) => events.push('connecting'));
      layer.on('service_connected', (e) => events.push('connected'));

      await layer.connect('service-1');

      expect(events).toEqual(['connecting', 'connected']);
    });

    test('应该处理连接失败', async () => {
      mockAdapter.connect.mockRejectedValue(new Error('Connection failed'));

      const connected = await layer.connect('service-1');

      expect(connected).toBe(false);

      const service = layer.services.get('service-1');
      expect(service.status).toBe(ServiceStatus.ERROR);
    });

    test('应该断开服务', async () => {
      await layer.connect('service-1');
      await layer.disconnect('service-1');

      expect(mockAdapter.disconnect).toHaveBeenCalled();

      const service = layer.services.get('service-1');
      expect(service.status).toBe(ServiceStatus.DISCONNECTED);
    });

    test('应该抛出未找到服务的错误', async () => {
      await expect(layer.connect('non-existent')).rejects.toThrow('服务未找到');
    });
  });

  describe('请求发送', () => {
    beforeEach(async () => {
      layer.registerAdapter(ProtocolType.HTTP, mockAdapter);
      layer.registerService('service-1', {
        name: 'Test Service',
        protocol: ProtocolType.HTTP,
        endpoint: 'http://localhost:3000'
      });
      await layer.connect('service-1');
    });

    test('应该发送请求', async () => {
      const request = { method: 'GET', path: '/test' };
      const response = await layer.send('service-1', request);

      expect(mockAdapter.send).toHaveBeenCalledWith(
        expect.anything(),
        request,
        expect.objectContaining({ timeout: 5000 })
      );
      expect(response).toEqual({ status: 'ok', data: 'test' });
    });

    test('应该触发请求事件', async () => {
      const eventPromise = new Promise(resolve => {
        layer.once('request_sent', resolve);
      });

      await layer.send('service-1', { method: 'GET' });

      const event = await eventPromise;
      expect(event.serviceId).toBe('service-1');
    });

    test('应该处理请求失败', async () => {
      mockAdapter.send.mockRejectedValue(new Error('Request failed'));

      await expect(layer.send('service-1', { method: 'GET' }))
        .rejects.toThrow('Request failed');
    });

    test('应该自动连接未连接的服务', async () => {
      await layer.disconnect('service-1');

      const response = await layer.send('service-1', { method: 'GET' });

      expect(response).toBeDefined();
      expect(mockAdapter.connect).toHaveBeenCalledTimes(2); // 初始连接 + 自动重连
    });
  });

  describe('批量请求', () => {
    beforeEach(async () => {
      layer.registerAdapter(ProtocolType.HTTP, mockAdapter);
      layer.registerService('service-1', {
        name: 'Test Service',
        protocol: ProtocolType.HTTP,
        endpoint: 'http://localhost:3000'
      });
      await layer.connect('service-1');
    });

    test('应该批量发送请求', async () => {
      const requests = [
        { method: 'GET', path: '/1' },
        { method: 'GET', path: '/2' },
        { method: 'GET', path: '/3' }
      ];

      const results = await layer.sendBatch('service-1', requests);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    test('应该处理部分失败', async () => {
      mockAdapter.send
        .mockResolvedValueOnce({ status: 'ok' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ status: 'ok' });

      const requests = [
        { method: 'GET', path: '/1' },
        { method: 'GET', path: '/2' },
        { method: 'GET', path: '/3' }
      ];

      const results = await layer.sendBatch('service-1', requests);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('服务状态', () => {
    test('应该获取服务状态', () => {
      layer.registerService('service-1', {
        name: 'Test Service',
        endpoint: 'http://localhost:3000'
      });

      const status = layer.getServiceStatus('service-1');

      expect(status).toBeDefined();
      expect(status.id).toBe('service-1');
      expect(status.status).toBe(ServiceStatus.DISCONNECTED);
    });

    test('应该返回null对于不存在的服务', () => {
      const status = layer.getServiceStatus('non-existent');
      expect(status).toBeNull();
    });

    test('应该获取所有服务', () => {
      layer.registerService('service-1', {
        name: 'Service 1',
        endpoint: 'http://localhost:3000'
      });

      layer.registerService('service-2', {
        name: 'Service 2',
        endpoint: 'http://localhost:3001'
      });

      const services = layer.getAllServices();

      expect(services).toHaveLength(2);
      expect(services[0].id).toBe('service-1');
      expect(services[1].id).toBe('service-2');
    });
  });

  describe('健康检查', () => {
    beforeEach(() => {
      layer.registerAdapter(ProtocolType.HTTP, mockAdapter);
    });

    test('应该启动健康检查', async () => {
      layer.registerService('service-1', {
        name: 'Test Service',
        protocol: ProtocolType.HTTP,
        endpoint: 'http://localhost:3000',
        healthCheck: { method: 'GET', path: '/health' }
      });

      await layer.connect('service-1');

      expect(layer.healthCheckTimers.has('service-1')).toBe(true);
    });

    test('应该停止健康检查', async () => {
      layer.registerService('service-1', {
        name: 'Test Service',
        protocol: ProtocolType.HTTP,
        endpoint: 'http://localhost:3000',
        healthCheck: { method: 'GET', path: '/health' }
      });

      await layer.connect('service-1');
      await layer.disconnect('service-1');

      expect(layer.healthCheckTimers.has('service-1')).toBe(false);
    });
  });

  describe('统计信息', () => {
    test('应该生成统计信息', async () => {
      layer.registerAdapter(ProtocolType.HTTP, mockAdapter);

      layer.registerService('service-1', {
        name: 'Service 1',
        protocol: ProtocolType.HTTP,
        endpoint: 'http://localhost:3000'
      });

      layer.registerService('service-2', {
        name: 'Service 2',
        protocol: ProtocolType.WEBSOCKET,
        endpoint: 'ws://localhost:3001'
      });

      await layer.connect('service-1');

      const stats = layer.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.connected).toBe(1);
      expect(stats.disconnected).toBe(1);
      expect(stats.byProtocol[ProtocolType.HTTP]).toBe(1);
      expect(stats.byProtocol[ProtocolType.WEBSOCKET]).toBe(1);
      expect(stats.adapters).toBe(1);
    });
  });

  describe('销毁', () => {
    test('应该正确销毁', async () => {
      layer.registerAdapter(ProtocolType.HTTP, mockAdapter);

      layer.registerService('service-1', {
        name: 'Test Service',
        protocol: ProtocolType.HTTP,
        endpoint: 'http://localhost:3000'
      });

      await layer.connect('service-1');
      await layer.destroy();

      expect(layer.services.size).toBe(0);
      expect(layer.adapters.size).toBe(0);
      expect(layer.connections.size).toBe(0);
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });
  });
});
