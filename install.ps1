# Axiom + OMC Integration Plugin 安装脚本 (Windows PowerShell)
# 用于将插件安装到 Claude Code 本地插件目录

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色定义
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 获取 Claude Code 插件目录
function Get-PluginDir {
    return "$env:USERPROFILE\.claude\plugins"
}

# 检查依赖
function Test-Dependencies {
    Write-Info "检查依赖..."

    # 检查 Python
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) {
        $pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue
    }

    if (-not $pythonCmd) {
        Write-Error "未找到 Python。请安装 Python 3.8+ 后重试。"
        exit 1
    }

    # 检查 Node.js
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Warning "未找到 Node.js。JavaScript 命令包装器将无法使用。"
        Write-Warning "建议安装 Node.js 14+ 以获得完整功能。"
    }

    Write-Success "依赖检查完成"
}

# 创建插件目录
function New-PluginDir {
    param([string]$PluginDir)

    $targetDir = Join-Path $PluginDir "axiom-omc-integration"

    Write-Info "创建插件目录: $targetDir"

    if (Test-Path $targetDir) {
        Write-Warning "插件目录已存在，将覆盖现有文件"
        $response = Read-Host "是否继续? (y/n)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Info "安装已取消"
            exit 0
        }
    }

    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Success "插件目录创建完成"

    return $targetDir
}

# 复制插件文件
function Copy-PluginFiles {
    param(
        [string]$SourceDir,
        [string]$TargetDir
    )

    Write-Info "复制插件文件..."

    # 复制核心文件和目录
    $items = @(
        ".claude-plugin",
        "skills",
        "commands",
        "workflows",
        "config",
        "docs",
        "README.md"
    )

    foreach ($item in $items) {
        $sourcePath = Join-Path $SourceDir $item
        $targetPath = Join-Path $TargetDir $item

        if (Test-Path $sourcePath) {
            Copy-Item -Path $sourcePath -Destination $targetPath -Recurse -Force
        } else {
            Write-Warning "未找到: $item"
        }
    }

    Write-Success "插件文件复制完成"
}

# 验证安装
function Test-Installation {
    param([string]$TargetDir)

    Write-Info "验证安装..."

    # 检查必需文件
    $requiredFiles = @(
        ".claude-plugin\plugin.json",
        "README.md"
    )

    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $TargetDir $file
        if (-not (Test-Path $filePath)) {
            Write-Error "缺少必需文件: $file"
            exit 1
        }
    }

    # 检查必需目录
    $requiredDirs = @(
        "skills",
        "commands",
        "workflows",
        "config",
        "docs"
    )

    foreach ($dir in $requiredDirs) {
        $dirPath = Join-Path $TargetDir $dir
        if (-not (Test-Path $dirPath)) {
            Write-Error "缺少必需目录: $dir"
            exit 1
        }
    }

    Write-Success "安装验证完成"
}

# 显示安装后说明
function Show-PostInstallInfo {
    param([string]$TargetDir)

    Write-Host ""
    Write-Success "=========================================="
    Write-Success "Axiom + OMC Integration 插件安装成功！"
    Write-Success "=========================================="
    Write-Host ""
    Write-Info "插件位置: $TargetDir"
    Write-Host ""
    Write-Info "可用技能 (7 个):"
    Write-Host "  - /axiom-omc:start          启动系统并加载上下文"
    Write-Host "  - /axiom-omc:prd            生成产品需求文档"
    Write-Host "  - /axiom-omc:analyze-error  分析错误并查询已知问题"
    Write-Host "  - /axiom-omc:evolve         触发知识进化"
    Write-Host "  - /axiom-omc:reflect        生成反思报告"
    Write-Host "  - /axiom-omc:patterns       查看代码模式库"
    Write-Host "  - /axiom-omc:knowledge      查询知识库"
    Write-Host ""
    Write-Info "使用方法:"
    Write-Host "  1. 重启 Claude Code 以加载插件"
    Write-Host "  2. 在项目根目录运行 /axiom-omc:start 初始化系统"
    Write-Host "  3. 使用其他技能进行开发工作"
    Write-Host ""
    Write-Info "详细文档: $TargetDir\docs\"
    Write-Host ""
}

# 主函数
function Main {
    Write-Host ""
    Write-Info "=========================================="
    Write-Info "Axiom + OMC Integration Plugin 安装程序"
    Write-Info "=========================================="
    Write-Host ""

    # 检查依赖
    Test-Dependencies

    # 获取插件目录
    $pluginDir = Get-PluginDir
    Write-Info "Claude Code 插件目录: $pluginDir"

    # 创建插件目录
    $targetDir = New-PluginDir -PluginDir $pluginDir

    # 获取源目录（脚本所在目录）
    $sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path

    # 复制插件文件
    Copy-PluginFiles -SourceDir $sourceDir -TargetDir $targetDir

    # 验证安装
    Test-Installation -TargetDir $targetDir

    # 显示安装后说明
    Show-PostInstallInfo -TargetDir $targetDir
}

# 运行主函数
try {
    Main
} catch {
    Write-Error "安装失败: $_"
    exit 1
}
