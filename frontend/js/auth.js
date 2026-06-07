// 登录 / 注册 页面

function renderLogin() {
  return `<h2>登录</h2>
<div class="card">
  <div class="form-group"><label>用户名</label><input id="login_user" placeholder="用户名"></div>
  <div class="form-group"><label>密码</label><input id="login_pwd" type="password" placeholder="密码"></div>
  <button onclick="doLogin()">登录</button>
  <p style="margin-top:10px">没有账号？<a href="#" onclick="navigate('register')">立即注册</a></p>
  <div id="login_msg"></div>
</div>`;
}

async function doLogin() {
  const username = document.getElementById("login_user").value.trim();
  const password = document.getElementById("login_pwd").value.trim();
  const msg = document.getElementById("login_msg");
  if (!username || !password) { msg.innerHTML = '<p class="error">请填写完整</p>'; return; }
  msg.innerHTML = '<p>登录中...</p>';
  const res = await api.login({ username, password });
  if (res.success) {
    const profile = await api.getProfile(username, username);
    if (profile.success) {
      session.set(profile.data);
    } else {
      session.set({ username, name: "", mailAddr: "", privilege: -1 });
    }
    navigate("home");
  } else {
    msg.innerHTML = `<p class="error">${res.error || "登录失败"}</p>`;
  }
}

function renderRegister() {
  const cur = session.get();
  const notice = cur ? "" : '<p class="muted">提示：首次使用可直接注册管理员账号；系统已有用户时，请先登录再由管理员创建新账号。</p>';
  return `<h2>注册</h2>
<div class="card">
  ${notice}
  <div class="form-group"><label>用户名</label><input id="reg_user" placeholder="字母开头，字母数字下划线"></div>
  <div class="form-group"><label>密码</label><input id="reg_pwd" type="password" placeholder="密码"></div>
  <div class="form-group"><label>姓名</label><input id="reg_name" placeholder="2-5个汉字"></div>
  <div class="form-group"><label>邮箱</label><input id="reg_mail" placeholder="邮箱地址"></div>
  <button onclick="doRegister()">注册</button>
  <p style="margin-top:10px">已有账号？<a href="#" onclick="navigate('login')">去登录</a></p>
  <div id="reg_msg"></div>
</div>`;
}

async function doRegister() {
  const username = document.getElementById("reg_user").value.trim();
  const password = document.getElementById("reg_pwd").value.trim();
  const name = document.getElementById("reg_name").value.trim();
  const mail = document.getElementById("reg_mail").value.trim();
  const msg = document.getElementById("reg_msg");
  if (!username || !password || !name || !mail) {
    msg.innerHTML = '<p class="error">请填写完整</p>'; return;
  }

  msg.innerHTML = '<p>注册中...</p>';

  const cur = session.get();
  const body = cur
    ? { curUser: cur.username, username, password, name, mail, privilege: 1 }
    : { username, password, name, mail };

  const res = await api.register(body);
  if (res.success) {
    if (cur) {
      msg.innerHTML = '<p class="success">注册成功！</p>';
    } else {
      msg.innerHTML = '<p class="success">注册成功！正在登录...</p>';
      const loginRes = await api.login({ username, password });
      if (loginRes.success) {
        const profile = await api.getProfile(username, username);
        if (profile.success) {
          session.set(profile.data);
        } else {
          session.set({ username, name, mailAddr: mail, privilege: -1 });
        }
        setTimeout(() => navigate("home"), 500);
      } else {
        navigate("login");
      }
    }
  } else {
    msg.innerHTML = `<p class="error">${res.error || "注册失败"}</p>`;
    if (!cur) {
      setTimeout(() => navigate("login"), 1500);
    }
  }
}
