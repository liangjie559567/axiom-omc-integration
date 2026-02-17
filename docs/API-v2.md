# v2 API 文档

## EventStore

### append(event)
追加事件到存储。

**参数：**
- `event` (Object) - 事件对象

**返回：** Object - 存储的事件（含id和timestamp）

### getEvents(instanceId)
获取实例的所有事件。

**参数：**
- `instanceId` (String) - 实例ID

**返回：** Array - 事件列表

---

## EventBus

### subscribe(eventType, handler)
订阅事件。

**参数：**
- `eventType` (String) - 事件类型
- `handler` (Function) - 处理函数

### publish(event)
发布事件。

**参数：**
- `event` (Object) - 事件对象

**返回：** Promise
