#!/bin/bash

# Claude Code 插件真实环境测试脚本
# 这个脚本在真实的 Claude Code 环境中测试插件

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Claude Code 插件真实环境测试                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Claude Code 是否安装
check_claude_code() {
    echo "检查 Claude Code 安装..."

    if command -v claude &> /dev/null; then
        echo -e "${GREEN}✓${NC} Claude Code 已安装"
        claude --version
        return 0
    else
        echo -e "${RED}✗${NC} Claude Code 未安装"
        echo ""
        echo "请先安装 Claude Code:"
        echo "  npm install -g @anthropic/claude-code"
        return 1
    fi
}

# 检查插件目录
check_plugin_directory() {
    echo ""
    echo "检查 Claude Code 插件目录..."

    CLAUDE_PLUGINS_DIR="$HOME/.claude/plugins"

    if [ -d "$CLAUDE_PLUGINS_DIR" ]; then
        echo -e "${GREEN}✓${NC} 插件目录存在: $CLAUDE_PLUGINS_DIR"
        return 0
    else
        echo -e "${YELLOW}!${NC} 插件目录不存在，创建中..."
        mkdir -p "$CLAUDE_PLUGINS_DIR"
        echo -e "${GREEN}✓${NC} 插件目录已创建"
        return 0
    fi
}

# 安装插件到 Claude Code
install_plugin() {
    echo ""
    echo "安装插件到 Claude Code..."

    PLUGIN_DIR="$HOME/.claude/plugins/axiom-omc"

    # 如果插件已存在，先删除
    if [ -d "$PLUGIN_DIR" ]; then
        echo -e "${YELLOW}!${NC} 插件已存在，删除旧版本..."
        rm -rf "$PLUGIN_DIR"
    fi

    # 复制插件文件
    echo "复制插件文件..."
    cp -r "$(pwd)" "$PLUGIN_DIR"

    # 安装依赖
    echo "安装插件依赖..."
    cd "$PLUGIN_DIR"
    npm install --production

    echo -e "${GREEN}✓${NC} 插件已安装到: $PLUGIN_DIR"
}

# 测试插件加载
test_plugin_loading() {
    echo ""
    echo "测试插件加载..."

    # 创建测试脚本
    cat > /tmp/test-plugin-load.js << 'EOF'
import { createPlugin } from './src/plugin.js';

try {
    const plugin = createPlugin();
    console.log('✓ 插件模块加载成功');
    console.log('✓ createPlugin 函数可用');
    process.exit(0);
} catch (error) {
    console.error('✗ 插件加载失败:', error.message);
    process.exit(1);
}
EOF

    cd "$HOME/.claude/plugins/axiom-omc"

    if node /tmp/test-plugin-load.js; then
        echo -e "${GREEN}✓${NC} 插件加载测试通过"
        return 0
    else
        echo -e "${RED}✗${NC} 插件加载测试失败"
        return 1
    fi
}

# 测试插件初始化
test_plugin_initialization() {
    echo ""
    echo "测试插件初始化..."

    cat > /tmp/test-plugin-init.js << 'EOF'
import { createPlugin } from './src/plugin.js';

async function test() {
    try {
        const plugin = createPlugin({
            memory: { storageDir: '/tmp/test-plugin-memory' }
        });

        await plugin.initialize();
        console.log('✓ 插件初始化成功');

        if (plugin.agentSystem) {
            console.log('✓ Agent 系统已加载');
        }

        if (plugin.commandRouter) {
            console.log('✓ 命令路由器已加载');
        }

        if (plugin.memorySystem) {
            console.log('✓ 记忆系统已加载');
        }

        await plugin.destroy();
        console.log('✓ 插件销毁成功');

        process.exit(0);
    } catch (error) {
        console.error('✗ 测试失败:', error.message);
        process.exit(1);
    }
}

test();
EOF

    cd "$HOME/.claude/plugins/axiom-omc"

    if node /tmp/test-plugin-init.js; then
        echo -e "${GREEN}✓${NC} 插件初始化测试通过"
        return 0
    else
        echo -e "${RED}✗${NC} 插件初始化测试失败"
        return 1
    fi
}

# 测试插件命令
test_plugin_commands() {
    echo ""
    echo "测试插件命令..."

    cat > /tmp/test-plugin-commands.js << 'EOF'
import { createPlugin } from './src/plugin.js';

async function test() {
    try {
        const plugin = createPlugin({
            memory: { storageDir: '/tmp/test-plugin-memory' }
        });

        await plugin.activate();

        // 测试 agent:list 命令
        const listResult = await plugin.executeCommand('agent:list');
        if (listResult.success && listResult.agents.length === 32) {
            console.log('✓ agent:list 命令正常');
        } else {
            throw new Error('agent:list 命令失败');
        }

        // 测试 workflow:list 命令
        const workflowResult = await plugin.executeCommand('workflow:list');
        if (workflowResult.success) {
            console.log('✓ workflow:list 命令正常');
        } else {
            throw new Error('workflow:list 命令失败');
        }

        // 测试 memory:stats 命令
        const memoryResult = await plugin.executeCommand('memory:stats');
        if (memoryResult.success) {
            console.log('✓ memory:stats 命令正常');
        } else {
            throw new Error('memory:stats 命令失败');
        }

        // 测试 plugin:info 命令
        const infoResult = await plugin.executeCommand('plugin:info');
        if (infoResult.success) {
            console.log('✓ plugin:info 命令正常');
        } else {
            throw new Error('plugin:info 命令失败');
        }

        await plugin.destroy();

        process.exit(0);
    } catch (error) {
        console.error('✗ 测试失败:', error.message);
        process.exit(1);
    }
}

test();
EOF

    cd "$HOME/.claude/plugins/axiom-omc"

    if node /tmp/test-plugin-commands.js; then
        echo -e "${GREEN}✓${NC} 插件命令测试通过"
        return 0
    else
        echo -e "${RED}✗${NC} 插件命令测试失败"
        return 1
    fi
}

# 测试插件性能
test_plugin_performance() {
    echo ""
    echo "测试插件性能..."

    cat > /tmp/test-plugin-perf.js << 'EOF'
import { createPlugin } from './src/plugin.js';

async function test() {
    try {
        const plugin = createPlugin({
            memory: { storageDir: '/tmp/test-plugin-memory' }
        });

        // 测试初始化时间
        const initStart = Date.now();
        await plugin.initialize();
        const initDuration = Date.now() - initStart;

        if (initDuration < 2000) {
            console.log(`✓ 初始化时间: ${initDuration}ms (< 2000ms)`);
        } else {
            console.log(`! 初始化时间: ${initDuration}ms (较慢)`);
        }

        await plugin.activate();

        // 测试命令执行时间
        const cmdStart = Date.now();
        await plugin.executeCommand('agent:list');
        const cmdDuration = Date.now() - cmdStart;

        if (cmdDuration < 100) {
            console.log(`✓ 命令执行时间: ${cmdDuration}ms (< 100ms)`);
        } else {
            console.log(`! 命令执行时间: ${cmdDuration}ms (较慢)`);
        }

        await plugin.destroy();

        process.exit(0);
    } catch (error) {
        console.error('✗ 测试失败:', error.message);
        process.exit(1);
    }
}

test();
EOF

    cd "$HOME/.claude/plugins/axiom-omc"

    if node /tmp/test-plugin-perf.js; then
        echo -e "${GREEN}✓${NC} 插件性能测试通过"
        return 0
    else
        echo -e "${RED}✗${NC} 插件性能测试失败"
        return 1
    fi
}

# 清理测试文件
cleanup() {
    echo ""
    echo "清理测试文件..."
    rm -f /tmp/test-plugin-*.js
    rm -rf /tmp/test-plugin-memory
    echo -e "${GREEN}✓${NC} 清理完成"
}

# 主测试流程
main() {
    local failed=0

    # 检查环境
    if ! check_claude_code; then
        echo ""
        echo -e "${RED}环境检查失败，退出测试${NC}"
        exit 1
    fi

    check_plugin_directory || failed=1

    # 安装插件
    install_plugin || failed=1

    # 运行测试
    test_plugin_loading || failed=1
    test_plugin_initialization || failed=1
    test_plugin_commands || failed=1
    test_plugin_performance || failed=1

    # 清理
    cleanup

    # 总结
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    if [ $failed -eq 0 ]; then
        echo "║     ${GREEN}所有测试通过！${NC}                                        ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "插件已成功安装到 Claude Code！"
        echo ""
        echo "使用方法:"
        echo "  1. 启动 Claude Code"
        echo "  2. 运行: /plugin activate axiom-omc"
        echo "  3. 使用命令: /agent list, /workflow start, 等"
        echo ""
        exit 0
    else
        echo "║     ${RED}部分测试失败${NC}                                          ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "请检查错误信息并修复问题"
        echo ""
        exit 1
    fi
}

# 运行主流程
main
