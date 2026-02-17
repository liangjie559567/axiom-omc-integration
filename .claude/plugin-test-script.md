# Axiom-OMC Integration 插件测试脚本

## 测试日期
2026-02-17

## 测试步骤

### 1. 插件安装测试

```bash
# 添加插件市场
/plugin marketplace add liangjie559567/axiom-omc-integration

# 预期结果：成功添加市场
```

```bash
# 安装插件
/plugin install axiom-omc@axiom-omc-integration

# 预期结果：安装成功，提示重启
```

```bash
# 查看已安装插件
/plugin

# 预期结果：列表中显示 axiom-omc
```

### 2. 技能调用测试

#### 测试 1: brainstorming
```bash
/axiom-omc:brainstorming

# 预期结果：技能启动，显示头脑风暴提示
```

#### 测试 2: systematic-debugging
```bash
/axiom-omc:systematic-debugging

# 预期结果：技能启动，显示调试流程
```

#### 测试 3: test-driven-development
```bash
/axiom-omc:test-driven-development

# 预期结果：技能启动，显示TDD流程
```
