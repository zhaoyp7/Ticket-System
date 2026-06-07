# 火车票管理系统

[![C++](https://img.shields.io/badge/C++-20-blue)](https://en.cppreference.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)

一个基于 **C++ 高性能数据引擎** + **Node.js Web 服务** 的火车票管理系统，支持用户管理、车次管理、车票查询、购票退票、候补队列等完整功能。

---

## 架构

```
浏览器 (多用户)  ──→  Node.js / Express   ──→  C++ 数据引擎
                     端口 3000                   stdin/stdout IPC
                     静态文件 + REST API          B+ 树 / LRU 缓存
                                                 二进制持久化存储
```

- **前端**：原生 HTML/CSS/JS 单页应用，零依赖
- **Web 层**：Express 托管静态文件并提供 REST API
- **数据层**：独立 C++ 进程，基于自实现 B+ 树和 LRU 缓存，数据即时写入磁盘

---

## 功能

| 模块 | 功能 |
|------|------|
| 用户管理 | 注册、登录、注销、查询/修改个人信息 |
| 权限系统 | 多级权限（0-10），管理员可创建下级用户 |
| 车次管理 | 新增、发布、删除、查询车次 |
| 车票查询 | 按起止站和日期查询，支持按时间/价格排序 |
| 换乘查询 | 自动计算两程换乘方案 |
| 购票 | 区间票价自动计算、确认下单 |
| 订单 | 查看订单列表、退票退款 |
| 候补 | 余票不足时自动加入候补队列，有票自动补上 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vanilla JS (SPA)，依赖项 0 |
| 后端 | Node.js + Express + CORS |
| 数据引擎 | C++20，自实现 B+ 树、LRU 缓存、红黑树 |
| 存储 | 二进制文件（`database/` 目录） |
| 进程通信 | stdin/stdout 管道 |

---

## 快速开始

### 环境要求

- Node.js ≥ 18.0
- GCC / G++ ≥ 11.0
- CMake ≥ 3.22

### 安装与启动

```bash
# 克隆项目
git clone https://github.com/zhaoyp7/Ticket-System && cd Ticket-System

# 安装 Node.js 依赖
cd backend && npm install

# 编译 C++ 数据引擎
cd ../cpp && mkdir -p build && cd build
cmake .. && make -j$(nproc)

# 创建数据库目录
cd ../.. && mkdir -p database

# 启动服务
cd backend && node server.js
```

浏览器访问 `http://localhost:3000`，首次使用直接注册管理员账号。

> 详细安装与运维指南请参阅 [docs/INSTALL.md](docs/INSTALL.md)

---

## 运维

```bash
# 查看状态
lsof -ti:3000

# 优雅关闭
kill $(lsof -ti:3000)

# 在线重启后端（数据不丢失）
curl -X POST http://localhost:3000/api/restart

# 清空数据
rm -f database/*
```

---

## 项目结构

```
Ticket-System/
├── docs/INSTALL.md        # 安装运维手册
├── frontend/              # 前端 SPA
│   ├── index.html
│   ├── css/style.css
│   └── js/                # api, auth, ticket, order, admin...
├── backend/               # Node.js 服务器
│   ├── server.js          # REST API 路由
│   ├── ticketSystem.js    # C++ 进程管理
│   └── package.json
├── cpp/                   # C++ 数据引擎
│   ├── main.cpp
│   ├── CMakeLists.txt
│   └── src/               # B+ 树、用户、车次、票务
└── database/              # 数据文件（运行时生成）
```

---

## License

MIT
