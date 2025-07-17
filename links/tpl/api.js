// API 处理模块
class API {
  constructor() {
    this.baseUrl = '/@links'
  }

  // 获取JWT令牌
  getAccessToken() {
    return localStorage.getItem('nascore_jwt_access_token') || ''
  }

  // 获取当前用户信息
  getUserInfo() {
    // 检查access token
    const accessToken = this.getAccessToken()
    if (!accessToken) {
      console.log('[links] 没有access token')
      return null
    }

    const refreshToken = localStorage.getItem('nascore_jwt_refresh_token')
    if (!refreshToken) {
      console.log('[links] 没有refresh token')
      this.clearToken()
      return null
    }

    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)

      // 检查token是否过期
      if (payload.exp && payload.exp < now) {
        console.error('[links] Token已过期:', new Date(payload.exp * 1000))
        return null
      }

      return {
        username: (payload.username || '').toLowerCase(),
        isAdmin: payload.IsAdmin || false,
        exp: payload.exp,
      }
    } catch (e) {
      console.error('[links] 解析用户信息失败:', e)
      return null
    }
  }

  // 检查是否已登录
  isLoggedIn() {
    return this.getUserInfo() !== null
  }

  // 通用请求方法
  async request(url, options = {}) {
    const fullUrl = this.baseUrl + url

    // 设置默认headers
    options.headers = options.headers || {}
    const token = this.getAccessToken()
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token
    }

    console.log('请求地址', url)

    if (options.method && options.method !== 'GET' && options.body && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json'
    }

    try {
      console.log('[links] 发送请求:', fullUrl, options)
      const response = await fetch(fullUrl, options)
      console.log('[links] 响应状态:', response.status, response.statusText)

      // 处理401未授权错误
      if (response.status === 401) {
        console.log('[links] 401未授权，重定向到登录页')
        this.redirectToLogin()
        throw new Error('未登录或登录已过期')
      }

      // 处理其他HTTP错误
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[links] HTTP错误:', response.status, errorText)
        throw new Error(errorText || `请求失败，状态码: ${response.status}`)
      }

      // 处理响应
      const text = await response.text()
      console.log('[links] 响应内容:', text.substring(0, 200))

      if (!text) {
        console.log('[links] 空响应，返回空数组')
        return []
      }

      // 检查是否返回的是HTML（通常是登录页面）
      if (text.trim().startsWith('<') || text.includes('<script>') || text.includes('<html>')) {
        console.error('[links] 收到HTML响应，可能是登录页面:', text.substring(0, 100))
        throw new Error('需要登录访问')
      }

      try {
        const result = JSON.parse(text)
        console.log('[links] JSON解析成功:', result)
        return result
      } catch (e) {
        console.error('[links] JSON解析失败:', e, '原始响应:', text.substring(0, 200))
        throw new Error('服务器响应格式错误')
      }
    } catch (error) {
      console.error('[links] API请求失败:', error)
      throw error
    }
  }

  // 重定向到登录页面
  redirectToLogin() {
    const currentUrl = window.location.pathname + window.location.search
    const loginUrl = window.NASCORE_WEBUI_PREFIX + '/login.shtml?redirect=' + encodeURIComponent(currentUrl)
    window.location.href = loginUrl
  }

  redirectToLoginOut() {
    const currentUrl = window.location.pathname + window.location.search
    const loginUrl = window.NASCORE_WEBUI_PREFIX + '/loginOut.shtml?redirect=' + encodeURIComponent(currentUrl)
    window.location.href = loginUrl
  }

  // ===== 分类相关API =====

  // 获取分类列表
  async getCategories(publicOnly = false) {
    try {
      const url = publicOnly ? '/api/categories?public=1' : '/api/categories'
      console.log('[links] 获取分类:', url, 'publicOnly:', publicOnly)
      const result = await this.request(url, { method: 'GET' })
      console.log('[links] 分类结果:', result)
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('[links] 获取分类失败:', error)
      return []
    }
  }

  // 添加分类
  async addCategory(category) {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    })
  }

  // 更新分类
  async updateCategory(category) {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    })
  }

  // 删除分类
  async deleteCategory(id) {
    return this.request(`/api/categories?id=${id}`, { method: 'DELETE' })
  }

  // 批量更新分类排序
  async updateCategoriesSort(sortData) {
    return this.request('/api/categories/sort', {
      method: 'PATCH',
      body: JSON.stringify(sortData),
    })
  }

  // ===== 链接相关API =====

  // 获取链接列表
  async getLinks(publicOnly = false, categoryId = 0) {
    try {
      const params = new URLSearchParams()
      if (publicOnly) params.append('public', '1')
      if (categoryId > 0) params.append('category_id', categoryId)

      const url = `/api/links${params.toString() ? '?' + params.toString() : ''}`
      console.log('[links] 获取链接:', url, 'publicOnly:', publicOnly, 'categoryId:', categoryId)
      const result = await this.request(url, { method: 'GET' })
      console.log('[links] 链接结果:', result)
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('[links] 获取链接失败:', error)
      return []
    }
  }

  // 添加链接
  async addLink(link) {
    return this.request('/api/link', {
      method: 'POST',
      body: JSON.stringify(link),
    })
  }

  // 更新链接
  async updateLink(link) {
    return this.request('/api/link', {
      method: 'POST',
      body: JSON.stringify(link),
    })
  }

  // 删除链接
  async deleteLink(id) {
    return this.request(`/api/link?id=${id}`, { method: 'DELETE' })
  }

  // 批量更新链接排序
  async updateLinksSort(sortData) {
    return this.request('/api/links/sort', {
      method: 'PATCH',
      body: JSON.stringify(sortData),
    })
  }
}

// 创建全局API实例
window.api = new API()
