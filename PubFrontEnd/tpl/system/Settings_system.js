// 全局设置逻辑，适配tailwindcss通知

document.addEventListener('DOMContentLoaded', function () {
  // 监听左侧导航点击
  document.querySelectorAll('aside nav a[data-section]').forEach(a => {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const file = this.getAttribute('data-section');
      const container = document.getElementById('system-sections');
      // 激活当前导航
      document.querySelectorAll('aside nav a[data-section]').forEach(x => x.classList.remove('bg-blue-100', 'font-bold'));
      this.classList.add('bg-blue-100', 'font-bold');
      // 加载区块并替换内容
      fetch(`${file}`)
        .then(r => r.text())
        .then(html => {
          container.innerHTML = html;
        });
    });
  });

  // 通用通知
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
});

// 模态框显示/隐藏工具
window.closeModal = function(id) {
  document.getElementById(id).classList.add('hidden');
}
window.openModal = function(id) {
  document.getElementById(id).classList.remove('hidden');
} 