/**
 * v2 性能监控配置
 */
export const monitorConfig = {
  // 事件存储监控
  eventStore: {
    maxLatency: 100, // ms
    alertThreshold: 1000
  },

  // 事件总线监控
  eventBus: {
    maxLatency: 500, // ms
    alertThreshold: 1000
  }
};
