/**
 * Axiom-OMC-Superpowers Integration
 * 统一的智能开发工作流平台
 */

export { CommandRouter } from './core/CommandRouter.js';
export { StateManager } from './core/StateManager.js';
export { AgentRegistry } from './agents/AgentRegistry.js';
export { MemoryManager } from './memory/MemoryManager.js';

/**
 * 初始化整合系统
 */
export async function initialize(config = {}) {
  console.log('🚀 初始化 Axiom-OMC-Superpowers 整合系统...');
  
  // TODO: 实现初始化逻辑
  
  return {
    version: '1.0.0',
    status: 'initialized'
  };
}

export default { initialize };
