// 全局设置逻辑，适配所有系统设置区块
// 依赖 window.API.request, window.API.TokenManager, window.showNotification

(function () {
  // 全局设置数据
  window.globalSettingsData = {};

  // 工具函数：根据路径获取嵌套值
  function getNestedValue(obj, path) {
    if (!obj) return undefined;
    const parts = path.split('.');
    let v = obj;
    for (const p of parts) {
      if (v && typeof v === 'object' && p in v) {
        v = v[p];
      } else {
        return undefined;
      }
    }
    return v;
  }

  // 工具函数：根据路径设置嵌套值
  function setNestedValue(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  // 渲染当前已加载区块的所有表单
  function renderAllSections() {
    // 渲染所有有[data-bind]的元素
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      const path = el.dataset.bind;
      let value = getNestedValue(window.globalSettingsData, path);
      // 特殊处理
      if (path === 'NascoreExt.Vod.VodSubscription.Urls' && Array.isArray(value)) {
        el.value = value.join('\n');
      } else if (el.type === 'checkbox') {
        el.checked = !!value;
      } else if (el.type === 'number' || el.dataset.type === 'number') {
        el.value = value !== undefined ? value : '';
      } else if (value !== undefined) {
        el.value = value;
      } else {
        el.value = '';
      }
    });
  }

  // 监听所有表单输入变化
  document.addEventListener('input', function (e) {
    const el = e.target;
    if (el.dataset && el.dataset.bind) {
      const path = el.dataset.bind;
      let value;
      if (path === 'NascoreExt.Vod.VodSubscription.Urls') {
        value = el.value.split('\n').map(x => x.trim()).filter(Boolean);
      } else if (el.type === 'checkbox') {
        value = el.checked;
      } else if (el.type === 'number' || el.dataset.type === 'number') {
        value = parseInt(el.value, 10) || 0;
      } else {
        value = el.value;
      }
      setNestedValue(window.globalSettingsData, path, value);
    }
  });

  // 保存设置
  window.saveGlobalSetting = function () {
    API.request('/@api/admin/globalSettings', window.globalSettingsData, { method: 'POST', needToken: true })
      .then(res => {
        if (!res.error) {
          window.showNotification('保存成功', 'success');
        } else {
          window.showNotification('保存失败', 'error');
        }
      })
      .catch(() => window.showNotification('保存失败', 'error'));
  };

  // 获取全局设置
  function getGlobalSettings() {
    API.request('/@api/admin/globalSettings', {}, { method: 'GET', needToken: true })
      .then(res => {
        window.globalSettingsData = res.data || {};
        renderAllSections();
      })
      .catch(() => window.showNotification('获取全局设置失败', 'error'));
  }

  // 根据 hash 加载页面
  function loadSectionFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#system_page=')) {
      const page = hash.replace('#system_page=', '');
      // 找到对应的 data-section
      const navLinks = document.querySelectorAll('aside nav a[data-section]');
      let found = false;
      navLinks.forEach(a => {
        const section = a.getAttribute('data-section');
        const sectionName = section.replace('.html', '');
        if (sectionName.toLowerCase() === page.toLowerCase()) {
          a.classList.add('is-active');
          // 触发内容加载
          fetch(section)
            .then(r => r.text())
            .then(html => {
              document.getElementById('system-sections').innerHTML = html;
              renderAllSections();
              // 新增：如果是LegoConfig.html，绑定按钮事件
              if (section === 'LegoConfig.html') {
                setTimeout(() => {
                  const btn = document.getElementById('lego-download-btn');
                  if (btn) btn.onclick = window.downloadLego;
                  const copyBtn = document.getElementById('lego-copy-command-btn');
                  if (copyBtn) copyBtn.onclick = window.copyLegoCommand;
                }, 0);
              }
            });
          found = true;
        } else {
          a.classList.remove('is-active');
        }
      });
      if (!found) {
        // hash不合法，显示欢迎页
        const welcome = document.getElementById('welcome-info');
        if (welcome) {
          document.getElementById('system-sections').innerHTML = welcome.outerHTML;
        }
      }
    } else {
      // 没有hash，显示欢迎页
      const welcome = document.getElementById('welcome-info');
      if (welcome) {
        document.getElementById('system-sections').innerHTML = welcome.outerHTML;
      }
      // 取消激活
      document.querySelectorAll('aside nav a[data-section]').forEach(x => x.classList.remove('is-active'));
    }
  }

  // 侧边栏点击事件，设置hash，不直接加载内容
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('aside nav a[data-section]').forEach(a => {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        const file = this.getAttribute('data-section');
        const sectionName = file.replace('.html', '');
        window.location.hash = '#system_page=' + sectionName;
        // loadSectionFromHash 会自动加载内容
      });
    });
    // 页面初次加载时获取全局设置
    getGlobalSettings();
    setTimeout(loadSectionFromHash, 0); // 等待DOM渲染后执行
  });

  // hash变化监听
  window.addEventListener('hashchange', loadSectionFromHash);

  // 通用通知（如已在主页面定义可省略）
  if (!window.showNotification) {
    window.showNotification = function (msg, type = 'info') {
      let color = 'bg-blue-500';
      if (type === 'success') color = 'bg-green-500';
      if (type === 'danger' || type === 'error') color = 'bg-red-500';
      const n = document.createElement('div');
      n.className = `fixed top-6 right-6 z-50 px-6 py-3 text-white rounded shadow-lg ${color}`;
      n.textContent = msg;
      document.body.appendChild(n);
      setTimeout(() => n.remove(), 2500);
    };
  }

  // 模态框显示/隐藏工具（如已在主页面定义可省略）
  if (!window.closeModal) {
    window.closeModal = function(id) {
      document.getElementById(id).classList.add('hidden');
    }
  }
  if (!window.openModal) {
    window.openModal = function(id) {
      document.getElementById(id).classList.remove('hidden');
    }
  }

  // 允许外部手动触发表单渲染
  window.updateGlobalSettingsForm = renderAllSections;

  // ===== 以下为原 ui.js 内容合并 =====
  document.addEventListener('DOMContentLoaded', function () {
    // 下拉菜单显示/隐藏逻辑
    const navBtn = document.getElementById('navMenuBtn');
    const navDropdown = document.getElementById('navMenuDropdown');
    function renderNavMenu() {
      var navList = document.getElementById('navMenuList');
      if (!navList) return;
      navList.innerHTML = '';
      if (!window.GlobalNavMenu) return;
      var isLogin = window.isLoggedIn && window.isLoggedIn();
      window.GlobalNavMenu.forEach(function(item) {
        if (item.onlyWhenLogin && !isLogin) return;
        if (item.onlyWhenNotLogin && isLogin) return;
        var a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.name;
        a.className = 'block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-gray-100';
        if (item.key === 'logout') {
          a.onclick = function(e) { e.preventDefault(); window.logoutAndRedirect(); navDropdown && navDropdown.classList.add('hidden'); };
        } else {
          a.onclick = function() { navDropdown && navDropdown.classList.add('hidden'); };
        }
        navList.appendChild(a);
      });
    }
    if (navBtn) {
      navBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (navDropdown && navDropdown.classList.contains('hidden')) {
          renderNavMenu();
          navDropdown.classList.remove('hidden');
        } else if (navDropdown) {
          navDropdown.classList.add('hidden');
        }
      });
    }
    // 点击空白处关闭
    document.addEventListener('click', function(e) {
      if (navDropdown && !navDropdown.classList.contains('hidden') && !navDropdown.contains(e.target) && e.target !== navBtn) {
        navDropdown.classList.add('hidden');
      }
    });
    // ESC关闭
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && navDropdown) navDropdown.classList.add('hidden');
    });

    // 侧边栏显示/隐藏逻辑
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebarToggleBtn && sidebar && mainContent) {
      sidebarToggleBtn.addEventListener('click', function() {
        sidebar.classList.remove('hidden');
        mainContent.classList.add('hidden');
      });
    }
    // 侧边栏内所有链接
    if (sidebar) {
      sidebar.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          if (window.innerWidth < 768 && sidebar && mainContent) { // 小屏
            sidebar.classList.add('hidden');
            mainContent.classList.remove('hidden');
          }
        });
      });
    }
    // 窗口大小变化时，自动恢复布局
    window.addEventListener('resize', function() {
      if (sidebar && mainContent) {
        if (window.innerWidth >= 768) {
          sidebar.classList.remove('hidden');
          mainContent.classList.remove('hidden');
        } else {
          sidebar.classList.add('hidden');
          mainContent.classList.remove('hidden');
        }
      }
    });
    // 页面加载时根据屏幕宽度初始化
    if (sidebar && mainContent) {
      if (window.innerWidth < 768) {
        sidebar.classList.add('hidden');
        mainContent.classList.remove('hidden');
      } else {
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('hidden');
      }
    }
  });
})(); 