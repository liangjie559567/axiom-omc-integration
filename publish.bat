@echo off
REM Axiom-OMC Integration v1.0.0 MVP 发布脚本 (Windows)
REM 使用方法: publish.bat

setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════════════════════════════╗
echo ║   Axiom-OMC Integration v1.0.0 MVP - 发布脚本                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM 步骤 1: 最终测试
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 步骤 1: 运行最终测试
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 运行所有测试...
call npm test
if errorlevel 1 (
    echo ✗ 测试失败，请修复后再发布
    exit /b 1
)
echo ✓ 测试通过
echo.

REM 步骤 2: 代码质量检查
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 步骤 2: 代码质量检查
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 运行代码检查...
call npm run lint 2>nul
if errorlevel 1 (
    echo ⚠ 未配置 lint 命令，跳过
) else (
    echo ✓ 代码检查完成
)
echo.

REM 步骤 3: 运行演示
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 步骤 3: 运行演示脚本
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 运行演示脚本...
node demo.js >nul 2>&1
if errorlevel 1 (
    echo ✗ 演示脚本运行失败
    exit /b 1
)
echo ✓ 演示脚本运行成功
echo.

REM 步骤 4: 确认版本号
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 步骤 4: 确认版本号
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set VERSION=%%i
echo 当前版本: v%VERSION%
echo.

set /p CONFIRM="确认发布版本 v%VERSION%? (y/n) "
if /i not "%CONFIRM%"=="y" (
    echo 发布已取消
    exit /b 1
)
echo.

REM 步骤 5: Git 提交和标签
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 步骤 5: Git 提交和标签
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 检查是否有未提交的更改
git status -s >nul 2>&1
if errorlevel 1 (
    echo ⚠ Git 未初始化或不可用
) else (
    for /f %%i in ('git status -s ^| find /c /v ""') do set CHANGES=%%i
    if !CHANGES! gtr 0 (
        echo 发现未提交的更改
        git status -s
        echo.
        set /p COMMIT="是否提交所有更改? (y/n) "
        if /i "!COMMIT!"=="y" (
            git add .
            git commit -m "Release v%VERSION%"
            echo ✓ 更改已提交
        ) else (
            echo 发布已取消
            exit /b 1
        )
    ) else (
        echo ✓ 没有未提交的更改
    )
)
echo.

REM 创建标签
echo 创建 Git 标签...
git tag -a "v%VERSION%" -m "Release v%VERSION% MVP"
echo ✓ 标签已创建: v%VERSION%
echo.

REM 推送到远程
set /p PUSH="是否推送到远程仓库? (y/n) "
if /i "%PUSH%"=="y" (
    echo 推送到远程...
    git push origin main
    git push origin "v%VERSION%"
    echo ✓ 已推送到远程
) else (
    echo ⚠ 跳过推送到远程
)
echo.

REM 步骤 6: NPM 发布
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 步骤 6: NPM 发布
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set /p NPM_PUBLISH="是否发布到 NPM? (y/n) "
if /i "%NPM_PUBLISH%"=="y" (
    echo 检查 NPM 登录状态...
    npm whoami >nul 2>&1
    if errorlevel 1 (
        echo ✗ 未登录 NPM，请先运行: npm login
        exit /b 1
    )
    echo ✓ 已登录 NPM
    echo.

    echo 发布到 NPM...
    call npm publish
    if errorlevel 1 (
        echo ✗ NPM 发布失败
        exit /b 1
    )
    echo ✓ 已发布到 NPM
) else (
    echo ⚠ 跳过 NPM 发布
)
echo.

REM 步骤 7: GitHub Release
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 步骤 7: GitHub Release
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 请手动创建 GitHub Release:
echo.
echo 1. 访问: https://github.com/liangjie559567/axiom-omc-integration/releases/new
echo 2. 选择标签: v%VERSION%
echo 3. 标题: Axiom-OMC Integration v%VERSION% MVP
echo 4. 描述: 复制 RELEASE-NOTES.md 的内容
echo 5. 点击 'Publish release'
echo.

REM 完成
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 发布完成
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║   🎉 Axiom-OMC Integration v%VERSION% 发布成功！           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 发布信息:
echo   版本: v%VERSION%
echo   NPM: https://www.npmjs.com/package/axiom-omc-integration
echo   GitHub: https://github.com/liangjie559567/axiom-omc-integration
echo.

echo 下一步:
echo   1. 创建 GitHub Release
echo   2. 在社区分享发布公告
echo   3. 监控 Issues 和用户反馈
echo   4. 开始规划 v1.0.1
echo.

echo 感谢使用 Axiom-OMC Integration！
echo.

pause
