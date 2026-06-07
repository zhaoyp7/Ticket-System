// 管理员页面
// 注意：这些功能仅供管理员使用（privilege > 1）

function guardAdmin() {
  if (!session.isAdmin()) {
    document.getElementById("app").innerHTML = '<h2>权限不足</h2><div class="card"><p class="error">此功能仅限管理员使用</p></div>';
    return false;
  }
  return true;
}

// ===================== 新增车次 =====================

function renderAddTrain() {
  if (!guardAdmin()) return "";
  return `<h2>新增车次</h2>
<div class="card">
  <div class="form-group"><label>车次ID</label><input id="at_id" placeholder="Train ID"></div>
  <div class="row">
    <div class="col form-group"><label>车站数量</label><input id="at_staNum" type="number" value="2" min="2" max="100" onchange="onStaNumChange()"></div>
    <div class="col form-group"><label>座位数</label><input id="at_seatNum" type="number" value="1000"></div>
  </div>
  <div class="form-group"><label>类型</label><select id="at_type">
    <option value="G">G - 高铁</option><option value="D">D - 动车</option>
    <option value="T">T - 特快</option><option value="K">K - 快速</option><option value="Z">Z - 直达</option>
  </select></div>
  <div class="form-group"><label>发车时间</label><input id="at_startTime" placeholder="hh:mm" value="08:00"></div>
  <div class="form-group"><label>售卖日期</label>
    <input id="at_saleStart" placeholder="mm-dd" value="06-01"> ~ <input id="at_saleEnd" placeholder="mm-dd" value="08-31"></div>
  <h4>车站信息</h4>
  <div id="at_stations"></div>
  <button onclick="doAddTrain()">新增车次</button>
  <div id="at_msg"></div>
</div>`;
}

window.addEventListener("page:admin_train", () => onStaNumChange());

function onStaNumChange() {
  const n = parseInt(document.getElementById("at_staNum").value) || 2;
  let html = "";
  for (let i = 0; i < n; i++) {
    html += `<div class="form-group"><label>站名${i + 1}</label><input class="at_station" placeholder="站名"></div>`;
  }
  html += '<h4>票价（相邻站之间）</h4>';
  for (let i = 0; i < n - 1; i++) {
    html += `<div class="form-group"><label>票价 ${i + 1}->${i + 2}</label><input class="at_price" type="number" value="100"></div>`;
  }
  html += '<h4>行车时间（分钟，相邻站之间）</h4>';
  for (let i = 0; i < n - 1; i++) {
    html += `<div class="form-group"><label>时间 ${i + 1}->${i + 2}</label><input class="at_travel" type="number" value="60"></div>`;
  }
  html += '<h4>停站时间（分钟，不含首尾站）</h4>';
  if (n <= 2) {
    html += '<div class="form-group"><label>停站时间</label><input id="at_stop" value="_" readonly></div>';
  } else {
    for (let i = 1; i < n - 1; i++) {
      html += `<div class="form-group"><label>站${i + 1}停靠</label><input class="at_stopover" type="number" value="5"></div>`;
    }
  }
  document.getElementById("at_stations").innerHTML = html;
}

async function doAddTrain() {
  const msg = document.getElementById("at_msg");
  const trainID = document.getElementById("at_id").value.trim();
  const stationNum = parseInt(document.getElementById("at_staNum").value);
  const seatNum = parseInt(document.getElementById("at_seatNum").value);
  const type = document.getElementById("at_type").value;
  const startTime = document.getElementById("at_startTime").value.trim();
  const saleStart = document.getElementById("at_saleStart").value.trim();
  const saleEnd = document.getElementById("at_saleEnd").value.trim();

  const stations = [...document.querySelectorAll(".at_station")].map(e => e.value.trim());
  const prices = [...document.querySelectorAll(".at_price")].map(e => e.value);
  const travelTimes = [...document.querySelectorAll(".at_travel")].map(e => e.value);
  let stopoverTimes;
  if (stationNum <= 2) {
    stopoverTimes = "_";
  } else {
    stopoverTimes = [...document.querySelectorAll(".at_stopover")].map(e => e.value);
  }

  if (!trainID || stations.some(s => !s)) { msg.innerHTML = '<p class="error">请填写完整</p>'; return; }

  msg.innerHTML = '<p>创建中...</p>';
  const body = {
    trainID, stationNum, seatNum,
    stations: stations.join("|"),
    prices: prices.join("|"),
    startTime,
    travelTimes: travelTimes.join("|"),
    stopoverTimes: Array.isArray(stopoverTimes) ? stopoverTimes.join("|") : "_",
    saleDate: `${saleStart}|${saleEnd}`,
    type
  };
  const res = await api.addTrain(body);
  if (res.success) {
    msg.innerHTML = '<p class="success">新增车次成功</p>';
  } else {
    msg.innerHTML = `<p class="error">${res.error}</p>`;
  }
}

// ===================== 发布车次 =====================

function renderReleaseTrain() {
  if (!guardAdmin()) return "";
  return `<h2>发布车次</h2>
<div class="card">
  <div class="form-group"><label>车次ID</label><input id="rl_id" placeholder="Train ID"></div>
  <button onclick="doReleaseTrain()">发布</button>
  <div id="rl_msg"></div>
</div>`;
}

async function doReleaseTrain() {
  const id = document.getElementById("rl_id").value.trim();
  const msg = document.getElementById("rl_msg");
  if (!id) { msg.innerHTML = '<p class="error">请输入车次ID</p>'; return; }
  msg.innerHTML = '<p>发布中...</p>';
  const res = await api.releaseTrain(id);
  if (res.success) {
    msg.innerHTML = '<p class="success">发布成功</p>';
  } else {
    msg.innerHTML = `<p class="error">${res.error}</p>`;
  }
}

// ===================== 删除车次 =====================

function renderDeleteTrain() {
  if (!guardAdmin()) return "";
  return `<h2>删除车次</h2>
<div class="card">
  <div class="form-group"><label>车次ID</label><input id="dl_id" placeholder="Train ID"></div>
  <button onclick="doDeleteTrain()" class="btn-danger">删除</button>
  <p class="muted">只能删除未发布的车次</p>
  <div id="dl_msg"></div>
</div>`;
}

async function doDeleteTrain() {
  const id = document.getElementById("dl_id").value.trim();
  const msg = document.getElementById("dl_msg");
  if (!id) { msg.innerHTML = '<p class="error">请输入车次ID</p>'; return; }
  if (!confirm(`确认删除车次 ${id}？`)) return;
  msg.innerHTML = '<p>删除中...</p>';
  const res = await api.deleteTrain(id);
  if (res.success) {
    msg.innerHTML = '<p class="success">删除成功</p>';
  } else {
    msg.innerHTML = `<p class="error">${res.error}</p>`;
  }
}

// ===================== 查询车次 =====================

function renderQueryTrain() {
  if (!guardAdmin()) return "";
  return `<h2>查询车次</h2>
<div class="card">
  <div class="form-group"><label>车次ID</label><input id="qtrain_id" placeholder="Train ID"></div>
  <div class="form-group"><label>日期</label><input id="qtrain_date" placeholder="mm-dd" value="${getTodayStr()}"></div>
  <button onclick="doQueryTrain()">查询</button>
  <div id="qtrain_result"></div>
</div>`;
}

async function doQueryTrain() {
  const id = document.getElementById("qtrain_id").value.trim();
  const date = document.getElementById("qtrain_date").value.trim();
  const div = document.getElementById("qtrain_result");
  if (!id || !date) { div.innerHTML = '<p class="error">请填写完整</p>'; return; }

  div.innerHTML = '<p>查询中...</p>';
  const res = await api.queryTrain(id, date);
  if (!res.success) { div.innerHTML = `<p class="error">${res.error}</p>`; return; }

  const d = res.data;
  let html = `<h3>${escHtml(d.trainID)} ${escHtml(d.type)}</h3><table>
    <tr><th>站名</th><th>到达时间</th><th>出发时间</th><th>累计票价</th><th>余票</th></tr>`;
  for (const s of d.stations) {
    html += `<tr><td>${escHtml(s.station)}</td><td>${s.arrivingTime}</td>
    <td>${s.leavingTime}</td><td>${s.price != null ? s.price : "-"}</td>
    <td>${s.seat != null ? s.seat : "-"}</td></tr>`;
  }
  html += "</table>";
  div.innerHTML = html;
}

// ===================== 清空系统 =====================

function renderClean() {
  if (!guardAdmin()) return "";
  return `<h2>清空系统</h2>
<div class="card">
  <p style="color:red;font-weight:bold">警告：此操作将清除所有数据，且不可恢复！</p>
  <button onclick="doClean()" class="btn-danger">确认清空</button>
  <div id="clean_msg"></div>
</div>`;
}

async function doClean() {
  if (!confirm("再次确认：将永久清空所有数据！")) return;
  if (!confirm("最后一次确认：真的清除？")) return;
  const msg = document.getElementById("clean_msg");
  msg.innerHTML = '<p>清空中...</p>';
  const res = await api.clean();
  if (res.success) {
    session.clear();
    msg.innerHTML = '<p class="success">系统已清空</p>';
    setTimeout(() => navigate("home"), 1000);
  } else {
    msg.innerHTML = `<p class="error">${res.error}</p>`;
  }
}
