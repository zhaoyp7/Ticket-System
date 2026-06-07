// SPA 路由和页面管理

let currentPage = "";

// 路由映射：延迟查找，因为部分 render 函数在后续脚本中定义
function getRoute(page) {
  const map = {
    home: renderHome,
    login: typeof renderLogin !== "undefined" ? renderLogin : null,
    register: typeof renderRegister !== "undefined" ? renderRegister : null,
    profile: typeof renderProfile !== "undefined" ? renderProfile : null,
    modify_profile: typeof renderModifyProfile !== "undefined" ? renderModifyProfile : null,
    tickets: typeof renderQueryTickets !== "undefined" ? renderQueryTickets : null,
    transfer: typeof renderQueryTransfer !== "undefined" ? renderQueryTransfer : null,
    buy_ticket: typeof renderBuyTicket !== "undefined" ? renderBuyTicket : null,
    orders: typeof renderOrders !== "undefined" ? renderOrders : null,
    admin_train: typeof renderAddTrain !== "undefined" ? renderAddTrain : null,
    admin_release: typeof renderReleaseTrain !== "undefined" ? renderReleaseTrain : null,
    admin_delete: typeof renderDeleteTrain !== "undefined" ? renderDeleteTrain : null,
    admin_query: typeof renderQueryTrain !== "undefined" ? renderQueryTrain : null,
    admin_clean: typeof renderClean !== "undefined" ? renderClean : null,
  };
  return map[page] || null;
}

function navigate(page, params) {
  currentPage = page;
  window._pageParams = params || {};
  try { renderNav(); } catch(e) {}
  const fn = getRoute(page);
  if (fn) {
    document.getElementById("app").innerHTML = fn();
    setTimeout(() => {
      const ev = new CustomEvent("page:" + page, { detail: params });
      window.dispatchEvent(ev);
    }, 0);
  }
}

function renderNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;

  const loggedIn = session.isLoggedIn();
  const admin = session.isAdmin();

  let html = '<a href="#" onclick="navigate(\'home\')">首页</a>';
  if (!loggedIn) {
    html += '<a href="#" onclick="navigate(\'login\')">登录</a>';
    html += '<a href="#" onclick="navigate(\'register\')">注册</a>';
  } else {
    html += '<a href="#" onclick="navigate(\'profile\')">个人中心</a>';
    html += '<a href="#" onclick="navigate(\'modify_profile\')">修改信息</a>';
    html += '<a href="#" onclick="navigate(\'tickets\')">查询车票</a>';
    html += '<a href="#" onclick="navigate(\'transfer\')">换乘查询</a>';
    html += '<a href="#" onclick="navigate(\'buy_ticket\')">购票</a>';
    html += '<a href="#" onclick="navigate(\'orders\')">我的订单</a>';
    html += '<a href="#" onclick="navigate(\'register\')">注册用户</a>';
    if (admin) {
      html += '<span class="nav-sep">|</span>';
      html += '<a href="#" onclick="navigate(\'admin_train\')">新增车次</a>';
      html += '<a href="#" onclick="navigate(\'admin_release\')">发布车次</a>';
      html += '<a href="#" onclick="navigate(\'admin_delete\')">删除车次</a>';
      html += '<a href="#" onclick="navigate(\'admin_query\')">查询车次</a>';
      html += '<a href="#" onclick="navigate(\'admin_clean\')">清空系统</a>';
    }
    html += `<span class="nav-user">${session.username()}</span>`;
    html += '<a href="#" onclick="doLogout()">退出</a>';
  }
  nav.innerHTML = html;
}

async function doLogout() {
  if (session.isLoggedIn()) {
    await api.logout({ username: session.username() });
  }
  session.clear();
  navigate("login");
}

function renderHome() {
  const u = session.get();
  if (!u) {
    return `<h2>火车票管理系统</h2>
<div class="card">欢迎使用！请先<a href="#" onclick="navigate('login')">登录</a>或<a href="#" onclick="navigate('register')">注册</a>。</div>`;
  }
  const adminHtml = session.isAdmin()
    ? `<h3>管理功能</h3>
<div class="row">
  <div class="col"><button onclick="navigate('admin_train')">新增车次</button></div>
  <div class="col"><button onclick="navigate('admin_release')">发布车次</button></div>
  <div class="col"><button onclick="navigate('admin_delete')">删除车次</button></div>
  <div class="col"><button onclick="navigate('admin_query')">查询车次</button></div>
  <div class="col"><button onclick="navigate('admin_clean')">清空系统</button></div>
</div>`
    : "";
  return `<h2>欢迎, ${u.username}</h2>
<div class="card">
  <p>姓名：${u.name || "-"} | 邮箱：${u.mailAddr || "-"} | 权限：${u.privilege}</p>
</div>
<h3>常用功能</h3>
<div class="row">
  <div class="col"><button onclick="navigate('tickets')">查询车票</button></div>
  <div class="col"><button onclick="navigate('transfer')">换乘查询</button></div>
  <div class="col"><button onclick="navigate('orders')">我的订单</button></div>
</div>
${adminHtml}`;
}
