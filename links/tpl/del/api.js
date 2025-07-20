// api.js - 原生JS API通信模块，结构简洁
class API {
  constructor() {
    this.baseUrl = '/@links';
  }
  getAccessToken() {
    return localStorage.getItem('nascore_jwt_access_token') || '';
  }
  getRefreshToken() {
    return localStorage.getItem('nascore_jwt_refresh_token') || '';
  }
  getUserInfo() {
    const token = this.getRefreshToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) return null;
      return {
        username: (payload.username || '').toLowerCase(),
        isAdmin: payload.IsAdmin || false,
        exp: payload.exp,
      };
    } catch {
      return null;
    }
  }
  isLoggedIn() {
    return !!this.getAccessToken() && !!this.getRefreshToken() && !!this.getUserInfo();
  }
  async request(url, options = {}) {
    const fullUrl = this.baseUrl + url;
    options.headers = options.headers || {};
    const token = this.getAccessToken();
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    if (options.method && options.method !== 'GET' && options.body && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }
    const resp = await fetch(fullUrl, options);
    if (resp.status === 401) throw new Error('未登录或登录已过期');
    if (!resp.ok) throw new Error(await resp.text() || `请求失败: ${resp.status}`);
    const text = await resp.text();
    if (!text) return [];
    if (text.trim().startsWith('<')) throw new Error('需要登录访问');
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('服务器响应格式错误');
    }
  }
  redirectToLogin() {
    const cur = window.location.pathname + window.location.search;
    window.location.href = '/@public/login/?redirect=' + encodeURIComponent(cur);
  }
  // 分类API
  getCategories(publicOnly = false) {
    const url = publicOnly ? '/api/categories?public=1' : '/api/categories';
    return this.request(url, {method: 'GET'});
  }
  addCategory(data) {
    return this.request('/api/categories', {method: 'POST', body: JSON.stringify(data)});
  }
  updateCategory(data) {
    return this.request('/api/categories', {method: 'POST', body: JSON.stringify(data)});
  }
  deleteCategory(id) {
    return this.request(`/api/categories?id=${id}`, {method: 'DELETE'});
  }
  updateCategoriesSort(sortData) {
    return this.request('/api/categories/sort', {method: 'PATCH', body: JSON.stringify(sortData)});
  }
  // 链接API
  getLinks(publicOnly = false, categoryId = 0) {
    const params = [];
    if (publicOnly) params.push('public=1');
    if (categoryId > 0) params.push('category_id=' + categoryId);
    const url = '/api/links' + (params.length ? '?' + params.join('&') : '');
    return this.request(url, {method: 'GET'});
  }
  addLink(data) {
    return this.request('/api/link', {method: 'POST', body: JSON.stringify(data)});
  }
  updateLink(data) {
    return this.request('/api/link', {method: 'POST', body: JSON.stringify(data)});
  }
  deleteLink(id) {
    return this.request(`/api/link?id=${id}`, {method: 'DELETE'});
  }
  updateLinksSort(sortData) {
    return this.request('/api/links/sort', {method: 'PATCH', body: JSON.stringify(sortData)});
  }
}
window.api = new API();
