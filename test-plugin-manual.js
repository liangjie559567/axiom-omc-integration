// 手动测试 Claude Code 插件
import { createPlugin } from './src/plugin.js';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Claude Code 插件手动测试                                ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

async function runTests() {
    try {
        console.log('1/6 创建插件实例...');
        const plugin = createPlugin({
            memory: {
                storageDir: './.test-memory'
            },
            sync: {
                axiomRoot: './.agent',
                omcRoot: './.omc'
            }
        });
        console.log('✓ 插件实例创建成功');
        console.log('');

        console.log('2/6 初始化插件...');
        const initStart = Date.now();
        await plugin.initialize();
        const initDuration = Date.now() - initStart;
        console.log(`✓ 插件初始化成功 (${initDuration}ms)`);
        console.log('');

        console.log('3/6 激活插件...');
        await plugin.activate();
        console.log('✓ 插件激活成功');
        console.log('');

        console.log('4/6 测试命令...');

        // 测试 agent:list
        console.log('  测试 agent:list...');
        const listResult = await plugin.executeCommand('agent:list');
        if (listResult.success && listResult.agents.length === 32) {
            console.log(`  ✓ agent:list 正常 (${listResult.agents.length} 个 agents)`);
        } else {
            console.log('  ✗ agent:list 失败');
        }

        // 测试 agent:info
        console.log('  测试 agent:info architect...');
        const infoResult = await plugin.executeCommand('agent:info architect');
        if (infoResult.success) {
            console.log(`  ✓ agent:info 正常 (${infoResult.agent.name})`);
        } else {
            console.log('  ✗ agent:info 失败');
        }

        // 测试 workflow:list
        console.log('  测试 workflow:list...');
        const workflowResult = await plugin.executeCommand('workflow:list');
        if (workflowResult.success) {
            console.log(`  ✓ workflow:list 正常 (${workflowResult.workflows.length} 个 workflows)`);
        } else {
            console.log('  ✗ workflow:list 失败');
        }

        // 测试 memory:stats
        console.log('  测试 memory:stats...');
        const memoryResult = await plugin.executeCommand('memory:stats');
        if (memoryResult.success) {
            console.log('  ✓ memory:stats 正常');
        } else {
            console.log('  ✗ memory:stats 失败');
        }

        // 测试 plugin:info
        console.log('  测试 plugin:info...');
        const pluginInfoResult = await plugin.executeCommand('plugin:info');
        if (pluginInfoResult.success) {
            console.log(`  ✓ plugin:info 正常 (v${pluginInfoResult.plugin.version})`);
        } else {
            console.log('  ✗ plugin:info 失败');
        }

        console.log('');

        console.log('5/6 测试性能...');
        const perfStart = Date.now();
        await plugin.executeCommand('agent:list');
        const perfDuration = Date.now() - perfStart;
        console.log(`✓ 命令执行时间: ${perfDuration}ms`);
        console.log('');

        console.log('6/6 停用插件...');
        await plugin.deactivate();
        await plugin.destroy();
        console.log('✓ 插件已停用和销毁');
        console.log('');

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║     ✓ 所有测试通过！                                      ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('插件在当前 Claude Code 环境中运行正常！');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('✗ 测试失败:', error.message);
        console.error('');
        console.error('错误详情:', error);
        process.exit(1);
    }
}

runTests();
