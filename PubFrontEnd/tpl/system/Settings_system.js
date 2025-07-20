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

  // 监听左侧导航切换区块，加载html后自动渲染表单
  document.addEventListener('DOMContentLoaded', function () {
    // 监听区块加载
    document.querySelectorAll('aside nav a[data-section]').forEach(a => {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        const file = this.getAttribute('data-section');
        const container = document.getElementById('system-sections');
        // 激活当前导航
        document.querySelectorAll('aside nav a[data-section]').forEach(x => x.classList.remove('bg-blue-100', 'font-bold'));
        this.classList.add('bg-blue-100', 'font-bold');
        // 加载区块并替换内容
        fetch(file)
          .then(r => r.text())
          .then(html => {
            container.innerHTML = html;
            // 加载后渲染表单
            renderAllSections();
          });
      });
    });
    // 页面初次加载时获取全局设置
    getGlobalSettings();
  });

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
})(); 