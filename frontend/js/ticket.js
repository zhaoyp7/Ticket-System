// 查询车票 / 换乘 / 购票 页面

// ===================== 查询车票 =====================

function renderQueryTickets() {
  const params = window._pageParams || {};
  return `<h2>查询车票</h2>
<div class="card">
  <div class="row">
    <div class="col form-group"><label>出发站</label><input id="qt_from" placeholder="出发站" value="${escHtml(params.from || "")}"></div>
    <div class="col form-group"><label>到达站</label><input id="qt_to" placeholder="到达站" value="${escHtml(params.to || "")}"></div>
  </div>
  <div class="row">
    <div class="col form-group"><label>日期</label><input id="qt_date" placeholder="mm-dd" value="${params.date || getTodayStr()}"></div>
    <div class="col form-group"><label>排序</label><select id="qt_sort">
      <option value="time">按时间</option>
      <option value="cost">按价格</option>
    </select></div>
  </div>
  <button onclick="doQueryTickets()">查询</button>
  <div id="qt_result"></div>
</div>`;
}

async function doQueryTickets() {
  const from = document.getElementById("qt_from").value.trim();
  const to = document.getElementById("qt_to").value.trim();
  const date = document.getElementById("qt_date").value.trim();
  const sort = document.getElementById("qt_sort").value;
  const div = document.getElementById("qt_result");
  if (!from || !to || !date) { div.innerHTML = '<p class="error">请填写完整</p>'; return; }

  div.innerHTML = '<p>查询中...</p>';
  const res = await api.queryTickets(from, to, date, sort);
  if (!res.success) { div.innerHTML = `<p class="error">${res.error}</p>`; return; }

  const d = res.data;
  if (d.count === 0) { div.innerHTML = '<p>没有找到符合条件车次</p>'; return; }

  let html = `<p>共 ${d.count} 个车次</p><table>
    <tr><th>车次</th><th>出发站</th><th>出发时间</th><th>到达站</th><th>到达时间</th><th>票价</th><th>余票</th><th>操作</th></tr>`;
  for (const t of d.tickets) {
    html += `<tr>
      <td>${escHtml(t.trainID)}</td><td>${escHtml(t.from)}</td><td>${t.leavingTime}</td>
      <td>${escHtml(t.to)}</td><td>${t.arrivingTime}</td><td>${t.price}</td><td>${t.seat}</td>
      <td><button class="btn-sm" data-train="${escHtml(t.trainID)}" data-from="${escHtml(t.from)}" data-to="${escHtml(t.to)}" data-date="${date}">购票</button></td>
    </tr>`;
  }
  html += "</table>";
  div.innerHTML = html;
  div.querySelectorAll("button[data-train]").forEach(btn => {
    btn.addEventListener("click", () => {
      quickBuy(btn.dataset.train, btn.dataset.from, btn.dataset.to, btn.dataset.date);
    });
  });
}

// ===================== 换乘查询 =====================

function renderQueryTransfer() {
  return `<h2>换乘查询</h2>
<div class="card">
  <div class="row">
    <div class="col form-group"><label>出发站</label><input id="qtr_from" placeholder="出发站"></div>
    <div class="col form-group"><label>到达站</label><input id="qtr_to" placeholder="到达站"></div>
  </div>
  <div class="row">
    <div class="col form-group"><label>日期</label><input id="qtr_date" placeholder="mm-dd" value="${getTodayStr()}"></div>
    <div class="col form-group"><label>排序</label><select id="qtr_sort">
      <option value="time">按时间</option>
      <option value="cost">按价格</option>
    </select></div>
  </div>
  <button onclick="doQueryTransfer()">查询</button>
  <div id="qtr_result"></div>
</div>`;
}

async function doQueryTransfer() {
  const from = document.getElementById("qtr_from").value.trim();
  const to = document.getElementById("qtr_to").value.trim();
  const date = document.getElementById("qtr_date").value.trim();
  const sort = document.getElementById("qtr_sort").value;
  const div = document.getElementById("qtr_result");
  if (!from || !to || !date) { div.innerHTML = '<p class="error">请填写完整</p>'; return; }

  div.innerHTML = '<p>查询中...</p>';
  const res = await api.queryTransfer(from, to, date, sort);
  if (!res.success) { div.innerHTML = `<p class="error">${res.error}</p>`; return; }
  if (!res.data) { div.innerHTML = '<p>没有找到换乘方案</p>'; return; }

  const d = res.data;
  div.innerHTML = `<div class="card">
    <h3>换乘方案</h3>
    <h4>第一程</h4>
    <table><tr><th>车次</th><th>出发站</th><th>出发时间</th><th>到达站</th><th>到达时间</th><th>票价</th><th>余票</th></tr>
    <tr><td>${escHtml(d.first.trainID)}</td><td>${escHtml(d.first.from)}</td><td>${d.first.leavingTime}</td>
    <td>${escHtml(d.first.to)}</td><td>${d.first.arrivingTime}</td><td>${d.first.price}</td><td>${d.first.seat}</td></tr></table>
    <h4>第二程</h4>
    <table><tr><th>车次</th><th>出发站</th><th>出发时间</th><th>到达站</th><th>到达时间</th><th>票价</th><th>余票</th></tr>
    <tr><td>${escHtml(d.second.trainID)}</td><td>${escHtml(d.second.from)}</td><td>${d.second.leavingTime}</td>
    <td>${escHtml(d.second.to)}</td><td>${d.second.arrivingTime}</td><td>${d.second.price}</td><td>${d.second.seat}</td></tr></table>
  </div>`;
}

// ===================== 购票 =====================

function renderBuyTicket() {
  const params = window._pageParams || {};
  return `<h2>购票</h2>
<div class="card">
  <div class="form-group"><label>车次</label><input id="bt_train" placeholder="Train ID" value="${escHtml(params.trainID || "")}"></div>
  <div class="row">
    <div class="col form-group"><label>出发站</label><input id="bt_from" placeholder="出发站" value="${escHtml(params.from || "")}"></div>
    <div class="col form-group"><label>到达站</label><input id="bt_to" placeholder="到达站" value="${escHtml(params.to || "")}"></div>
  </div>
  <div class="row">
    <div class="col form-group"><label>日期</label><input id="bt_date" placeholder="mm-dd" value="${params.date || getTodayStr()}"></div>
    <div class="col form-group"><label>数量</label><input id="bt_count" type="number" value="1" min="1"></div>
  </div>
  <div class="form-group" style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="bt_queue" style="width:auto;margin:0"><label for="bt_queue" style="display:inline;margin:0;font-size:13px;color:#555">余票不足时加入候补</label></div>
  <button onclick="doBuyTicket()">确认购票</button>
  <div id="bt_msg"></div>
</div>`;
}

async function doBuyTicket() {
  const u = session.get();
  if (!u) { document.getElementById("bt_msg").innerHTML = '<p class="error">请先登录</p>'; return; }
  const trainID = document.getElementById("bt_train").value.trim();
  const from = document.getElementById("bt_from").value.trim();
  const to = document.getElementById("bt_to").value.trim();
  const date = document.getElementById("bt_date").value.trim();
  const count = parseInt(document.getElementById("bt_count").value);
  const queue = document.getElementById("bt_queue").checked;
  const msg = document.getElementById("bt_msg");
  if (!trainID || !from || !to || !date || isNaN(count) || count <= 0) {
    msg.innerHTML = '<p class="error">请填写完整且数量需大于0</p>'; return;
  }

  msg.innerHTML = '<p>查询车次信息中...</p>';
  const trainRes = await api.queryTrain(trainID, date);
  if (!trainRes.success) { msg.innerHTML = `<p class="error">${trainRes.error}</p>`; return; }

  const stations = trainRes.data.stations;
  let fromIdx = -1, toIdx = -1;
  for (let i = 0; i < stations.length; i++) {
    if (stations[i].station === from) fromIdx = i;
    if (stations[i].station === to) toIdx = i;
  }
  if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) {
    msg.innerHTML = '<p class="error">出发站或到达站不匹配</p>'; return;
  }

  const price = (stations[toIdx].price ?? 0) - (stations[fromIdx].price ?? 0);
  if (price <= 0) { msg.innerHTML = '<p class="error">价格信息异常</p>'; return; }
  const totalPrice = price * count;

  msg.innerHTML = `<div class="card" id="bt_confirm">
    <h3>确认购票信息</h3>
    <table>
      <tr><td>车次</td><td><strong>${escHtml(trainID)} (${escHtml(trainRes.data.type)})</strong></td></tr>
      <tr><td>出发站</td><td><strong>${escHtml(from)}</strong></td></tr>
      <tr><td>到达站</td><td><strong>${escHtml(to)}</strong></td></tr>
      <tr><td>发车日期</td><td><strong>${escHtml(date)}</strong></td></tr>
      <tr><td>发车时间</td><td>${stations[fromIdx].leavingTime}（到达 ${stations[toIdx].arrivingTime}）</td></tr>
      <tr><td>座位数</td><td><strong>${count}</strong></td></tr>
      <tr><td>单价</td><td><strong>${price}</strong></td></tr>
      <tr><td>总价</td><td><strong style="color:red;font-size:1.2em">${totalPrice}</strong></td></tr>
      ${queue ? '<tr><td>候补</td><td>余票不足时自动加入候补队列</td></tr>' : ''}
    </table>
    <div class="row" style="margin-top:15px">
      <div class="col"><button onclick="cancelConfirm()" style="background:#999">取消</button></div>
      <div class="col"><button onclick="confirmBuy('${escHtml(trainID)}','${escHtml(from)}','${escHtml(to)}','${escHtml(date)}',${count},${queue})">确认购票</button></div>
    </div>
  </div>`;
}

async function confirmBuy(trainID, from, to, date, count, queue) {
  const u = session.get();
  const msg = document.getElementById("bt_msg");
  msg.innerHTML = '<p>购票中...</p>';
  const res = await api.buyTicket({ username: u.username, trainID, date, from, to, count, queue });
  if (res.success) {
    if (res.data.status === "success") {
      msg.innerHTML = `<p class="success">购票成功！总价：${res.data.totalPrice}，正在跳转到订单页面...</p>`;
      setTimeout(() => navigate("orders"), 1000);
    } else {
      msg.innerHTML = `<p class="success">已加入候补队列，正在跳转到订单页面...</p>`;
      setTimeout(() => navigate("orders"), 1000);
    }
  } else {
    msg.innerHTML = `<p class="error">${res.error}</p>`;
  }
}

function cancelConfirm() {
  document.getElementById("bt_msg").innerHTML = '<p class="muted">已取消</p>';
}

function quickBuy(trainID, from, to, date) {
  navigate("buy_ticket", { trainID, from, to, date });
}
