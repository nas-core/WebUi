// 主应用程序
class App {
  constructor() {
    this.user = null
    this.isAdmin = false
    this.isLoggedIn = false
    this.isEditMode = false
    this.categories = []
    this.links = []
    this.filteredLinks = []
    this.selectedCategoryId = 0
    this.searchQuery = ''
    this.globalNavMenu = [] // 新增属性
    // DOM元素
    this.elements = {
      userInfo: null,
      menuBtn: null,
      dropdownMenu: null,
      searchInput: null,
      categoriesContainer: null,
      linksContainer: null,
      emptyState: null,
      editModeIndicator: null,
      editModeBtn: null,
      addCategoryBtn: null,
      addLinkBtn: null,
      // this.elements.logoutBtn = document.getElementById('logout-btn') // 删除
      // this.elements.loginBtn = document.getElementById('login-btn') // 删除
      loggedInMenu: null, // 不再需要
      notLoggedInMenu: null // 不再需要
    }
    // 拖拽相关
    this.dragState = {
      isDragging: false,
      dragElement: null,
      dragType: null, // 'category' or 'link'
      startX: 0,
      startY: 0,
      placeholder: null,
    }
  }

  // 初始化应用
  async init() {
    console.log('[links] 初始化应用')

    try {
      this.initElements()
      this.initEventListeners()
      await this.loadGlobalNavMenu() // 新增：加载全局菜单
      await this.checkAuth()

      // 无论是否登录，都尝试加载数据
      try {
        await this.loadData()
        this.render()
      } catch (error) {
        console.error('[links] 数据加载失败:', error)
        if (this.isLoggedIn) {
          // 已登录用户数据加载失败，显示登录要求
          if (error.message.includes('登录已过期') || error.message.includes('未登录')) {
            await this.showLoginRequired()
          } else {
            this.showError('数据加载失败: ' + error.message)
          }
        } else {
          // 未登录用户数据加载失败，显示错误信息但不强制登录
          this.showError('加载公开内容失败: ' + error.message)
        }
      }
    } catch (error) {
      console.error('[links] 初始化失败:', error)
      this.showError('应用初始化失败: ' + error.message)
    }
  }

  // 初始化DOM元素
  initElements() {
    this.elements.userInfo = document.getElementById('user-info')
    this.elements.menuBtn = document.getElementById('menu-btn')
    this.elements.dropdownMenu = document.getElementById('dropdown-menu')
    this.elements.searchInput = document.getElementById('search-input')
    this.elements.categoriesContainer = document.getElementById('categories-container')
    this.elements.linksContainer = document.getElementById('links-container')
    this.elements.emptyState = document.getElementById('empty-state')
    this.elements.editModeIndicator = document.getElementById('edit-mode-indicator')
    this.elements.enterEditModeBtn = document.getElementById('enter-edit-mode-btn')
    this.elements.exitEditModeBtn = document.getElementById('exit-edit-mode-btn')
    // 删除原有的addCategoryBtn、addLinkBtn、logoutBtn、loginBtn、loggedInMenu、notLoggedInMenu的获取
  }

  // 初始化事件监听器
  initEventListeners() {
    // 菜单按钮
    this.elements.menuBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleDropdownMenu()
    })

    // 点击外部关闭下拉菜单
    document.addEventListener('click', () => {
      this.hideDropdownMenu()
    })

    // 搜索功能
    this.elements.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase()
      this.filterAndRenderLinks()
    })

    // 菜单项点击事件
    this.elements.enterEditModeBtn.addEventListener('click', () => {
      this.toggleEditMode()
    })

    this.elements.exitEditModeBtn.addEventListener('click', () => {
      this.toggleEditMode()
    })

    // 拖拽相关事件
    this.initDragEvents()
  }

  // 初始化拖拽事件
  initDragEvents() {
    // 鼠标事件
    document.addEventListener('mousedown', (e) => this.handleDragStart(e))
    document.addEventListener('mousemove', (e) => this.handleDragMove(e))
    document.addEventListener('mouseup', (e) => this.handleDragEnd(e))

    // 触摸事件（移动端）
    document.addEventListener('touchstart', (e) => this.handleDragStart(e), {
      passive: false,
    })
    document.addEventListener('touchmove', (e) => this.handleDragMove(e), {
      passive: false,
    })
    document.addEventListener('touchend', (e) => this.handleDragEnd(e))
  }

  // 拖拽开始
  handleDragStart(e) {
    if (!this.isEditMode) return

    // 检查是否点击了拖拽按钮
    const dragButton = e.target.closest('[data-drag-button="true"]')
    if (!dragButton) return

    const target = e.target.closest('.category-tag[data-category-id]:not([data-category-id="0"]), .link-card[data-link-id]')
    if (!target) return

    e.preventDefault()

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    this.dragState.isDragging = true
    this.dragState.dragElement = target
    this.dragState.startX = clientX
    this.dragState.startY = clientY
    this.dragState.dragType = target.classList.contains('category-tag') ? 'category' : 'link'

    // 添加拖拽样式
    target.classList.add('dragging', 'no-select')
    target.style.zIndex = '1000'
    target.style.opacity = '0.8'

    // 创建占位符
    this.createPlaceholder(target)
  }

  // 拖拽移动
  handleDragMove(e) {
    if (!this.dragState.isDragging) return

    e.preventDefault()

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    const deltaX = clientX - this.dragState.startX
    const deltaY = clientY - this.dragState.startY

    // 移动拖拽元素
    this.dragState.dragElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`

    // 查找拖拽目标
    const target = this.findDropTarget(clientX, clientY)
    if (target) {
      // 存储当前事件信息用于占位符更新
      this.currentEvent = e
      this.updatePlaceholder(target)
    }
  }

  // 拖拽结束
  async handleDragEnd(e) {
    if (!this.dragState.isDragging) return

    const dragElement = this.dragState.dragElement
    const placeholder = this.dragState.placeholder

    // 重置拖拽元素样式
    dragElement.classList.remove('dragging', 'no-select')
    dragElement.style.transform = ''
    dragElement.style.zIndex = ''
    dragElement.style.opacity = ''

    // 如果有占位符，进行排序更新
    if (placeholder && placeholder.parentNode) {
      const container = placeholder.parentNode
      const allElements = Array.from(container.children).filter(
        (el) =>
          !el.classList.contains('drag-placeholder') &&
          !el.classList.contains('dragging') &&
          (this.dragState.dragType === 'category'
            ? el.hasAttribute('data-category-id') && el.getAttribute('data-category-id') !== '0'
            : el.hasAttribute('data-link-id'))
      )

      const placeholderIndex = Array.from(container.children).indexOf(placeholder)
      const dragElementIndex = Array.from(container.children).indexOf(dragElement)

      if (placeholderIndex !== dragElementIndex) {
        // 移动元素到占位符位置
        if (placeholderIndex < dragElementIndex) {
          container.insertBefore(dragElement, placeholder)
        } else {
          container.insertBefore(dragElement, placeholder.nextSibling)
        }

        try {
          if (this.dragState.dragType === 'category') {
            await this.updateCategoriesSort()
          } else {
            await this.updateLinksSort()
          }
          console.log(`[links] ${this.dragState.dragType}排序更新成功`)
          this.showSuccess('排序更新成功')
        } catch (error) {
          console.error(`[links] ${this.dragState.dragType}排序更新失败:`, error)
          this.showError('排序更新失败: ' + error.message)
          // 恢复原始渲染
          this.render()
        }
      }

      // 移除占位符
      placeholder.remove()
    }

    // 重置拖拽状态
    this.dragState = {
      isDragging: false,
      dragElement: null,
      dragType: null,
      startX: 0,
      startY: 0,
      placeholder: null,
    }
  }

  // 创建占位符
  createPlaceholder(element) {
    const placeholder = element.cloneNode(true)
    placeholder.style.opacity = '0.3'
    placeholder.style.pointerEvents = 'none'
    placeholder.classList.add('drag-placeholder')

    element.parentNode.insertBefore(placeholder, element.nextSibling)
    this.dragState.placeholder = placeholder
  }

  // 更新占位符位置
  updatePlaceholder(target) {
    if (!this.dragState.placeholder) return

    const placeholder = this.dragState.placeholder
    const container = this.dragState.dragType === 'category' ? this.elements.categoriesContainer : this.elements.linksContainer

    // 移除当前占位符
    if (placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder)
    }

    // 在目标位置插入占位符
    const rect = target.getBoundingClientRect()
    const clientX = this.currentEvent.clientX || (this.currentEvent.touches && this.currentEvent.touches[0].clientX)
    const clientY = this.currentEvent.clientY || (this.currentEvent.touches && this.currentEvent.touches[0].clientY)

    if (this.dragState.dragType === 'category') {
      // 分类是水平排列
      const centerX = rect.left + rect.width / 2

      if (clientX < centerX) {
        target.parentNode.insertBefore(placeholder, target)
      } else {
        target.parentNode.insertBefore(placeholder, target.nextSibling)
      }
    } else {
      // 链接是垂直排列
      const centerY = rect.top + rect.height / 2

      if (clientY < centerY) {
        target.parentNode.insertBefore(placeholder, target)
      } else {
        target.parentNode.insertBefore(placeholder, target.nextSibling)
      }
    }
  }

  // 查找拖拽目标
  findDropTarget(clientX, clientY) {
    const container = this.dragState.dragType === 'category' ? this.elements.categoriesContainer : this.elements.linksContainer

    const selector =
      this.dragState.dragType === 'category'
        ? '.category-tag[data-category-id]:not([data-category-id="0"]):not(.dragging):not(.drag-placeholder)'
        : '.link-card[data-link-id]:not(.dragging):not(.drag-placeholder)'

    const elements = container.querySelectorAll(selector)

    let closestElement = null
    let closestDistance = Infinity

    for (let element of elements) {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distance = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2))

      if (distance < closestDistance) {
        closestDistance = distance
        closestElement = element
      }
    }

    return closestElement
  }

  // 获取元素索引
  getElementIndex(element) {
    const container = element.parentNode
    const children = Array.from(container.children)
    return children.indexOf(element)
  }

  // 检查用户认证状态
  async checkAuth() {
    // 调试信息
    console.log('[links] 检查认证状态...')
    console.log('[links] access_token:', localStorage.getItem('nascore_jwt_access_token') ? '存在' : '不存在')
    console.log('[links] refresh_token:', localStorage.getItem('nascore_jwt_refresh_token') ? '存在' : '不存在')

    const userInfo = window.api.getUserInfo()
    if (userInfo) {
      this.user = userInfo.username
      this.isAdmin = userInfo.isAdmin
      this.isLoggedIn = true
      this.updateUserInfo()
      this.renderDropdownMenu() // 新增
      console.log('[links] 用户认证成功:', this.user, this.isAdmin ? '管理员' : '普通用户', 'token过期时间:', new Date(userInfo.exp * 1000))
    } else {
      this.isLoggedIn = false
      this.updateUserInfo()
      this.renderDropdownMenu() // 新增
      console.log('[links] 用户未登录或token已过期')
    }
  }

  // 更新用户信息显示
  updateUserInfo() {
    if (this.isLoggedIn) {
      const adminBadge = this.isAdmin
        ? '<span class="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">管理员</span>'
        : '<span class="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">普通用户</span>'

      this.elements.userInfo.innerHTML = `
        <span class="text-gray-300">欢迎, ${this.user}</span>
        ${adminBadge}
      `
    } else {
      this.elements.userInfo.innerHTML = '<span class="text-gray-400">浏览公开内容</span>'
    }
  }

  // 显示登录要求或公共内容
  async showLoginRequired() {
    console.log('[links] 显示公共内容或登录要求')

    // 尝试加载公共内容
    try {
      const [publicCategories, publicLinks] = await Promise.all([
        window.api.getCategories(true), // 获取公共分类
        window.api.getLinks(true), // 获取公共链接
      ])

      this.categories = publicCategories || []
      this.links = publicLinks || []

      if (this.categories.length > 0 || this.links.length > 0) {
        console.log('[links] 加载公共内容成功')
        this.render()
        // 添加登录提示
        this.showPublicModeNotice()
        return
      }
    } catch (error) {
      console.error('[links] 加载公共内容失败:', error)
    }

    // 如果没有公共内容，显示登录要求
    this.elements.linksContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <svg class="mx-auto w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 2h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <p class="text-gray-400 text-lg mb-4">需要登录才能访问</p>
        <button onclick="window.api.redirectToLogin()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          前往登录
        </button>
      </div>
    `
    this.elements.emptyState.classList.add('hidden')
    this.elements.categoriesContainer.innerHTML = '<div class="text-gray-500 text-sm">请先登录</div>'
  }

  // 加载数据
  async loadData() {
    try {
      this.showLoading(true)

      console.log('[links] 开始加载数据...')

      // 根据登录状态加载不同的数据
      if (window.api.isLoggedIn()) {
        // 已登录用户：加载所有数据
        const [categories, links] = await Promise.all([window.api.getCategories(), window.api.getLinks()])
        this.categories = Array.isArray(categories) ? categories : []
        this.links = Array.isArray(links) ? links : []
      } else {
        // 未登录用户：只加载公开数据
        const [categories, links] = await Promise.all([
          window.api.getCategories(true), // 只获取公开分类
          window.api.getLinks(true), // 只获取公开链接
        ])
        this.categories = Array.isArray(categories) ? categories : []
        this.links = Array.isArray(links) ? links : []
      }

      console.log('[links] 数据加载完成', {
        categories: this.categories.length,
        links: this.links.length,
        isLoggedIn: window.api.isLoggedIn(),
      })
    } catch (error) {
      console.error('[links] 加载数据失败:', error)
      this.showError('加载数据失败: ' + error.message)
      if (window.api.isLoggedIn()) {
        this.showLoginRequired()
      }
    } finally {
      this.showLoading(false)
    }
  }

  // 渲染所有内容
  render() {
    this.renderCategories()
    this.filterAndRenderLinks()
    this.updateEditModeUI() // 确保编辑模式UI状态正确
  }

  // 渲染分类列表
  renderCategories() {
    if (!this.categories.length) {
      this.elements.categoriesContainer.innerHTML = `
        <div class="text-gray-500 text-sm">
          暂无分类
        </div>
      `
      return
    }

    // 按排序值排序
    const sortedCategories = [...this.categories].sort((a, b) => b.sort_num - a.sort_num)

    // 添加"全部"分类
    const allCategoryClass = this.selectedCategoryId === 0 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'

    let categoriesHTML = `
      <button
        class="category-tag px-3 py-1 rounded-full text-sm transition-colors ${allCategoryClass}"
        data-category-id="0"
        onclick="window.app.selectCategory(0)"
      >
        全部
      </button>
    `

    sortedCategories.forEach((category) => {
      const isSelected = this.selectedCategoryId === category.id
      const categoryClass = isSelected ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'

      const editModeClass = this.isEditMode ? 'edit-mode ' : ''
      const publicBadge = category.is_public ? '<span class="ml-1 text-xs">🌍</span>' : '<span class="ml-1 text-xs">🔒</span>'

      categoriesHTML += `
        <button
          class="category-tag ${categoryClass} ${editModeClass} px-3 py-1 rounded-full text-sm transition-colors relative"
          data-category-id="${category.id}"
          onclick="window.app.handleCategoryClick(${category.id})"
        >
          <div class="category-content">
            ${category.name}${publicBadge}
          </div>
          ${this.isEditMode ? '<div class="edit-overlay"><button class="drag-btn mr-2 p-1 hover:bg-gray-600 rounded" data-drag-button="true"><svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg></button><span class="text-white text-xs">编辑</span></div>' : ''}
        </button>
      `
    })

    this.elements.categoriesContainer.innerHTML = categoriesHTML
  }

  // 过滤并渲染链接
  filterAndRenderLinks() {
    // 确保links是数组
    if (!Array.isArray(this.links)) {
      this.links = []
    }

    // 过滤链接
    this.filteredLinks = this.links.filter((link) => {
      // 分类过滤
      const categoryMatch = this.selectedCategoryId === 0 || link.category_id === this.selectedCategoryId

      // 搜索过滤
      const searchMatch =
        !this.searchQuery ||
        link.title.toLowerCase().includes(this.searchQuery) ||
        link.url.toLowerCase().includes(this.searchQuery) ||
        link.description.toLowerCase().includes(this.searchQuery)

      return categoryMatch && searchMatch
    })

    this.renderLinks()
  }

  // 渲染链接列表
  renderLinks() {
    if (!this.filteredLinks.length) {
      this.elements.linksContainer.innerHTML = ''
      this.elements.emptyState.classList.remove('hidden')
      return
    }

    this.elements.emptyState.classList.add('hidden')

    // 按排序值排序
    const sortedLinks = [...this.filteredLinks].sort((a, b) => b.sort_num - a.sort_num)

    const linksHTML = sortedLinks
      .map((link) => {
        const editModeClass = this.isEditMode ? 'edit-mode ' : ''
        const publicBadge = link.is_public ? '' : '<span class="text-gray-400 text-xs">🔒</span>'

        // 创建简单的favicon占位符
        const favicon = `
        <div class="w-8 h-8 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
        </div>
      `

        return `
        <div
          class="link-card ${editModeClass} bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors  relative"
          data-link-id="${link.id}"
          onclick="window.app.handleLinkClick(${link.id})"
        >
          <div class="link-content">
            <div class="flex items-start space-x-3">
              ${favicon}
              <div class="flex-1 min-w-0">
                <h3 class="text-gray-100 font-medium truncate">${link.title}</h3>
                <p class="text-gray-400 text-sm truncate mt-1">${link.url}</p>
                ${link.description ? `<p class="text-gray-500 text-xs mt-2 line-clamp-2">${link.description}</p>` : ''}
              </div>
              <div class="flex items-center space-x-2 flex-shrink-0">
                ${publicBadge}
                ${this.isEditMode ? '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>' : ''}
              </div>
            </div>
          </div>
          ${this.isEditMode ? '<div class="edit-overlay"><button class="drag-btn mr-2 p-1 hover:bg-gray-600 rounded" data-drag-button="true"><svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg></button><span class="text-white text-sm">编辑</span></div>' : ''}
        </div>
      `
      })
      .join('')

    this.elements.linksContainer.innerHTML = linksHTML
  }

  // 更新分类排序
  async updateCategoriesSort() {
    const categoryElements = this.elements.categoriesContainer.querySelectorAll(
      '.category-tag[data-category-id]:not([data-category-id="0"]):not(.drag-placeholder)'
    )
    const sortData = Array.from(categoryElements).map((element, index) => ({
      id: parseInt(element.dataset.categoryId),
      sort_num: categoryElements.length - index, // 越靠前排序值越大
    }))

    if (sortData.length > 0) {
      await window.api.updateCategoriesSort(sortData)

      // 更新本地数据
      sortData.forEach((item) => {
        const category = this.categories.find((c) => c.id === item.id)
        if (category) {
          category.sort_num = item.sort_num
        }
      })
    }
  }

  // 更新链接排序
  async updateLinksSort() {
    const linkElements = this.elements.linksContainer.querySelectorAll('.link-card[data-link-id]:not(.drag-placeholder)')
    const sortData = Array.from(linkElements).map((element, index) => ({
      id: parseInt(element.dataset.linkId),
      sort_num: linkElements.length - index, // 越靠前排序值越大
    }))

    if (sortData.length > 0) {
      await window.api.updateLinksSort(sortData)

      // 更新本地数据
      sortData.forEach((item) => {
        const link = this.links.find((l) => l.id === item.id)
        if (link) {
          link.sort_num = item.sort_num
        }
      })
    }
  }

  // 选择分类
  selectCategory(categoryId) {
    if (this.isEditMode) return // 编辑模式下不响应分类选择

    this.selectedCategoryId = categoryId
    this.renderCategories()
    this.filterAndRenderLinks()
  }

  // 处理分类点击
  handleCategoryClick(categoryId) {
    if (this.isEditMode && this.isLoggedIn) {
      // 防止在拖拽时触发编辑，也要防止点击拖拽句柄时触发编辑
      if (!this.dragState.isDragging && !event.target.closest('[data-drag-button="true"]')) {
        this.showEditCategoryModal(categoryId)
      }
    } else {
      this.selectCategory(categoryId)
    }
  }

  // 处理链接点击
  handleLinkClick(linkId) {
    if (this.isEditMode && this.isLoggedIn) {
      // 防止在拖拽时触发编辑，也要防止点击拖拽句柄时触发编辑
      if (!this.dragState.isDragging && !event.target.closest('[data-drag-button="true"]')) {
        this.showEditLinkModal(linkId)
      }
    } else {
      const link = this.links.find((l) => l.id === linkId)
      if (link) {
        window.open(link.url, '_blank')
      }
    }
  }
  // 切换编辑模式
  toggleEditMode() {
    if (!this.isLoggedIn) {
      this.showError('请先登录才能进入编辑模式')
      return
    }
    this.isEditMode = !this.isEditMode
    this.updateEditModeUI()
    this.render()
  }

  // 更新编辑模式UI
  updateEditModeUI() {
    const body = document.body
    const editModeIndicator = this.elements.editModeIndicator
    const enterEditModeBtn = this.elements.enterEditModeBtn
    const exitEditModeBtn = this.elements.exitEditModeBtn
    if (!this.isLoggedIn) {
      editModeIndicator.classList.add('hidden')
      enterEditModeBtn.classList.add('hidden')
      exitEditModeBtn.classList.add('hidden')
      body.classList.remove('edit-mode')
      this.isEditMode = false
      this.renderDropdownMenu() // 新增
      return
    }
    if (this.isLoggedIn) {
      this.renderDropdownMenu() // 新增
    }
    if (this.isEditMode) {
      body.classList.add('edit-mode')
      editModeIndicator.classList.remove('hidden')
      enterEditModeBtn.classList.add('hidden')
      exitEditModeBtn.classList.remove('hidden')
    } else {
      body.classList.remove('edit-mode')
      editModeIndicator.classList.add('hidden')
      enterEditModeBtn.classList.remove('hidden')
      exitEditModeBtn.classList.add('hidden')
    }
  }

  // 显示添加分类模态框
  showAddCategoryModal() {
    if (!this.isLoggedIn) {
      this.showError('请先登录才能添加分类')
      return
    }
    window.modal.showCategoryEditor(null, async (categoryData) => {
      try {
        const newCategory = await window.api.addCategory(categoryData)
        this.categories.push(newCategory)
        this.renderCategories()
        this.showSuccess('分类添加成功')
        console.log('[links] 分类添加成功:', newCategory)
      } catch (error) {
        console.error('[links] 分类添加失败:', error)
        throw error
      }
    })
  }

  // 显示编辑分类模态框
  showEditCategoryModal(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId)
    if (!category) return

    window.modal.showCategoryEditor(category, async (categoryData) => {
      try {
        const updatedCategory = await window.api.updateCategory(categoryData)
        const index = this.categories.findIndex((c) => c.id === categoryId)
        if (index !== -1) {
          this.categories[index] = updatedCategory
        }
        this.renderCategories()
        this.showSuccess('分类更新成功')
        console.log('[links] 分类更新成功:', updatedCategory)
      } catch (error) {
        console.error('[links] 分类更新失败:', error)
        throw error
      }
    })
  }

  // 显示添加链接模态框
  showAddLinkModal() {
    if (!this.isLoggedIn) {
      this.showError('请先登录才能添加链接')
      return
    }
    window.modal.showLinkEditor(null, this.categories, async (linkData) => {
      try {
        const newLink = await window.api.addLink(linkData)
        this.links.push(newLink)
        this.filterAndRenderLinks()
        this.showSuccess('链接添加成功')
        console.log('[links] 链接添加成功:', newLink)
      } catch (error) {
        console.error('[links] 链接添加失败:', error)
        throw error
      }
    })
  }

  // 显示编辑链接模态框
  showEditLinkModal(linkId) {
    const link = this.links.find((l) => l.id === linkId)
    if (!link) return

    window.modal.showLinkEditor(link, this.categories, async (linkData) => {
      try {
        const updatedLink = await window.api.updateLink(linkData)
        const index = this.links.findIndex((l) => l.id === linkId)
        if (index !== -1) {
          this.links[index] = updatedLink
        }
        this.filterAndRenderLinks()
        this.showSuccess('链接更新成功')
        console.log('[links] 链接更新成功:', updatedLink)
      } catch (error) {
        console.error('[links] 链接更新失败:', error)
        throw error
      }
    })
  }

  // 切换下拉菜单
  toggleDropdownMenu() {
    this.elements.dropdownMenu.classList.toggle('hidden')
  }

  // 隐藏下拉菜单
  hideDropdownMenu() {
    this.elements.dropdownMenu.classList.add('hidden')
  }

  // 显示/隐藏加载状态
  showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay')
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none'
    }
  }

  // 显示错误信息
  showError(message) {
    this.showToast(message, 'error')
  }

  // 显示成功信息
  showSuccess(message) {
    this.showToast(message, 'success')
  }

  // 显示公共模式提示
  showPublicModeNotice() {
    const notice = document.createElement('div')
    notice.className = 'mb-4 p-3 bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg'
    notice.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-yellow-300 text-sm">当前浏览公共内容，<a href="javascript:void(0)" onclick="window.api.redirectToLogin()" class="text-yellow-200 underline hover:text-yellow-100">登录</a>查看更多内容</span>
      </div>
    `

    const main = document.querySelector('main')
    const searchDiv = document.getElementById('search-input').parentElement
    main.insertBefore(notice, searchDiv.nextSibling)
  }

  // 显示提示消息
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container')
    if (!container) return

    const toast = document.createElement('div')
    toast.className = `toast p-4 rounded-lg shadow-lg text-white max-w-sm fade-in ${
      type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'
    }`

    const iconMap = {
      error: '❌',
      success: '✅',
      info: 'ℹ️',
    }

    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-lg">${iconMap[type]}</span>
        <span class="flex-1">${message}</span>
        <button class="ml-2 text-white hover:text-gray-200 focus:outline-none" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `

    container.appendChild(toast)

    // 自动移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0'
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast)
          }
        }, 300)
      }
    }, 5000)
  }

  // 加载全局导航菜单
  async loadGlobalNavMenu() {
    // 等待 window.GlobalNavMenu 加载
    if (!window.GlobalNavMenu) {
      await new Promise(resolve => {
        const check = () => {
          if (window.GlobalNavMenu) resolve()
          else setTimeout(check, 50)
        }
        check()
      })
    }
    this.globalNavMenu = window.GlobalNavMenu || []
  }

  // 渲染下拉菜单
  renderDropdownMenu() {
    const menu = this.elements.dropdownMenu
    if (!menu) return
    let html = '<div class="py-2">'
    // 登录后显示添加分类/链接
    if (this.isLoggedIn) {
      html += `
        <button id="add-category-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center space-x-2">
          <span>添加分类</span>
        </button>
        <button id="add-link-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center space-x-2">
          <span>添加链接</span>
        </button>
        <hr class="my-2 border-gray-700" />
      `
    }
    // 渲染 GlobalNavMenu
    this.globalNavMenu.forEach(item => {
      if (item.onlyWhenLogin && !this.isLoggedIn) return
      if (item.onlyWhenNotLogin && this.isLoggedIn) return
      html += `
        <button class="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center space-x-2"
          data-nav-key="${item.key}">
          <span>${item.name}</span>
        </button>
      `
    })
    html += '</div>'
    menu.innerHTML = html
    // 重新绑定事件
    if (this.isLoggedIn) {
      const addCategoryBtn = document.getElementById('add-category-btn')
      const addLinkBtn = document.getElementById('add-link-btn')
      addCategoryBtn?.addEventListener('click', () => {
        this.showAddCategoryModal()
        this.hideDropdownMenu()
      })
      addLinkBtn?.addEventListener('click', () => {
        this.showAddLinkModal()
        this.hideDropdownMenu()
      })
    }
    // 绑定 GlobalNavMenu 按钮事件
    this.globalNavMenu.forEach(item => {
      if (item.onlyWhenLogin && !this.isLoggedIn) return
      if (item.onlyWhenNotLogin && this.isLoggedIn) return
      const btn = menu.querySelector(`[data-nav-key="${item.key}"]`)
      if (!btn) return
      if (item.key === 'login') {
        btn.addEventListener('click', () => window.api.redirectToLogin())
      } else if (item.key === 'logout') {
        btn.addEventListener('click', () => window.api.redirectToLoginOut())
      } else {
        btn.addEventListener('click', () => window.open(item.url, '_self'))
      }
    })
  }

  // 清理资源
  destroy() {
    // 清理事件监听器
    Object.values(this.elements).forEach((element) => {
      if (element && element.removeEventListener) {
        element.removeEventListener()
      }
    })
  }
}

// 创建全局应用实例
window.app = new App()

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app.init()
})

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  window.app.destroy()
})
