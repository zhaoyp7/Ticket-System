# 火车票管理系统 — 安装与运维手册

---

## 目录

- [1. 系统概述](#1-系统概述)
- [2. 环境要求](#2-环境要求)
- [3. 项目结构](#3-项目结构)
- [4. 首次安装](#4-首次安装)
- [5. 启动服务](#5-启动服务)
- [6. 访问系统](#6-访问系统)
- [7. 运维操作](#7-运维操作)
- [8. 常见问题](#8-常见问题)

---

## 1. 系统概述

本系统采用 **前后端分离 + 数据服务独立进程** 架构：

```
浏览器 (多用户)  →  Node.js (Express)  →  C++ 数据引擎 (stdin/stdout IPC)
                     Web 前端服务器          后端数据服务（独立进程）
```

- **前端**：纯静态 HTML/CSS/JS，由 Express 托管
- **Web 服务器**：Node.js + Express，处理 REST API 请求，启动/管理 C++ 后端进程
- **后端数据引擎**：独立的 C++ 进程，通过 B+ 树持久化数据，自带 LRU 缓存
- **数据存储**：二进制文件，统一存放在 `database/` 目录

### 关键特性

| 特性 | 说明 |
|------|------|
| 多用户并发 | Express 原生支持多并发连接，C++ 串行处理保证数据一致性 |
| 数据持久化 | 关键操作即时写入磁盘，进程崩溃不丢数据 |
| 崩溃恢复 | C++ 进程异常退出后自动重启，数据从磁盘完整恢复 |
| 优雅重启 | 支持 `POST /api/restart` 在线重启后端数据服务，不丢数据 |
| 优雅关闭 | SIGTERM/SIGINT 信号触发数据保存后退出 |

---

## 2. 环境要求

### 硬件
- 内存：≥ 512 MB
- 磁盘：≥ 100 MB 可用空间

### 软件

| 软件 | 最低版本 | 用途 |
|------|---------|------|
| **Node.js** | ≥ 18.0 | 运行 Web 服务器 |
| **npm** | ≥ 9.0 | 安装 Node.js 依赖 |
| **GCC / G++** | ≥ 11.0 | 编译 C++ 后端 |
| **CMake** | ≥ 3.22 | C++ 构建系统 |
| **GNU Make** | ≥ 4.0 | 编译工具 |

### 验证环境
```bash
node --version    # 应 ≥ v18.0
npm --version     # 应 ≥ 9.0
g++ --version     # 应 ≥ 11.0
cmake --version   # 应 ≥ 3.22
make --version    # 应 ≥ 4.0
```

---

## 3. 项目结构

```
Ticket-System/
├── docs/
│   └── INSTALL.md          # 本手册
├── frontend/               # 前端（纯静态）
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js          # API 调用封装 + Session 管理
│       ├── app.js          # 路由 / 导航 / 首页
│       ├── auth.js         # 登录 / 注册
│       ├── profile.js      # 个人信息
│       ├── ticket.js       # 查票 / 换乘 / 购票
│       ├── order.js        # 订单管理
│       └── admin.js        # 管理功能
├── backend/                # Node.js Web 服务器
│   ├── package.json
│   ├── server.js           # Express REST API（路由定义）
│   └── ticketSystem.js     # C++ 进程管理 / IPC 通信
├── cpp/                    # C++ 数据引擎
│   ├── CMakeLists.txt
│   ├── main.cpp            # 入口 / 命令分发
│   ├── build/              # 编译输出（自动生成）
│   │   └── code            # 可执行文件
│   └── src/
│       ├── User.hpp        # 用户管理
│       ├── Train.hpp       # 车次管理
│       ├── Ticket.hpp      # 票务 / 订单
│       ├── BPT.hpp         # B+ 树 + LRU 缓存
│       ├── MemoryRiver.hpp # 二进制文件读写
│       └── ...             # 工具类
└── database/               # 数据文件目录（运行时生成）
    ├── UserData            # 用户数据
    ├── UserDataPos         # 用户索引
    ├── TrainData           # 车次数据
    ├── TrainDataPos        # 车次索引
    ├── TicketData          # 订单数据
    ├── TicketDataPos       # 订单索引
    ├── RoutePos            # 路线索引
    ├── StationPos          # 站点索引
    └── QueuePos            # 候补队列索引
```

---

## 4. 首次安装

### 4.1 克隆项目
```bash
git clone https://github.com/zhaoyp7/Ticket-System
cd Ticket-System
```
> 所有后续命令均在项目根目录 `Ticket-System/` 下执行。

### 4.2 安装 Node.js 依赖
```bash
cd backend
npm install express cors
```
> 仅需 `express` 和 `cors` 两个依赖包。

### 4.3 编译 C++ 数据引擎
```bash
cd ../cpp
mkdir -p build && cd build
cmake ..
make -j$(nproc)
```
> 编译产物为 `cpp/build/code`。

### 4.4 创建数据库目录
```bash
cd ../..
mkdir -p database
```
> 返回项目根目录后创建，数据文件在首次启动时自动生成。

---

## 5. 启动服务

### 前台启动（开发调试）
```bash
cd backend
node server.js
```
> 终端显示日志，`Ctrl+C` 优雅退出。

### 后台启动（生产环境）
```bash
cd backend
nohup node server.js > /tmp/ticket-server.log 2>&1 &
```
> 日志输出到 `/tmp/ticket-server.log`。

### 验证服务运行
```bash
curl http://localhost:3000/
```
> 返回前端 HTML 页面即为正常。

---

## 6. 访问系统

| 访问方式 | 地址 |
|---------|------|
| 本机浏览器 | `http://localhost:3000` |
| 局域网其他电脑 | `http://<服务器IP>:3000` |

### 首次使用
1. 打开浏览器访问系统地址
2. 点击 **注册**，填写信息创建管理员账号
   - 系统第一个注册的用户自动成为管理员（权限等级 10）
3. 注册成功后自动登录，进入首页

### 后续注册
- 管理员登录后，导航栏会出现 **注册用户** 按钮
- 管理员可为其他人创建账号（权限等级必须低于自身）
- 非管理员用户只能创建权限为 0 的普通用户

---

## 7. 运维操作

### 7.1 查看服务状态
```bash
lsof -ti:3000    # 查看进程 PID
ps aux | grep "node server.js"
```

### 7.2 重启后端数据服务（在线，数据不丢失）
```bash
curl -X POST http://localhost:3000/api/restart
```
> 仅重启 C++ 数据引擎，Web 服务器不中断。数据自动保存并从磁盘恢复。

### 7.3 优雅关闭
```bash
# 方式一：发送 SIGTERM
kill $(lsof -ti:3000)

# 方式二：前台运行时按 Ctrl+C
```
> 系统会：关闭 HTTP 连接 → 保存 C++ 数据 → 退出。最长等待 10 秒。

### 7.4 强制关闭
```bash
kill -9 $(lsof -ti:3000)
```
> 不保证数据完整性，仅紧急情况下使用。

### 7.5 清空所有数据
```bash
# 关闭服务后
rm -f database/*
```
> 重启服务后系统恢复为初始状态。

### 7.6 更新 C++ 后端代码
```bash
cd Ticket-System/cpp/build
make -j$(nproc)                                     # 重新编译
curl -X POST http://localhost:3000/api/restart      # 在线重启加载新代码
```

### 7.7 部署到其他服务器
```bash
# 1. 拷贝整个项目目录到目标服务器
scp -r Ticket-System user@target-host:/path/to/

# 2. 在目标服务器上执行
cd /path/to/Ticket-System
cd backend && npm install
cd ../cpp && mkdir -p build && cd build && cmake .. && make -j$(nproc)
cd ../.. && mkdir -p database

# 3. 启动服务
cd backend && nohup node server.js > /tmp/ticket-server.log 2>&1 &
```

---

## 8. 常见问题

### Q: 启动时报 `EADDRINUSE` 端口被占用？
```bash
kill -9 $(lsof -ti:3000)
```

### Q: 注册后无法创建新用户？
- 首次注册的用户自动成为管理员，会自动登录
- 登录后导航栏出现 **注册用户** 按钮，点击即可创建新用户
- 如果仍失败，确认当前用户已登录且权限足够

### Q: 注册时页面一直显示"注册中"？
- 检查 C++ 进程是否正常运行：`lsof -ti:3000` 查看是否有进程
- 查看日志：`cat /tmp/ticket-server.log`
- 尝试重启：`curl -X POST http://localhost:3000/api/restart`

### Q: 数据保存在哪里？
- 所有数据文件位于项目根目录的 `database/` 文件夹
- 删除该文件夹即清空所有数据

### Q: 多台电脑能否同时使用？
- 可以。多台电脑同时访问 `http://<服务器IP>:3000` 即可
- 不同用户的 Session 相互独立，不会干扰

### Q: C++ 进程崩溃了怎么办？
- C++ 进程异常退出后 **自动重启**，数据从磁盘恢复
- 正在处理的请求可能返回错误，刷新页面重试即可
