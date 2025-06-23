import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

/**
 * 从 xmake check -v 输出解析 diagnostics
 */
function parseDiagnostics(output: string, collection: vscode.DiagnosticCollection, workspaceFolder: vscode.WorkspaceFolder) {
  // 清空旧的诊断
  collection.clear();

  // 过滤 ANSI 颜色码
  const ansiRegex = /\u001B\[[0-9;]*[A-Za-z]/g;
  const cleaned = output.replace(ansiRegex, '');

  const lines = cleaned.split(/\r?\n/);
  const errorRegex = /error:\s+(.+):(\d+):\s+(.*)/i;

  for (const line of lines) {
    const match = errorRegex.exec(line);
    if (!match) {
      continue;
    }

    const [_, filePathRaw, lineStr, message] = match;
    const absPath = path.isAbsolute(filePathRaw)
      ? filePathRaw
      : path.join(workspaceFolder.uri.fsPath, filePathRaw.replace(/^[.\\/]+/, ''));

    const fileUri = vscode.Uri.file(absPath);
    const lineNum = parseInt(lineStr, 10) - 1; // VS Code 行号从 0 开始
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(new vscode.Position(lineNum, 0), new vscode.Position(lineNum, Number.MAX_SAFE_INTEGER)),
      message,
      vscode.DiagnosticSeverity.Error
    );
    collection.set(fileUri, [diagnostic]);
  }
}

/**
 * 运行 `xmake check -v` 并收集诊断
 */
function runXmakeCheck(collection: vscode.DiagnosticCollection) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return;
  }

  const cwd = workspaceFolder.uri.fsPath;
  const command = 'xmake check -v';

  exec(command, { cwd }, (error, stdout, stderr) => {
    if (error && (error as any).code !== 0) {
      // xmake 返回非零退出码时仍然有 stdout/stderr，我们全部合并处理
    }
    const combinedOutput = stdout + '\n' + stderr;
    parseDiagnostics(combinedOutput, collection, workspaceFolder);
  });
}

export function activate(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection('xmake');
  context.subscriptions.push(collection);

  // 激活后立即运行一次 lint
  runXmakeCheck(collection);

  // 监听文件保存事件
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      runXmakeCheck(collection);
    })
  );

  // 注册手动命令
  const disposable = vscode.commands.registerCommand('xmakeLinter.runLint', () => runXmakeCheck(collection));
  context.subscriptions.push(disposable);
}

export function deactivate() {
  // noop
} 