/**
 * v2 架构导出
 */
export { EventStore } from './core/EventStore.js';
export { EventBus } from './core/EventBus.js';
export { CommandHandler } from './cqrs/CommandHandler.js';
export { QueryHandler } from './cqrs/QueryHandler.js';
export { ReadModel } from './cqrs/ReadModel.js';
export { PhaseMapper } from './v2/PhaseMapper.js';
export { AutoSyncEngine } from './v2/AutoSyncEngine.js';
export { WorkflowOrchestrator } from './v2/WorkflowOrchestrator.js';
