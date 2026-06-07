/*
启动TicketSystem C++ 进程
发送命令，接收结果
支持进程崩溃后自动重启
*/

const { spawn } = require("child_process");
const path = require("path");

const BINARY_PATH = path.join(__dirname, "..", "cpp", "build", "code");
const CMD_TIMEOUT = 15000;

let ts = null;
let buffer = "";
let waiting = [];
let timestamp = 0;
let shuttingDown = false;

function startProcess() {
  shuttingDown = false;
  if (ts) {
    try { ts.kill(); } catch (e) { /* ignore */ }
  }
  ts = spawn(BINARY_PATH, [], {
    stdio: ["pipe", "pipe", "pipe"],
    detached: false,
  });

  buffer = "";
  while (waiting.length) {
    const w = waiting.shift();
    if (w && w.reject) w.reject(new Error("Process restarted"));
  }

  ts.stdout.on("data", (data) => {
    buffer += data.toString();
    while (buffer.includes("<END>")) {
      const idx = buffer.indexOf("<END>");
      const result = buffer.substring(0, idx).trim();
      buffer = buffer.substring(idx + 5);
      const w = waiting.shift();
      if (w && w.resolve) w.resolve(result);
    }
  });

  ts.stderr.on("data", (data) => {
    console.error("[C++ stderr]", data.toString().trim());
  });

  ts.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[C++] exited code=${code} signal=${signal}, restarting...`);
    startProcess();
  });

  ts.on("error", (err) => {
    console.error("[C++] spawn error:", err.message);
    if (!shuttingDown) {
      setTimeout(startProcess, 1000);
    }
  });

  console.log("[C++] started, pid:", ts.pid);
}

startProcess();

function execute(command) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Command timeout: ${command}`));
    }, CMD_TIMEOUT);

    const wrapped = {
      resolve: (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    };

    waiting.push(wrapped);
    const fullCmd = `[${++timestamp}] ${command}`;
    try {
      ts.stdin.write(fullCmd + "\n");
    } catch (e) {
      clearTimeout(timer);
      reject(new Error("C++ process not available: " + e.message));
    }
  });
}

async function shutdown() {
  shuttingDown = true;
  try {
    await execute("exit");
  } catch (e) {
    // 可能进程已死
  }
  try { ts.kill(); } catch (e) { /* ignore */ }
  ts = null;
}

module.exports = { execute, shutdown };
