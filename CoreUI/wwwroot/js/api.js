/**
 * API请求封装
 * 基于 axios 1.6.7
 */

// Token存储键名
const TOKEN_KEY = {
  ACCESS: 'nascore_jwt_access_token',
  ACEXPIRES: 'nascore_jwt_access_token_expires',
  REFRESH: 'nascore_jwt_refresh_token',
  RfEXPIRES: 'nascore_jwt_refresh_token_expires',
}

// 创建axios实例
const baseRequest = axios.create({
  timeout: 30000, // 5秒超时
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器 - 统一处理响应
baseRequest.interceptors.response.use(
  (response) => {
    const data = response.data
    // 检查业务code，小于10为正常
    if (data.code < 10) {
      return data
    }
    // 业务异常处理
    const error = new Error(data.message || '未知错误')
    error.code = data.code
    return Promise.reject(error)
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Token管理
 */
const TokenManager = {
  setTokens(tokens) {
    localStorage.setItem(TOKEN_KEY.ACCESS, tokens.access_token)

    const accessExpires = new Date(parseInt(tokens.access_token_expires) * 1000).toUTCString()
    document.cookie = `${TOKEN_KEY.ACCESS}=${tokens.access_token}; path=/; expires=${accessExpires}`

    localStorage.setItem(TOKEN_KEY.REFRESH, tokens.refresh_token)
    const refreshExpires = new Date(parseInt(tokens.refresh_token_expires) * 1000).toUTCString()
    document.cookie = `${TOKEN_KEY.REFRESH}=${tokens.refresh_token}; path=/; expires=${refreshExpires}`

    localStorage.setItem(TOKEN_KEY.ACEXPIRES, tokens.access_token_expires)
    localStorage.setItem(TOKEN_KEY.RfEXPIRES, tokens.refresh_token_expires)
  },

  getAccessToken() {
    return localStorage.getItem(TOKEN_KEY.ACCESS)
  },

  getRefreshToken() {
    return localStorage.getItem(TOKEN_KEY.REFRESH)
  },
  getRefreshTokenExpires() {
    return localStorage.getItem(TOKEN_KEY.RfEXPIRES)
  },
  clear() {
    document.cookie = `${TOKEN_KEY.ACCESS}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${TOKEN_KEY.REFRESH}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${TOKEN_KEY.ACEXPIRES}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${TOKEN_KEY.RfEXPIRES}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    localStorage.removeItem(TOKEN_KEY.ACCESS)
    localStorage.removeItem(TOKEN_KEY.REFRESH)
    localStorage.removeItem(TOKEN_KEY.ACEXPIRES)
    localStorage.removeItem(TOKEN_KEY.RfEXPIRES)
  },
}

/**
 * 统一的请求函数，支持 GET/POST/PUT/DELETE，兼容老用法
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} [options] - 可选配置
 * @param {Object} [options.basicAuth] - Basic认证信息 {username: '', password: ''}
 * @param {boolean} [options.needToken=false] - 是否需要携带JWT token
 * @param {string} [options.method] - 请求方法，GET/POST/PUT/DELETE，默认POST
 * @returns {Promise}
 */
async function request(url, data = {}, options = {}) {
  const config = {};

  // 处理Basic Auth
  if (options.basicAuth) {
    const { username, password } = options.basicAuth;
    const basicAuth = btoa(`${username}:${password}`);
    config.headers = {
      Authorization: `Basic ${basicAuth}`,
    };
  }

  // 处理JWT token
  if (options.needToken) {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  // method 默认为 POST，兼容老用法
  const method = (options.method || 'POST').toUpperCase();

  try {
    if (method === 'GET') {
      // GET 请求参数要放到 params，兼容老用法 data 为空对象时也能正常
      if (data && Object.keys(data).length > 0) {
        config.params = data;
      }
      return await baseRequest.get(url, config);
    } else if (method === 'DELETE') {
      // axios delete 第二参数是 config，data 要放 config.data
      if (data && Object.keys(data).length > 0) {
        config.data = data;
      }
      return await baseRequest.delete(url, config);
    } else if (method === 'PUT') {
      return await baseRequest.put(url, data, config);
    } else {
      // 默认 POST
      return await baseRequest.post(url, data, config);
    }
  } catch (error) {
    return Promise.reject({
      code: error.code || -1,
      message: error.message || '请求失败',
      data: null,
    });
  }
}

// 导出API方法
window.API = {
  request,
  TokenManager,
}
