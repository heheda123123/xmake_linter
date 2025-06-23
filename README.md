# Xmake Linter

使用 `xmake check -v` 为 VS Code 提供 **xmake** 脚本的实时语法诊断。

## 功能

* 监听文件保存，自动调用 `xmake check -v` 并在 VS Code **问题** 面板中显示错误。
* 提供命令 **Xmake: 运行 Lint** 以手动触发检查。

## 使用

1. 确保已在系统中安装 [xmake](https://xmake.io)。并且 `xmake` 可通过 `PATH` 访问。
2. 打开包含 `xmake.lua` 的工作区。
3. 每次保存文件或在命令面板执行 `Xmake: 运行 Lint`，即可看到诊断信息。

## 已知限制

* 目前仅解析形如 `error: .\\xmake.lua:4: message` 的错误行。
* 仅处理第一个 Workspace 文件夹。

欢迎提交 PR 改进！ 