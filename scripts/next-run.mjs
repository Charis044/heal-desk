#!/usr/bin/env node
/**
 * Next.js 统一启动入口。
 *
 * 问题背景：WorkBuddy 终端注入的 `NODE_OPTIONS` 含
 * `--require <shim> --use-system-ca`，会随环境变量传给 Next 的子进程
 * （如 Webpack worker），触发 `ERR_WORKER_INVALID_EXEC_ARGV` 导致构建失败。
 *
 * 本脚本在 spawn `next` 之前显式删除 `process.env.NODE_OPTIONS`，
 * 使 dev/build/start 三个命令都走同一条干净路径，不再被环境变量污染。
 */
import { spawn } from "node:child_process"

delete process.env.NODE_OPTIONS

const [cmd, ...args] = process.argv.slice(2)

if (!cmd) {
  console.error("用法：node scripts/next-run.mjs <dev|build|start> [args...]")
  process.exit(1)
}

const nextBin = process.platform === "win32" ? "next.cmd" : "next"

const child = spawn(nextBin, [cmd, ...args], {
  stdio: "inherit",
  env: process.env,
})

child.on("exit", (code, signal) => {
  if (signal) {
    // 转发信号（例如 Ctrl+C），让退出码/信号保持正确
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})

child.on("error", (err) => {
  console.error("启动 next 失败：", err)
  process.exit(1)
})
