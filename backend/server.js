const express = require("express");
const cors = require("cors");
const path = require("path");
const ts = require("./ticketSystem");

const app = express();
app.use(cors());
app.use(express.json());

// 托管前端静态文件
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

function stripTs(output) {
  if (!output) return "";
  const idx = output.indexOf("] ");
  return idx >= 0 ? output.substring(idx + 2).trim() : output.trim();
}

function parseSimple(output) {
  const s = stripTs(output);
  if (s === "0" || s === "bye") return { success: true };
  if (s === "-1") return { success: false, error: "操作失败" };
  return { success: true, data: s };
}

// ==================== 用户相关 ====================

app.post("/api/register", async (req, res) => {
  try {
    const { curUser, username, password, name, mail, privilege } = req.body;
    if (!username || !password || !name || !mail) {
      return res.json({ success: false, error: "缺少必填字段（用户名、密码、姓名、邮箱）" });
    }
    let cmd;
    if (curUser) {
      const priv = privilege != null ? privilege : 1;
      cmd = `add_user -c ${curUser} -u ${username} -p ${password} -n ${name} -m ${mail} -g ${priv}`;
    } else {
      cmd = `add_user -c _ -u ${username} -p ${password} -n ${name} -m ${mail} -g 0`;
    }
    const result = await ts.execute(cmd);
    const s = stripTs(result);
    if (s === "-1") {
      if (!curUser) {
        return res.json({ success: false, error: "注册失败：系统已有用户时需由已登录用户创建新账号，请先登录" });
      }
      return res.json({ success: false, error: "注册失败：用户名可能已存在，或当前用户权限不足" });
    }
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await ts.execute(`login -u ${username} -p ${password}`);
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/logout", async (req, res) => {
  try {
    const { username } = req.body;
    const result = await ts.execute(`logout -u ${username}`);
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== 个人信息 ====================

app.get("/api/profile", async (req, res) => {
  try {
    const { curUser, username } = req.query;
    const result = await ts.execute(`query_profile -c ${curUser} -u ${username}`);
    const s = stripTs(result);
    if (s === "-1") return res.json({ success: false, error: "查询失败" });
    const parts = s.split(" ");
    res.json({
      success: true,
      data: {
        username: parts[0],
        name: parts[1],
        mailAddr: parts[2],
        privilege: parseInt(parts[3])
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put("/api/profile", async (req, res) => {
  try {
    const { curUser, username, password, name, mail, privilege } = req.body;
    let cmd = `modify_profile -c ${curUser} -u ${username}`;
    if (password) cmd += ` -p ${password}`;
    if (name) cmd += ` -n ${name}`;
    if (mail) cmd += ` -m ${mail}`;
    if (privilege != null) cmd += ` -g ${privilege}`;
    const result = await ts.execute(cmd);
    const s = stripTs(result);
    if (s === "-1") return res.json({ success: false, error: "修改失败" });
    const parts = s.split(" ");
    res.json({
      success: true,
      data: {
        username: parts[0],
        name: parts[1],
        mailAddr: parts[2],
        privilege: parseInt(parts[3])
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== 车次管理（管理员） ====================

app.post("/api/train", async (req, res) => {
  try {
    const { trainID, stationNum, seatNum, stations, prices, startTime,
            travelTimes, stopoverTimes, saleDate, type } = req.body;
    const cmd = `add_train -i ${trainID} -n ${stationNum} -m ${seatNum} ` +
                `-s ${stations} -p ${prices} -x ${startTime} -t ${travelTimes} ` +
                `-o ${stopoverTimes} -d ${saleDate} -y ${type}`;
    const result = await ts.execute(cmd);
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete("/api/train/:id", async (req, res) => {
  try {
    const result = await ts.execute(`delete_train -i ${req.params.id}`);
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/train/:id/release", async (req, res) => {
  try {
    const result = await ts.execute(`release_train -i ${req.params.id}`);
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/train/:id", async (req, res) => {
  try {
    const { date } = req.query;
    const result = await ts.execute(`query_train -i ${req.params.id} -d ${date}`);
    const s = stripTs(result);
    if (s === "-1") return res.json({ success: false, error: "查询失败" });

    const lines = s.split("\n").filter(l => l.trim());
    if (lines.length < 2) return res.json({ success: false, error: "数据异常" });

    const header = lines[0].split(" ");
    const stations = [];
    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(/^(.+?) (.+?) -> (.+?) (\d+|x) (\d+|x)$/);
      if (m) {
        stations.push({
          station: m[1],
          arrivingTime: m[2],
          leavingTime: m[3],
          price: m[4] === "x" ? null : parseInt(m[4]),
          seat: m[5] === "x" ? null : parseInt(m[5])
        });
      }
    }
    res.json({ success: true, data: { trainID: header[0], type: header[1], stations } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== 查询车票 / 换乘 ====================

app.get("/api/tickets", async (req, res) => {
  try {
    const { s, t, d, p } = req.query;
    const sortKey = p === "cost" ? "cost" : "time";
    const result = await ts.execute(`query_ticket -s ${s} -t ${t} -d ${d} -p ${sortKey}`);
    const output = stripTs(result);

    if (output === "-1") return res.json({ success: false, error: "查询失败" });

    const lines = output.split("\n").filter(l => l.trim());
    const count = parseInt(lines[0]);
    const tickets = [];
    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(/^(.+?) (.+?) (.+?) -> (.+?) (.+?) (\d+) (\d+)$/);
      if (m) {
        tickets.push({
          trainID: m[1],
          from: m[2],
          leavingTime: m[3],
          to: m[4],
          arrivingTime: m[5],
          price: parseInt(m[6]),
          seat: parseInt(m[7])
        });
      }
    }
    res.json({ success: true, data: { count, tickets } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/transfer", async (req, res) => {
  try {
    const { s, t, d, p } = req.query;
    const sortKey = p === "cost" ? "cost" : "time";
    const result = await ts.execute(`query_transfer -s ${s} -t ${t} -d ${d} -p ${sortKey}`);
    const output = stripTs(result);

    if (output === "0") return res.json({ success: true, data: null });

    const lines = output.split("\n").filter(l => l.trim());
    if (lines.length < 2) return res.json({ success: false, error: "数据异常" });

    const parseTicket = (line) => {
      const m = line.match(/^(.+?) (.+?) (.+?) -> (.+?) (.+?) (\d+) (\d+)$/);
      return m ? { trainID: m[1], from: m[2], leavingTime: m[3], to: m[4], arrivingTime: m[5], price: parseInt(m[6]), seat: parseInt(m[7]) } : null;
    };

    res.json({
      success: true,
      data: {
        first: parseTicket(lines[0]),
        second: parseTicket(lines[1])
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== 购票 / 订单 ====================

app.post("/api/orders", async (req, res) => {
  try {
    const { username, trainID, date, from, to, count, queue } = req.body;
    let cmd = `buy_ticket -u ${username} -i ${trainID} -d ${date} -n ${count} -f ${from} -t ${to}`;
    if (queue) cmd += " -q true";
    const result = await ts.execute(cmd);
    const s = stripTs(result);
    if (s === "-1") return res.json({ success: false, error: "购票失败" });
    if (s === "queue") return res.json({ success: true, data: { status: "pending" } });
    const price = parseInt(s);
    if (isNaN(price)) return res.json({ success: false, error: "返回值异常" });
    res.json({ success: true, data: { status: "success", totalPrice: price } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const { username } = req.query;
    const result = await ts.execute(`query_order -u ${username}`);
    const output = stripTs(result);
    if (output === "-1") return res.json({ success: false, error: "查询失败" });

    const lines = output.split("\n").filter(l => l.trim());
    const count = parseInt(lines[0]);
    const orders = [];
    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(/^\[(.+?)\] (.+?) (.+?) (.+?) -> (.+?) (.+?) (\d+) (\d+)$/);
      if (m) {
        orders.push({
          status: m[1],
          trainID: m[2],
          from: m[3],
          leavingTime: m[4],
          to: m[5],
          arrivingTime: m[6],
          price: parseInt(m[7]),
          count: parseInt(m[8])
        });
      }
    }
    res.json({ success: true, data: { count, orders } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete("/api/orders/:n", async (req, res) => {
  try {
    const { username } = req.body;
    const n = parseInt(req.params.n);
    const result = await ts.execute(`refund_ticket -u ${username} -n ${n}`);
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== 系统操作 ====================

app.post("/api/clean", async (req, res) => {
  try {
    const result = await ts.execute("clean");
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/exit", async (req, res) => {
  try {
    const result = await ts.execute("exit");
    res.json(parseSimple(result));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/restart", async (req, res) => {
  try {
    await ts.execute("exit");
    res.json({ success: true, message: "后端数据服务已重启" });
  } catch (e) {
    res.json({ success: true, message: "后端数据服务已重启" });
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`[Server] running on http://localhost:${PORT}`);
});

function gracefulShutdown(signal) {
  console.log(`[Server] received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log("[Server] HTTP server closed");
    ts.shutdown().then(() => {
      console.log("[Server] C++ process terminated");
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error("[Server] forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
