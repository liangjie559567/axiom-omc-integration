#!/bin/bash
# Axiom + OMC Integration Plugin 安装脚本
# 用于将插件安装到 Claude Code 本地插件目录

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# 获取 Claude Code 插件目录
get_plugin_dir() {
    local os=$(detect_os)

    if [[ "$os" == "linux" ]] || [[ "$os" == "macos" ]]; then
        echo "$HOME/.claude/plugins"
    elif [[ "$os" == "windows" ]]; then
        echo "$USERPROFILE/.claude/plugins"
    else
        print_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖..."

    # 检查 Python
    if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
        print_error "未找到 Python。请安装 Python 3.8+ 后重试。"
        exit 1
    fi

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_warning "未找到 Node.js。JavaScript 命令包装器将无法使用。"
        print_warning "建议安装 Node.js 14+ 以获得完整功能。"
    fi

    print_success "依赖检查完成"
}

# 创建插件目录
create_plugin_dir() {
    local plugin_dir="$1"
    local target_dir="$plugin_dir/axiom-omc-integration"

    print_info "创建插件目录: $target_dir"

    if [[ -d "$target_dir" ]]; then
        print_warning "插件目录已存在，将覆盖现有文件"
        read -p "是否继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "安装已取消"
            exit 0
        fi
    fi

    mkdir -p "$target_dir"
    print_success "插件目录创建完成"
}

# 复制插件文件
copy_plugin_files() {
    local source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local plugin_dir="$1"
    local target_dir="$plugin_dir/axiom-omc-integration"

    print_info "复制插件文件..."

    # 复制核心文件
    cp -r "$source_dir/.claude-plugin" "$target_dir/"
    cp -r "$source_dir/skills" "$target_dir/"
    cp -r "$source_dir/commands" "$target_dir/"
    cp -r "$source_dir/workflows" "$target_dir/"
    cp -r "$source_dir/config" "$target_dir/"
    cp -r "$source_dir/docs" "$target_dir/"
    cp "$source_dir/README.md" "$target_dir/"

    print_success "插件文件复制完成"
}

# 验证安装
verify_installation() {
    local plugin_dir="$1"
    local target_dir="$plugin_dir/axiom-omc-integration"

    print_info "验证安装..."

    # 检查必需文件
    local required_files=(
        ".claude-plugin/plugin.json"
        "README.md"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "$target_dir/$file" ]]; then
            print_error "缺少必需文件: $file"
            exit 1
        fi
    done

    # 检查必需目录
    local required_dirs=(
        "skills"
        "commands"
        "workflows"
        "config"
        "docs"
    )

    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$target_dir/$dir" ]]; then
            print_error "缺少必需目录: $dir"
            exit 1
        fi
    done

    print_success "安装验证完成"
}

# 显示安装后说明
show_post_install_info() {
    local plugin_dir="$1"
    local target_dir="$plugin_dir/axiom-omc-integration"

    echo ""
    print_success "=========================================="
    print_success "Axiom + OMC Integration 插件安装成功！"
    print_success "=========================================="
    echo ""
    print_info "插件位置: $target_dir"
    echo ""
    print_info "可用技能 (7 个):"
    echo "  - /axiom-omc:start          启动系统并加载上下文"
    echo "  - /axiom-omc:prd            生成产品需求文档"
    echo "  - /axiom-omc:analyze-error  分析错误并查询已知问题"
    echo "  - /axiom-omc:evolve         触发知识进化"
    echo "  - /axiom-omc:reflect        生成反思报告"
    echo "  - /axiom-omc:patterns       查看代码模式库"
    echo "  - /axiom-omc:knowledge      查询知识库"
    echo ""
    print_info "使用方法:"
    echo "  1. 重启 Claude Code 以加载插件"
    echo "  2. 在项目根目录运行 /axiom-omc:start 初始化系统"
    echo "  3. 使用其他技能进行开发工作"
    echo ""
    print_info "详细文档: $target_dir/docs/"
    echo ""
}

# 主函数
main() {
    echo ""
    print_info "=========================================="
    print_info "Axiom + OMC Integration Plugin 安装程序"
    print_info "=========================================="
    echo ""

    # 检查依赖
    check_dependencies

    # 获取插件目录
    local plugin_dir=$(get_plugin_dir)
    print_info "Claude Code 插件目录: $plugin_dir"

    # 创建插件目录
    create_plugin_dir "$plugin_dir"

    # 复制插件文件
    copy_plugin_files "$plugin_dir"

    # 验证安装
    verify_installation "$plugin_dir"

    # 显示安装后说明
    show_post_install_info "$plugin_dir"
}

# 运行主函数
main "$@"
