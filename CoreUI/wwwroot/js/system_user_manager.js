// 用户管理前端逻辑
// 依赖：api.js, public.js (用于showNotification)

// 分页和检索状态
let currentPage = 1;
let pageSize = 20;
let totalUsers = 0;
let searchUsername = '';
let searchHomeDir = '';

// 绑定分页、检索控件
function bindUserManagerControls() {
  document.getElementById('pageSizeSelect').addEventListener('change', function () {
    pageSize = parseInt(this.value, 10);
    currentPage = 1;
    loadUsers();
  });
  document.getElementById('prevPageBtn').addEventListener('click', function () {
    if (currentPage > 1) {
      currentPage--;
      loadUsers();
    }
  });
  document.getElementById('nextPageBtn').addEventListener('click', function () {
    if (currentPage * pageSize < totalUsers) {
      currentPage++;
      loadUsers();
    }
  });
  document.getElementById('searchBtn').addEventListener('click', function () {
    searchUsername = document.getElementById('searchUsername').value.trim();
    searchHomeDir = document.getElementById('searchHomeDir').value.trim();
    currentPage = 1;
    loadUsers();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('container_UserManager')) return;
  bindUserManagerControls();
  loadUsers();

  // 打开添加用户模态框时重置表单
  document.getElementById('addUserBtn').addEventListener('click', function () {
    document.getElementById('addUsername').value = '';
    document.getElementById('addPasswd').value = '';
    document.getElementById('addHome').value = '';
    document.getElementById('addIsAdmin').checked = false;
  });

  // 添加用户
  document.getElementById('saveUserBtn').addEventListener('click', async function () {
    const username = document.getElementById('addUsername').value.trim();
    const passwd = document.getElementById('addPasswd').value;
    const home = document.getElementById('addHome').value.trim();
    const is_admin = document.getElementById('addIsAdmin').checked;
    if (!username || !passwd) {
      showNotification('用户名和密码不能为空', 'danger');
      return;
    }
    try {
      const res = await API.request(
        '{{.ServerUrl}}/@api/admin/users',
        { username, passwd, home_dir: home, is_admin },
        { needToken: true, method: 'POST' }
      );
      // 适配SendJSON双层结构，判断res.code < 10 即为成功
      if (typeof res.code !== 'undefined' && res.code < 10) {
        showNotification('添加用户成功', 'success');
        document.getElementById('addUserModal').querySelector('.btn-close').click();
        loadUsers();
      } else {
        showNotification('添加用户失败: ' + (res.message || JSON.stringify(res)), 'danger');
      }
    } catch (e) {
      showNotification('添加用户出错: ' + e.message, 'danger');
    }
  });

  // 更新用户
  document.getElementById('updateUserBtn').addEventListener('click', async function () {
    const id = this.getAttribute('data-userid');
    const passwd = document.getElementById('editPasswd').value;
    const home = document.getElementById('editHome').value.trim();
    const is_admin = document.getElementById('editIsAdmin').checked;
    if (!id) return;
    try {
      const body = { home_dir: home, is_admin };
      if (passwd) body.passwd = passwd;
      const res = await API.request(
        `{{.ServerUrl}}/@api/admin/users/${id}`,
        body,
        { needToken: true, method: 'PUT' }
      );
      if (res.id) {
        showNotification('更新用户成功', 'success');
        document.getElementById('editUserModal').querySelector('.btn-close').click();
        loadUsers();
      } else {
        showNotification('更新用户失败: ' + (res.message || JSON.stringify(res)), 'danger');
      }
    } catch (e) {
      showNotification('更新用户出错: ' + e.message, 'danger');
    }
  });
});

// 加载用户列表，支持分页和检索
async function loadUsers() {
  try {
    const params = {
      page: currentPage,
      page_size: pageSize,
    };
    if (searchUsername) params.username = searchUsername;
    if (searchHomeDir) params.home_dir = searchHomeDir;
    const query = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const res = await API.request(
      `{{.ServerUrl}}/@api/admin/users?${query}`,
      null,
      { needToken: true, method: 'GET' }
    );
    // 适配SendJSON双层结构
    const d = res.data || {};
    totalUsers = d.total || 0;
    renderUsersTable(d.data || []);
    updatePageInfo();
  } catch (e) {
    showNotification('获取用户列表失败: ' + e.message, 'danger');
  }
}

// 渲染用户表格，增加用户ID列
function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';
  (users || []).forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>******</td>
      <td>${u.home_dir || ''}</td>
      <td>${u.is_admin ? '是' : '否'}</td>
      <td>
        <button class="btn btn-sm btn-info me-1" onclick="editUser('${u.id}', '${u.username}', '${u.home_dir || ''}', ${u.is_admin})">编辑</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}', '${u.username}')">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 更新分页信息
function updatePageInfo() {
  document.getElementById('pageInfo').textContent = `第 ${currentPage} 页`;
  document.getElementById('totalInfo').textContent = `共 ${totalUsers} 条`;
  document.getElementById('pageSizeSelect').value = pageSize;
}

// 编辑用户弹窗
window.editUser = function (id, username, home, is_admin) {
  document.getElementById('editUsername').value = username;
  document.getElementById('editPasswd').value = '';
  document.getElementById('editHome').value = home;
  document.getElementById('editIsAdmin').checked = !!is_admin;
  document.getElementById('updateUserBtn').setAttribute('data-userid', id);
  const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
  modal.show();
};

// 删除用户
window.deleteUser = async function (id, username) {
  if (!confirm('确定要删除用户 ' + username + ' 吗？')) return;
  try {
    const res = await API.request(
      `{{.ServerUrl}}/@api/admin/users/${id}`,
      {},
      { needToken: true, method: 'DELETE' }
    );
    if (typeof res.code !== 'undefined' && res.code < 10) {
      showNotification('删除用户成功', 'success');
      loadUsers();
    } else {
      showNotification('删除用户失败: ' + (res.message || JSON.stringify(res)), 'danger');
    }
  } catch (e) {
    showNotification('删除用户出错: ' + e.message, 'danger');
  }
}; 