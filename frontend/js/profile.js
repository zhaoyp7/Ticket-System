// 个人信息页面

function renderProfile() {
  const u = session.get();
  if (!u) return '<h2>个人中心</h2><div class="card"><p class="error">请先登录</p></div>';

  return `<h2>个人中心</h2>
<div class="card" id="profile_info">
  <p>加载中...</p>
</div>`;
}

window.addEventListener("page:profile", async () => {
  const u = session.get();
  if (!u) return;
  const res = await api.getProfile(u.username, u.username);
  const div = document.getElementById("profile_info");
  if (res.success) {
    session.set(res.data);
    div.innerHTML = `<table>
      <tr><td style="width:80px">用户名</td><td><strong>${escHtml(res.data.username)}</strong></td></tr>
      <tr><td>姓名</td><td>${escHtml(res.data.name)}</td></tr>
      <tr><td>邮箱</td><td>${escHtml(res.data.mailAddr)}</td></tr>
      <tr><td>权限</td><td>${res.data.privilege} ${res.data.privilege > 1 ? "(管理员)" : "(普通用户)"}</td></tr>
    </table>`;
  } else {
    div.innerHTML = `<p class="error">${res.error}</p>`;
  }
});

// ===================== 修改个人信息 =====================

function renderModifyProfile() {
  const u = session.get();
  if (!u) return '<h2>修改信息</h2><div class="card"><p class="error">请先登录</p></div>';

  return `<h2>修改信息</h2>
<div class="card">
  <p>当前用户：<strong>${escHtml(u.username)}</strong></p>
  <div class="form-group"><label>新密码（留空不修改）</label><input id="mp_pwd" type="password" placeholder="新密码"></div>
  <div class="form-group"><label>新姓名（留空不修改）</label><input id="mp_name" placeholder="新姓名"></div>
  <div class="form-group"><label>新邮箱（留空不修改）</label><input id="mp_mail" placeholder="新邮箱"></div>
  <div id="mp_msg"></div>
  <button onclick="doModifyProfile()">保存修改</button>
</div>`;
}

async function doModifyProfile() {
  const u = session.get();
  if (!u) return;
  const password = document.getElementById("mp_pwd").value.trim();
  const name = document.getElementById("mp_name").value.trim();
  const mail = document.getElementById("mp_mail").value.trim();
  const msg = document.getElementById("mp_msg");

  const body = { curUser: u.username, username: u.username };
  if (password) body.password = password;
  if (name) body.name = name;
  if (mail) body.mail = mail;

  msg.innerHTML = '<p>保存中...</p>';
  const res = await api.updateProfile(body);
  if (res.success) {
    session.set(res.data);
    msg.innerHTML = '<p class="success">修改成功</p>';
  } else {
    msg.innerHTML = `<p class="error">${res.error}</p>`;
  }
}

// ===================== 工具函数 =====================

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getTodayStr() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
