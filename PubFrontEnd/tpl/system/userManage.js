// 新版用户管理前端逻辑，兼容tailwindcss
// 依赖 window.API.request, window.showNotification, window.openModal, window.closeModal

(function() {
  if (!document.getElementById('user')) return;

  // 解析hash参数
  function parseHashParams() {
    const hash = window.location.hash || '';
    const params = {};
    if (hash.startsWith('#system_page=UserManager')) {
      const idx = hash.indexOf('&');
      if (idx !== -1) {
        const paramStr = hash.slice(idx + 1);
        paramStr.split('&').forEach(kv => {
          const [k, v] = kv.split('=');
          if (k && v) params[k] = decodeURIComponent(v);
        });
      }
    }
    return params;
  }

  // 更新hash参数
  function updateHashParams(newParams) {
    let hash = window.location.hash || '';
    if (!hash.startsWith('#system_page=UserManager')) return;
    let base = '#system_page=UserManager';
    let params = parseHashParams();
    params = { ...params, ...newParams };
    const paramStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    window.location.hash = base + (paramStr ? '&' + paramStr : '');
  }

  // 状态
  let currentPage = 1;
  let pageSize = 20;
  let totalUsers = 0;
  let searchUsername = '';
  let searchHomeDir = '';

  // 绑定事件
  function bindEvents() {
    document.getElementById('pageSizeSelect').addEventListener('change', function () {
      pageSize = parseInt(this.value, 10);
      currentPage = 1;
      updateHashParams({ page: currentPage, pageSize });
      loadUsers();
    });
    document.getElementById('prevPageBtn').addEventListener('click', function () {
      if (currentPage > 1) {
        currentPage--;
        updateHashParams({ page: currentPage, pageSize });
        loadUsers();
      }
    });
    document.getElementById('nextPageBtn').addEventListener('click', function () {
      if (currentPage * pageSize < totalUsers) {
        currentPage++;
        updateHashParams({ page: currentPage, pageSize });
        loadUsers();
      }
    });
    document.getElementById('searchBtn').addEventListener('click', function () {
      searchUsername = document.getElementById('searchUsername').value.trim();
      searchHomeDir = document.getElementById('searchHomeDir').value.trim();
      currentPage = 1;
      updateHashParams({ page: currentPage, pageSize });
      loadUsers();
    });
    document.getElementById('addUserBtn').addEventListener('click', function () {
      document.getElementById('addUsername').value = '';
      document.getElementById('addPasswd').value = '';
      document.getElementById('addHome').value = '';
      document.getElementById('addIsAdmin').checked = false;
      window.openModal && window.openModal('addUserModal');
    });
    document.getElementById('saveUserBtn').addEventListener('click', async function () {
      const username = document.getElementById('addUsername').value.trim();
      const passwd = document.getElementById('addPasswd').value;
      const home = document.getElementById('addHome').value.trim();
      const is_admin = document.getElementById('addIsAdmin').checked;
      if (!username || !passwd) {
        window.showNotification('用户名和密码不能为空', 'danger');
        return;
      }
      try {
        const res = await API.request('/@adminapi/admin/users', { username, passwd, home_dir: home, is_admin }, { needToken: true, method: 'POST' });
        if (res && typeof res.code !== 'undefined' && res.code < 10 && res.data && res.data.id) {
          window.showNotification('添加用户成功', 'success');
          window.closeModal && window.closeModal('addUserModal');
          loadUsers();
        } else {
          window.showNotification('添加用户失败: ' + (res.message || JSON.stringify(res)), 'danger');
        }
      } catch (e) {
        window.showNotification('添加用户出错: ' + e.message, 'danger');
      }
    });
    document.getElementById('updateUserBtn').addEventListener('click', async function () {
      const id = this.getAttribute('data-userid');
      const passwd = document.getElementById('editPasswd').value;
      const home = document.getElementById('editHome').value.trim();
      const is_admin = document.getElementById('editIsAdmin').checked;
      if (!id) return;
      try {
        const body = { home_dir: home, is_admin };
        if (passwd) body.passwd = passwd;
        const res = await API.request(`/@adminapi/admin/users/${id}`, body, { needToken: true, method: 'PUT' });
        if (res && typeof res.code !== 'undefined' && res.code < 10 && res.data && res.data.id) {
          window.showNotification('更新用户成功', 'success');
          window.closeModal && window.closeModal('editUserModal');
          loadUsers();
        } else {
          window.showNotification('更新用户失败: ' + (res.message || JSON.stringify(res)), 'danger');
        }
      } catch (e) {
        window.showNotification('更新用户出错: ' + e.message, 'danger');
      }
    });
  }

  // 渲染用户表格
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
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2" onclick="window.editUser(${u.id}, '${u.username}', '${u.home_dir || ''}', ${u.is_admin})">编辑</button>
          <button class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded" onclick="window.deleteUser(${u.id}, '${u.username}')">删除</button>
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

  // 加载用户列表
  async function loadUsers() {
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (searchUsername) params.username = searchUsername;
      if (searchHomeDir) params.home_dir = searchHomeDir;
      const query = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
      const res = await API.request(`/@adminapi/admin/users?${query}`, null, { needToken: true, method: 'GET' });
      const d = res.data || {};
      totalUsers = d.total || 0;
      renderUsersTable(d.data || []);
      updatePageInfo();
    } catch (e) {
      window.showNotification('获取用户列表失败: ' + e.message, 'danger');
    }
  }

  // 编辑用户弹窗
  window.editUser = function (id, username, home, is_admin) {
    document.getElementById('editUsername').value = username;
    document.getElementById('editPasswd').value = '';
    document.getElementById('editHome').value = home;
    document.getElementById('editIsAdmin').checked = !!is_admin;
    document.getElementById('updateUserBtn').setAttribute('data-userid', id);
    window.openModal && window.openModal('editUserModal');
  };

  // 删除用户
  window.deleteUser = async function (id, username) {
    if (!confirm('确定要删除用户 ' + username + ' 吗？')) return;
    try {
      const res = await API.request(`/@adminapi/admin/users/${id}`, {}, { needToken: true, method: 'DELETE' });
      if (res && typeof res.code !== 'undefined' && res.code < 10 && (res.data === null || res.data === undefined || res.data.success || res.data.id)) {
        window.showNotification('删除用户成功', 'success');
        loadUsers();
      } else {
        window.showNotification('删除用户失败: ' + (res.message || JSON.stringify(res)), 'danger');
      }
    } catch (e) {
      window.showNotification('删除用户出错: ' + e.message, 'danger');
    }
  };

  // hash变化时自动刷新数据
  function syncStateWithHash() {
    const params = parseHashParams();
    currentPage = parseInt(params.page, 10) || 1;
    pageSize = parseInt(params.pageSize, 10) || 20;
    // 检索条件不放hash，刷新时保留当前输入框内容
    loadUsers();
  }

  // 初始化
  function init() {
    // 读取hash参数
    const params = parseHashParams();
    currentPage = parseInt(params.page, 10) || 1;
    pageSize = parseInt(params.pageSize, 10) || 20;
    bindEvents();
    loadUsers();
    window.addEventListener('hashchange', function() {
      if ((window.location.hash || '').startsWith('#system_page=UserManager')) {
        syncStateWithHash();
      }
    });
  }

  init();
})(); 