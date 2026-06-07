// 订单管理页面

function renderOrders() {
  const u = session.get();
  if (!u) return '<h2>我的订单</h2><div class="card"><p class="error">请先登录</p></div>';

  return `<h2>我的订单</h2>
<div class="card" id="orders_list">
  <p>加载中...</p>
</div>`;
}

window.addEventListener("page:orders", loadOrders);

async function loadOrders() {
  const u = session.get();
  if (!u) return;
  const div = document.getElementById("orders_list");
  if (!div) return;

  div.innerHTML = '<p>加载中...</p>';
  const res = await api.getOrders(u.username);
  if (!res.success) { div.innerHTML = `<p class="error">${res.error}</p>`; return; }

  const d = res.data;
  if (d.count === 0) { div.innerHTML = '<p>暂无订单</p>'; return; }

  let html = `<p>共 ${d.count} 个订单</p><table>
    <tr><th>#</th><th>状态</th><th>车次</th><th>出发站</th><th>出发时间</th><th>到达站</th><th>到达时间</th><th>单价</th><th>数量</th><th>操作</th></tr>`;
  d.orders.forEach((o, i) => {
    const statusLabel = o.status === "success" ? "已购" : o.status === "pending" ? "候补" : "已退";
    const statusClass = o.status === "success" ? "success" : o.status === "pending" ? "warn" : "muted";
    const refundBtn = (o.status === "success" || o.status === "pending")
      ? `<button class="btn-sm btn-danger" onclick="doRefund(${i + 1})">退票</button>` : "-";
    html += `<tr>
      <td>${i + 1}</td>
      <td class="${statusClass}">${statusLabel}</td>
      <td>${escHtml(o.trainID)}</td><td>${escHtml(o.from)}</td><td>${o.leavingTime}</td>
      <td>${escHtml(o.to)}</td><td>${o.arrivingTime}</td><td>${o.price}</td><td>${o.count}</td>
      <td>${refundBtn}</td>
    </tr>`;
  });
  html += "</table>";
  div.innerHTML = html;
}

async function doRefund(n) {
  const u = session.get();
  if (!u) return;
  if (!confirm(`确认退订第 ${n} 个订单？`)) return;

  const res = await api.refundTicket(n, u.username);
  if (res.success) {
    alert("退票成功");
    loadOrders();
  } else {
    alert(res.error || "退票失败");
  }
}
