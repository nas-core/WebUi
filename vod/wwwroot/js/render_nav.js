// 渲染全局导航菜单按钮（弹出式子菜单）
(function() {
  // 判断是否登录（检查nascore_jwt_refresh_token_expires是否存在且未过期）
  function isLoggedIn() {
    var expires = localStorage.getItem('nascore_jwt_refresh_token_expires')
    if (!expires) return false
    var now = Math.floor(Date.now() / 1000)
    if (parseInt(expires, 10) < now) return false
    return true
  }

  // 创建主菜单按钮（三条横线）
  function createMenuButton() {
    var btn = document.createElement('button')
    btn.id = 'global-nav-menu-main-btn'
    btn.className = 'bg-[#222] hover:bg-[#333] border border-[#333] hover:border-white rounded-lg px-3 py-1.5 transition-colors flex items-center text-white text-sm ml-2'
    btn.style.display = 'flex'
    btn.style.alignItems = 'center'
    btn.style.justifyContent = 'center'
    btn.style.position = 'relative'
    btn.innerHTML = `
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:block;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    `
    return btn
  }

  // 创建弹出菜单
  function createDropdownMenu(navData) {
    var menu = document.createElement('div')
    menu.id = 'global-nav-menu-dropdown'
    menu.style.position = 'absolute'
    menu.style.top = '110%'
    menu.style.right = '0'
    menu.style.minWidth = '140px'
    menu.style.background = '#222'
    menu.style.border = '1px solid #333'
    menu.style.borderRadius = '0.5rem'
    menu.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'
    menu.style.zIndex = '10001'
    menu.style.padding = '0.5rem 0'
    menu.style.display = 'flex'
    menu.style.flexDirection = 'column'
    menu.style.gap = '0.25rem'
    menu.tabIndex = -1
    navData.forEach(function(item) {
      if (item.onlyWhenLogin && !isLoggedIn()) return
      if (item.onlyWhenNotLogin && isLoggedIn()) return
      var btn = document.createElement('button')
      btn.className = 'w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center text-white text-sm bg-transparent border-0 outline-none'
      btn.style.background = 'none'
      btn.style.border = 'none'
      btn.style.cursor = 'pointer'
      btn.innerHTML = (item.icon ? '<span class="mr-1">' + item.icon + '</span>' : '') + item.name
      btn.onclick = function(e) {
        e.stopPropagation()
        closeDropdownMenu()
        if (item.key === 'login') {
          window.location.href = item.url
        } else if (item.key === 'logout') {
          if (typeof window.logoutAndRedirect === 'function') {
            window.logoutAndRedirect()
          } else {
            window.location.reload()
          }
        } else {
          window.open(item.url, '_self')
        }
      }
      menu.appendChild(btn)
    })
    return menu
  }

  // 关闭菜单
  function closeDropdownMenu() {
    var menu = document.getElementById('global-nav-menu-dropdown')
    if (menu && menu.parentNode) menu.parentNode.removeChild(menu)
    document.removeEventListener('mousedown', handleClickOutside)
  }

  // 点击空白处关闭
  function handleClickOutside(e) {
    var menu = document.getElementById('global-nav-menu-dropdown')
    var mainBtn = document.getElementById('global-nav-menu-main-btn')
    if (!menu) return
    if (menu.contains(e.target) || mainBtn.contains(e.target)) return
    closeDropdownMenu()
  }

  // 渲染主菜单按钮和弹出菜单
  function renderNavMenu() {
    var navData = window.GlobalNavMenu || []
    var navLogin = document.getElementById('nav_login')
    if (!navLogin) return
    navLogin.innerHTML = ''
    var menuBtn = createMenuButton()
    menuBtn.onclick = function(e) {
      e.stopPropagation()
      // 已有则关闭
      var oldMenu = document.getElementById('global-nav-menu-dropdown')
      if (oldMenu) {
        closeDropdownMenu()
        return
      }
      // 创建并显示菜单
      var dropdown = createDropdownMenu(navData)
      menuBtn.parentNode.appendChild(dropdown)
      // 自动聚焦，便于键盘操作
      dropdown.focus()
      // 点击空白关闭
      setTimeout(function() {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }
    navLogin.appendChild(menuBtn)
  }

  // 等待window.GlobalNavMenu加载
  function waitForNavData(cb) {
    if (window.GlobalNavMenu) return cb()
    var timer = setInterval(function() {
      if (window.GlobalNavMenu) {
        clearInterval(timer)
        cb()
      }
    }, 50)
  }

  waitForNavData(renderNavMenu)
  window.renderNavMenu = renderNavMenu
})(); 