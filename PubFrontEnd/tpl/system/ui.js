
    // 下拉菜单显示/隐藏逻辑
    const navBtn = document.getElementById('navMenuBtn');
    const navDropdown = document.getElementById('navMenuDropdown');
    function renderNavMenu() {
      var navList = document.getElementById('navMenuList');
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
          a.onclick = function(e) { e.preventDefault(); window.logoutAndRedirect(); navDropdown.classList.add('hidden'); };
        } else {
          a.onclick = function() { navDropdown.classList.add('hidden'); };
        }
        navList.appendChild(a);
      });
    }
    navBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (navDropdown.classList.contains('hidden')) {
        renderNavMenu();
        navDropdown.classList.remove('hidden');
      } else {
        navDropdown.classList.add('hidden');
      }
    });
    // 点击空白处关闭
    document.addEventListener('click', function(e) {
      if (!navDropdown.classList.contains('hidden') && !navDropdown.contains(e.target) && e.target !== navBtn) {
        navDropdown.classList.add('hidden');
      }
    });
    // ESC关闭
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape') navDropdown.classList.add('hidden');
    });

    // 侧边栏显示/隐藏逻辑
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    // 显示侧边栏，隐藏主内容
    sidebarToggleBtn.addEventListener('click', function() {
      sidebar.classList.remove('hidden');
      mainContent.classList.add('hidden');
    });
    // 侧边栏内所有链接
    sidebar.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth < 768) { // 小屏
          sidebar.classList.add('hidden');
          mainContent.classList.remove('hidden');
        }
      });
    });
    // 窗口大小变化时，自动恢复布局
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 768) {
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('hidden');
      } else {
        sidebar.classList.add('hidden');
        mainContent.classList.remove('hidden');
      }
    });
    // 页面加载时根据屏幕宽度初始化
    window.addEventListener('DOMContentLoaded', function() {
      if (window.innerWidth < 768) {
        sidebar.classList.add('hidden');
        mainContent.classList.remove('hidden');
      } else {
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('hidden');
      }
    });