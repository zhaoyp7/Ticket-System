// API 统一调用模块
const API_BASE = "";

async function request(method, url, data) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (data) opts.body = JSON.stringify(data);
  const resp = await fetch(API_BASE + url, opts);
  return resp.json();
}

const api = {
  // 用户
  register: (body) => request("POST", "/api/register", body),
  login: (body) => request("POST", "/api/login", body),
  logout: (body) => request("POST", "/api/logout", body),

  // 个人信息
  getProfile: (curUser, username) =>
    request("GET", `/api/profile?curUser=${encodeURIComponent(curUser)}&username=${encodeURIComponent(username)}`),
  updateProfile: (body) => request("PUT", "/api/profile", body),

  // 车次管理
  addTrain: (body) => request("POST", "/api/train", body),
  deleteTrain: (id) => request("DELETE", `/api/train/${encodeURIComponent(id)}`),
  releaseTrain: (id) => request("POST", `/api/train/${encodeURIComponent(id)}/release`),
  queryTrain: (id, date) =>
    request("GET", `/api/train/${encodeURIComponent(id)}?date=${encodeURIComponent(date)}`),

  // 查询车票
  queryTickets: (s, t, d, p) =>
    request("GET", `/api/tickets?s=${encodeURIComponent(s)}&t=${encodeURIComponent(t)}&d=${encodeURIComponent(d)}&p=${p || "time"}`),
  queryTransfer: (s, t, d, p) =>
    request("GET", `/api/transfer?s=${encodeURIComponent(s)}&t=${encodeURIComponent(t)}&d=${encodeURIComponent(d)}&p=${p || "time"}`),

  // 购票 / 订单
  buyTicket: (body) => request("POST", "/api/orders", body),
  getOrders: (username) =>
    request("GET", `/api/orders?username=${encodeURIComponent(username)}`),
  refundTicket: (n, username) =>
    request("DELETE", `/api/orders/${n}`, { username }),

  // 系统
  clean: () => request("POST", "/api/clean"),
  exit: () => request("POST", "/api/exit"),
};

// 会话管理
const session = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem("ticket_user") || "null");
    } catch { return null; }
  },
  set(user) {
    sessionStorage.setItem("ticket_user", JSON.stringify(user));
  },
  clear() {
    sessionStorage.removeItem("ticket_user");
  },
  isLoggedIn() {
    return !!this.get();
  },
  username() {
    const u = this.get();
    return u ? u.username : "";
  },
  privilege() {
    const u = this.get();
    return u ? u.privilege : -1;
  },
  isAdmin() {
    return this.privilege() > 1;
  },
};
