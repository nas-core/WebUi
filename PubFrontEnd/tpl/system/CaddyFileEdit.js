// ===== Caddy2 网址管理逻辑（独立文件） =====

// 全局变量：当前Caddyfile解析出来的网址配置
window.caddySiteConfig = {
  sites: [],
  raw: '', // 原始Caddyfile内容
}

// 解析Caddyfile文本为网址配置（支持tls）
function parseCaddyfileSites(caddyfileContent) {
  const sites = []
  // 只解析网站块，不处理全局块
  const siteBlocks = caddyfileContent.matchAll(/(.+?)\s*\{\n([\s\S]*?)\n\}/g)
  for (const match of siteBlocks) {
    const address = match[1].trim()
    const directives = match[2]
    const siteConfig = { address, type: 'respond' }
    // respond
    const respondMatch = directives.match(/respond\s*"(.*?)"/i)
    if (respondMatch) {
      siteConfig.type = 'respond'
      siteConfig.respondContent = respondMatch[1]
    }
    // file_server
    const fileServerMatch = directives.match(/root\s*\*?\s*(\S+)\s*\n\s*file_server/i)
    if (fileServerMatch) {
      siteConfig.type = 'file_server'
      siteConfig.fileServerRoot = fileServerMatch[1]
    }
    // reverse_proxy
    const reverseProxyMatch = directives.match(/reverse_proxy\s+(\S+)([\s\S]*?)(?:transport\s+http\s*\{\s*tls_insecure_skip_verify\s*\})?/i)
    if (reverseProxyMatch) {
      siteConfig.type = 'reverse_proxy'
      siteConfig.proxyTarget = reverseProxyMatch[1]
      siteConfig.tlsInsecureSkipVerify = reverseProxyMatch[0].includes('tls_insecure_skip_verify')
    }
    // tls
    const tlsMatch = directives.match(/tls\s+(\S+)\s+(\S+)/i)
    if (tlsMatch) {
      siteConfig.tls = {
        certPath: tlsMatch[1],
        keyPath: tlsMatch[2],
      }
    }
    sites.push(siteConfig)
  }
  return sites
}

// 生成Caddyfile文本（支持tls）
function generateCaddyfileFromSites(sites, raw) {
  // 保留全局块
  let globalBlock = ''
  const globalMatch = raw.match(/\{[\s\S]*?\}/)
  if (globalMatch) globalBlock = globalMatch[0] + '\n\n'
  let caddyfile = globalBlock
  sites.forEach(site => {
    caddyfile += `${site.address} {\n`
    if (site.basicAuth) {
      caddyfile += `\tbasic_auth * {\n`
      caddyfile += `\t\t${site.basicAuth.username} ${site.basicAuth.hashedPassword}\n`
      caddyfile += `\t}\n`
    }
    if (site.tls) {
      caddyfile += `\ttls ${site.tls.certPath} ${site.tls.keyPath}\n`
    }
    if (site.type === 'respond') {
      caddyfile += `\trespond \"${site.respondContent || ''}\"\n`
    } else if (site.type === 'file_server') {
      caddyfile += `\troot * ${site.fileServerRoot || ''}\n\tfile_server\n`
    } else if (site.type === 'reverse_proxy') {
      caddyfile += `\treverse_proxy ${site.proxyTarget || ''}`
      if (site.tlsInsecureSkipVerify) {
        caddyfile += ` {\n\t\ttransport http {\n\t\t\ttls_insecure_skip_verify\n\t\t}\n\t}`
      }
      caddyfile += `\n`
    }
    caddyfile += `}\n\n`
  })
  return caddyfile.trim()
}

// 打开网址管理模态框（兼容Caddyfile不存在时以空白初始化）
window.EditCaddy = function() {
  const filePath = document.getElementById('ThirdPartyExtCaddy2ConfigPath').value
  if (!filePath) {
    window.showNotification('请先填写配置文件路径', 'danger')
    return
  }
  API.request('/@api/admin/getServerFile?path=' + encodeURIComponent(filePath), {}, { method: 'GET', needToken: true })
    .then(res => {
      let fileNotExist = false
      if ((res.code === 1 && res.data && res.data.content) || (res.code !== 1 && (res.message||'').includes('not found'))) {
        let decoded = ''
        if (res.code === 1 && res.data && res.data.content) {
          decoded = atob(res.data.content)
        } else {
          fileNotExist = true
        }
        window.caddySiteConfig.raw = decoded
        window.caddySiteConfig.sites = parseCaddyfileSites(decoded)
        window.renderCaddySiteList()
        document.getElementById('caddySiteSearchInput').value = ''
        // 显示不存在提示
        const tip = document.getElementById('caddyfile-not-exist-tip')
        if (fileNotExist && tip) {
          tip.classList.remove('hidden')
        } else if (tip) {
          tip.classList.add('hidden')
        }
        document.getElementById('caddySiteManagerModal').classList.remove('hidden')
      } else {
        window.showNotification('获取Caddyfile失败: ' + (res.message || '未知错误'), 'danger')
      }
    })
    .catch(err => {
      let fileNotExist = false
      if (err && err.message && err.message.includes('not found')) {
        fileNotExist = true
        window.caddySiteConfig.raw = ''
        window.caddySiteConfig.sites = []
        window.renderCaddySiteList()
        document.getElementById('caddySiteSearchInput').value = ''
        const tip = document.getElementById('caddyfile-not-exist-tip')
        if (fileNotExist && tip) {
          tip.classList.remove('hidden')
        } else if (tip) {
          tip.classList.add('hidden')
        }
        document.getElementById('caddySiteManagerModal').classList.remove('hidden')
      } else {
        window.showNotification('获取Caddyfile失败', 'danger')
      }
    })
}

// 关闭网址管理模态框（TailwindCSS）
window.closeCaddySiteManagerModal = function() {
  document.getElementById('caddySiteManagerModal').classList.add('hidden')
}
// 关闭编辑网址模态框（TailwindCSS）
window.closeCaddySiteEditModal = function() {
  document.getElementById('caddySiteEditModal').classList.add('hidden')
}

// 渲染网址列表
window.renderCaddySiteList = function() {
  const tbody = document.getElementById('caddySiteListBody')
  const search = document.getElementById('caddySiteSearchInput').value.trim().toLowerCase()
  tbody.innerHTML = ''
  let filtered = window.caddySiteConfig.sites
  if (search) {
    filtered = filtered.filter(site =>
      site.address.toLowerCase().includes(search) ||
      (site.respondContent && site.respondContent.toLowerCase().includes(search)) ||
      (site.fileServerRoot && site.fileServerRoot.toLowerCase().includes(search)) ||
      (site.proxyTarget && site.proxyTarget.toLowerCase().includes(search))
    )
  }
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">暂无网址配置</td></tr>'
    return
  }
  filtered.forEach((site, idx) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${site.address}</td>
      <td>${site.type === 'respond' ? '响应' : site.type === 'file_server' ? '静态文件' : '反向代理'}</td>
      <td>${site.type === 'respond' ? (site.respondContent || '') : site.type === 'file_server' ? (site.fileServerRoot || '') : (site.proxyTarget || '')}</td>
      <td>
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2" onclick="window.editCaddySite(${idx})">编辑</button>
        <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" onclick="window.deleteCaddySite(${idx})">删除</button>
      </td>
    `
    tbody.appendChild(tr)
  })
}

// 搜索
window.caddySiteSearch = function() {
  window.renderCaddySiteList()
}

// 切换TLS输入框显示/隐藏
window.toggleTlsFields = function(show = null) {
  const enableTls = document.getElementById('enableTls')
  const tlsFields = document.getElementById('tlsFields')
  if (show === null) {
    tlsFields.style.display = enableTls.checked ? 'block' : 'none'
  } else {
    tlsFields.style.display = show ? 'block' : 'none'
    enableTls.checked = show
  }
}

// 打开添加网址模态框（TailwindCSS）
window.openCaddySiteAddModal = function() {
  document.getElementById('caddySiteEditIndex').value = ''
  document.getElementById('caddySiteEditForm').reset()
  document.getElementById('caddySiteType').value = 'reverse_proxy'
  window.caddySiteTypeChange()
  // 默认勾选忽略TLS错误
  document.getElementById('caddySiteTlsInsecureSkipVerify').checked = true
  // TLS默认不启用
  document.getElementById('enableTls').checked = false
  window.toggleTlsFields(false)
  document.getElementById('tlsCertPath').value = ''
  document.getElementById('tlsKeyPath').value = ''
  document.getElementById('caddySiteEditModal').classList.remove('hidden')
}

// 编辑网址（TailwindCSS）
window.editCaddySite = function(idx) {
  const site = window.caddySiteConfig.sites[idx]
  document.getElementById('caddySiteEditIndex').value = idx
  document.getElementById('caddySiteAddress').value = site.address
  document.getElementById('caddySiteType').value = site.type
  window.caddySiteTypeChange()
  if (site.type === 'respond') {
    document.getElementById('caddySiteRespondContent').value = site.respondContent || ''
  } else if (site.type === 'file_server') {
    document.getElementById('caddySiteFileServerRoot').value = site.fileServerRoot || ''
  } else if (site.type === 'reverse_proxy') {
    document.getElementById('caddySiteProxyTarget').value = site.proxyTarget || ''
    document.getElementById('caddySiteTlsInsecureSkipVerify').checked = !!site.tlsInsecureSkipVerify
  }
  // TLS
  if (site.tls) {
    document.getElementById('enableTls').checked = true
    window.toggleTlsFields(true)
    document.getElementById('tlsCertPath').value = site.tls.certPath || ''
    document.getElementById('tlsKeyPath').value = site.tls.keyPath || ''
  } else {
    document.getElementById('enableTls').checked = false
    window.toggleTlsFields(false)
    document.getElementById('tlsCertPath').value = ''
    document.getElementById('tlsKeyPath').value = ''
  }
  document.getElementById('caddySiteEditModal').classList.remove('hidden')
}

// 切换类型显示
window.caddySiteTypeChange = function() {
  const type = document.getElementById('caddySiteType').value
  document.querySelectorAll('.site-type-fields').forEach(el => el.style.display = 'none')
  if (type === 'respond') {
    document.getElementById('caddySiteRespondFields').style.display = 'block'
  } else if (type === 'file_server') {
    document.getElementById('caddySiteFileServerFields').style.display = 'block'
  } else if (type === 'reverse_proxy') {
    document.getElementById('caddySiteReverseProxyFields').style.display = 'block'
  }
}

// 保存添加/编辑
window.saveCaddySiteEdit = function() {
  const idx = document.getElementById('caddySiteEditIndex').value
  const address = document.getElementById('caddySiteAddress').value.trim()
  const type = document.getElementById('caddySiteType').value
  if (!address) {
    window.showNotification('网址不能为空', 'danger')
    return
  }
  const site = { address, type }
  if (type === 'respond') {
    site.respondContent = document.getElementById('caddySiteRespondContent').value.trim()
    if (!site.respondContent) {
      window.showNotification('响应内容不能为空', 'danger')
      return
    }
  } else if (type === 'file_server') {
    site.fileServerRoot = document.getElementById('caddySiteFileServerRoot').value.trim()
    if (!site.fileServerRoot) {
      window.showNotification('静态文件根目录不能为空', 'danger')
      return
    }
  } else if (type === 'reverse_proxy') {
    site.proxyTarget = document.getElementById('caddySiteProxyTarget').value.trim()
    site.tlsInsecureSkipVerify = document.getElementById('caddySiteTlsInsecureSkipVerify').checked
    if (!site.proxyTarget) {
      window.showNotification('反向代理目标地址不能为空', 'danger')
      return
    }
  }
  // TLS
  if (document.getElementById('enableTls').checked) {
    const certPath = document.getElementById('tlsCertPath').value.trim()
    const keyPath = document.getElementById('tlsKeyPath').value.trim()
    if (!certPath || !keyPath) {
      window.showNotification('TLS 证书和密钥路径不能为空', 'danger')
      return
    }
    site.tls = {
      certPath: certPath,
      keyPath: keyPath,
    }
  }
  if (idx === '') {
    window.caddySiteConfig.sites.push(site)
    window.showNotification('网址添加成功', 'success')
  } else {
    window.caddySiteConfig.sites[parseInt(idx)] = site
    window.showNotification('网址修改成功', 'success')
  }
  window.renderCaddySiteList()
  window.closeCaddySiteEditModal()
}

// 删除网址
window.deleteCaddySite = function(idx) {
  if (confirm('确定要删除此网址吗？')) {
    window.caddySiteConfig.sites.splice(idx, 1)
    window.renderCaddySiteList()
    window.showNotification('网址删除成功', 'success')
  }
}

// 手动编辑切换
window.toggleManualEdit = function() {
  const manualArea = document.getElementById('manualCaddyfileArea')
  const tableArea = document.querySelector('#caddySiteManagerModal .overflow-x-auto')
  const searchBar = document.querySelector('#caddySiteManagerModal .flex.flex-col')
  const btn = document.getElementById('toggleManualEditBtn')
  if (manualArea.classList.contains('hidden')) {
    // 切到手动编辑
    manualArea.classList.remove('hidden')
    if (tableArea) tableArea.classList.add('hidden')
    if (searchBar) searchBar.classList.add('hidden')
    btn.textContent = '切回可视化'
    // 同步内容
    document.getElementById('manualCaddyfileContent').value = generateCaddyfileFromSites(window.caddySiteConfig.sites, window.caddySiteConfig.raw)
  } else {
    // 切回可视化
    manualArea.classList.add('hidden')
    if (tableArea) tableArea.classList.remove('hidden')
    if (searchBar) searchBar.classList.remove('hidden')
    btn.textContent = '手动编辑'
    // 解析内容
    const content = document.getElementById('manualCaddyfileContent').value
    window.caddySiteConfig.sites = parseCaddyfileSites(content)
    window.caddySiteConfig.raw = content
    window.renderCaddySiteList()
  }
}

// 监听手动编辑区内容变更，实时同步到sites（可选，增强体验）
document.getElementById('manualCaddyfileContent').addEventListener('input', function() {
  if (!this.closest('.hidden')) {
    window.caddySiteConfig.sites = parseCaddyfileSites(this.value)
    window.caddySiteConfig.raw = this.value
  }
})

// 切换auto_https块
window.toggleAutoHttpsBlock = function() {
  let content = ''
  // 判断当前是手动还是可视化
  const manualArea = document.getElementById('manualCaddyfileArea')
  if (!manualArea.classList.contains('hidden')) {
    content = document.getElementById('manualCaddyfileContent').value
  } else {
    content = generateCaddyfileFromSites(window.caddySiteConfig.sites, window.caddySiteConfig.raw)
  }
  // 检查是否有auto_https off块
  const autoBlock = /\{\s*auto_https\s+off\s*\}/
  if (autoBlock.test(content)) {
    // 移除
    content = content.replace(/\{\s*auto_https\s+off\s*\}\s*/g, '')
  } else {
    // 添加到头部
    content = '{\n\tauto_https off\n}\n' + content
  }
  // 更新内容
  if (!manualArea.classList.contains('hidden')) {
    document.getElementById('manualCaddyfileContent').value = content
    window.caddySiteConfig.sites = parseCaddyfileSites(content)
    window.caddySiteConfig.raw = content
  } else {
    window.caddySiteConfig.sites = parseCaddyfileSites(content)
    window.caddySiteConfig.raw = content
    window.renderCaddySiteList()
  }
}

// 保存到Caddyfile（支持手动编辑区）
window.saveCaddySites = function() {
  const filePath = document.getElementById('ThirdPartyExtCaddy2ConfigPath').value
  if (!filePath) {
    window.showNotification('请先填写配置文件路径', 'danger')
    return
  }
  let caddyfile = ''
  const manualArea = document.getElementById('manualCaddyfileArea')
  if (!manualArea.classList.contains('hidden')) {
    caddyfile = document.getElementById('manualCaddyfileContent').value
  } else {
    caddyfile = generateCaddyfileFromSites(window.caddySiteConfig.sites, window.caddySiteConfig.raw)
  }
  // 判断是否需要isCreatFile参数
  let isCreatFile = false
  const tip = document.getElementById('caddyfile-not-exist-tip')
  if (tip && !tip.classList.contains('hidden')) {
    isCreatFile = true
  }
  let url = '/@api/admin/saveServerFile?path=' + encodeURIComponent(filePath)
  if (isCreatFile) url += '&isCreatFile=true'
  API.request(url, { content: caddyfile }, { method: 'POST', needToken: true })
    .then(res => {
      if (res.code === 1) {
        window.showNotification('caddyfile保存成功', 'success')
        window.closeCaddySiteManagerModal()
      } else {
        console.error(res)
        window.showNotification('caddyfile保存失败: ' + (res.message || '未知错误'), 'danger')
      }
    })
    .catch(err => {
      console.error('[caddy] caddyfile保存失败', err)
      window.showNotification('caddyfile保存失败', 'danger')
    })
}
