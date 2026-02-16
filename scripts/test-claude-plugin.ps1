# Claude Code 插件真实环境测试脚本 (PowerShell)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Claude Code 插件真实环境测试                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$failed = 0

# 检查 Claude Code 是否安装
function Test-ClaudeCode {
    Write-Host "检查 Claude Code 安装..." -ForegroundColor Yellow

    if (Get-Command claude -ErrorAction SilentlyContinue) {
        Write-Host "✓ Claude Code 已安装" -ForegroundColor Green
        claude --version
        return $true
    } else {
        Write-Host "✗ Claude Code 未安装" -ForegroundColor Red
        Write-Host ""
        Write-Host "请先安装 Claude Code:"
        Write-Host "  npm install -g @anthropic/claude-code"
        return $false
    }
}

# 检查插件目录
function Test-PluginDirectory {
    Write-Host ""
    Write-Host "检查 Claude Code 插件目录..." -ForegroundColor Yellow

    $pluginsDir = "$env:USERPROFILE\.claude\plugins"

    if (Test-Path $pluginsDir) {
        Write-Host "✓ 插件目录存在: $pluginsDir" -ForegroundColor Green
        return $true
    } else {
        Write-Host "! 插件目录不存在，创建中..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $pluginsDir -Force | Out-Null
        Write-Host "✓ 插件目录已创建" -ForegroundColor Green
        return $true
    }
}

# 安装插件到 Claude Code
function Install-Plugin {
    Write-Host ""
    Write-Host "安装插件到 Claude Code..." -ForegroundColor Yellow

    $pluginDir = "$env:USERPROFILE\.claude\plugins\axiom-omc"

    # 如果插件已存在，先删除
    if (Test-Path $pluginDir) {
        Write-Host "! 插件已存在，删除旧版本..." -ForegroundColor Yellow
        Remove-Item -Path $pluginDir -Recurse -Force
    }

    # 复制插件文件
    Write-Host "复制插件文件..."
    Copy-Item -Path (Get-Location) -Destination $pluginDir -Recurse -Force

    # 安装依赖
    Write-Host "安装插件依赖..."
    Push-Location $pluginDir
    npm install --production 2>&1 | Out-Null
    Pop-Location

    Write-Host "✓ 插件已安装到: $pluginDir" -ForegroundColor Green
    return $true
}

# 测试插件加载
function Test-PluginLoading {
    Write-Host ""
    Write-Host "测试插件加载..." -ForegroundColor Yellow

    $testScript = @'
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
'@

    $testScript | Out-File -FilePath "$env:TEMP\test-plugin-load.js" -Encoding UTF8

    Push-Location "$env:USERPROFILE\.claude\plugins\axiom-omc"
    $result = node "$env:TEMP\test-plugin-load.js" 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location

    Write-Host $result

    if ($exitCode -eq 0) {
        Write-Host "✓ 插件加载测试通过" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ 插件加载测试失败" -ForegroundColor Red
        return $false
    }
}

# 测试插件初始化
function Test-PluginInitialization {
    Write-Host ""
    Write-Host "测试插件初始化..." -ForegroundColor Yellow

    $testScript = @'
import { createPlugin } from './src/plugin.js';

async function test() {
    try {
        const plugin = createPlugin({
            memory: { storageDir: process.env.TEMP + '/test-plugin-memory' }
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
'@

    $testScript | Out-File -FilePath "$env:TEMP\test-plugin-init.js" -Encoding UTF8

    Push-Location "$env:USERPROFILE\.claude\plugins\axiom-omc"
    $result = node "$env:TEMP\test-plugin-init.js" 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location

    Write-Host $result

    if ($exitCode -eq 0) {
        Write-Host "✓ 插件初始化测试通过" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ 插件初始化测试失败" -ForegroundColor Red
        return $false
    }
}

# 测试插件命令
function Test-PluginCommands {
    Write-Host ""
    Write-Host "测试插件命令..." -ForegroundColor Yellow

    $testScript = @'
import { createPlugin } from './src/plugin.js';

async function test() {
    try {
        const plugin = createPlugin({
            memory: { storageDir: process.env.TEMP + '/test-plugin-memory' }
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
'@

    $testScript | Out-File -FilePath "$env:TEMP\test-plugin-commands.js" -Encoding UTF8

    Push-Location "$env:USERPROFILE\.claude\plugins\axiom-omc"
    $result = node "$env:TEMP\test-plugin-commands.js" 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location

    Write-Host $result

    if ($exitCode -eq 0) {
        Write-Host "✓ 插件命令测试通过" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ 插件命令测试失败" -ForegroundColor Red
        return $false
    }
}

# 测试插件性能
function Test-PluginPerformance {
    Write-Host ""
    Write-Host "测试插件性能..." -ForegroundColor Yellow

    $testScript = @'
import { createPlugin } from './src/plugin.js';

async function test() {
    try {
        const plugin = createPlugin({
            memory: { storageDir: process.env.TEMP + '/test-plugin-memory' }
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
'@

    $testScript | Out-File -FilePath "$env:TEMP\test-plugin-perf.js" -Encoding UTF8

    Push-Location "$env:USERPROFILE\.claude\plugins\axiom-omc"
    $result = node "$env:TEMP\test-plugin-perf.js" 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location

    Write-Host $result

    if ($exitCode -eq 0) {
        Write-Host "✓ 插件性能测试通过" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ 插件性能测试失败" -ForegroundColor Red
        return $false
    }
}

# 清理测试文件
function Clear-TestFiles {
    Write-Host ""
    Write-Host "清理测试文件..." -ForegroundColor Yellow
    Remove-Item "$env:TEMP\test-plugin-*.js" -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:TEMP\test-plugin-memory" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ 清理完成" -ForegroundColor Green
}

# 主测试流程
function Main {
    # 检查环境
    if (-not (Test-ClaudeCode)) {
        Write-Host ""
        Write-Host "环境检查失败，退出测试" -ForegroundColor Red
        exit 1
    }

    if (-not (Test-PluginDirectory)) { $script:failed++ }

    # 安装插件
    if (-not (Install-Plugin)) { $script:failed++ }

    # 运行测试
    if (-not (Test-PluginLoading)) { $script:failed++ }
    if (-not (Test-PluginInitialization)) { $script:failed++ }
    if (-not (Test-PluginCommands)) { $script:failed++ }
    if (-not (Test-PluginPerformance)) { $script:failed++ }

    # 清理
    Clear-TestFiles

    # 总结
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    if ($script:failed -eq 0) {
        Write-Host "║     所有测试通过！                                        ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "插件已成功安装到 Claude Code！"
        Write-Host ""
        Write-Host "使用方法:"
        Write-Host "  1. 启动 Claude Code"
        Write-Host "  2. 运行: /plugin activate axiom-omc"
        Write-Host "  3. 使用命令: /agent list, /workflow start, 等"
        Write-Host ""
        exit 0
    } else {
        Write-Host "║     部分测试失败                                          ║" -ForegroundColor Red
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "请检查错误信息并修复问题"
        Write-Host ""
        exit 1
    }
}

# 运行主流程
Main
