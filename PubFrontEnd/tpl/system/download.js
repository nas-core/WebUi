// 通用第三方软件下载逻辑
// 依赖：api.js
// options: { url, params, needToken, onSuccess, onError, onTimeout, timeoutMs, moduleName }

function downloadThirdParty(options) {
  const {
    url,
    params = {},
    needToken = true,
    onSuccess,
    onError,
    onTimeout,
    timeoutMs = 35000,
    moduleName = '文件',
  } = options

  let timeoutFlag = false
  let timeoutId = setTimeout(() => {
    timeoutFlag = true
    if (typeof onTimeout === 'function') {
      onTimeout()
    } else {
      showNotification(`${moduleName} 下载请求超时，后台可能仍在下载，请稍后刷新或检查文件`, 'warning')
    }
  }, timeoutMs)

  // 新增：点击下载时立即提示
  showNotification(`${moduleName} 正在下载...`, 'info')

  window.API.request(url, params, { needToken })
    .then(response => {
      clearTimeout(timeoutId)
      if (timeoutFlag) {
        // 已经提示过超时，不再重复提示
        return
      }
      if (response.code < 10) {
        if (typeof onSuccess === 'function') {
          onSuccess(response)
        } else {
          showNotification(`${moduleName} 下载成功`, 'success')
        }
      } else {
        if (typeof onError === 'function') {
          onError(response)
        } else {
          showNotification(`${moduleName} 下载失败: ` + response.message, 'danger')
        }
      }
    })
    .catch(error => {
      clearTimeout(timeoutId)
      if (timeoutFlag) {
        // 已经提示过超时，不再重复提示
        return
      }
      if (typeof onError === 'function') {
        onError(error)
      } else {
        showNotification(`${moduleName} 下载出错: ` + (error.message || error), 'danger')
      }
    })
}
window.downloadThirdParty = downloadThirdParty

// 下载按钮逻辑
function downloadLego() {
  const Version = document.getElementById('AcmeLegoVersion').value
  const BinPath = document.getElementById('AcmeLegoBinPath').value
  const ThirdPartyExtGitHubDownloadMirror = document.getElementById('ThirdPartyExtGitHubDownloadMirror')?.value || ''
  window.downloadThirdParty({
    url: `/@api/admin/get_ThirdParty_lego?Version=${encodeURIComponent(Version)}&BinPath=${encodeURIComponent(BinPath)}`,
    moduleName: 'LEGO',
    timeoutMs: 60000,
    onTimeout: () => showNotification('LEGO 下载请求超时，后台可能仍在下载，请稍后刷新或检查文件', 'warning'),
    onSuccess: () => showNotification('LEGO 下载成功', 'success'),
    onError: (err) => showNotification('LEGO 下载失败: ' + (err.message || err), 'danger'),
  })
}

// 挂到 window 上，方便外部绑定
window.downloadLego = downloadLego

// rclone 下载按钮逻辑
function downloadRclone() {
  const Version = document.getElementById('ThirdPartyExtRcloneVersion').value
  const BinPath = document.getElementById('RcloneBinPath').value
  window.downloadThirdParty({
    url: `/@api/admin/get_ThirdParty_rclone?Version=${encodeURIComponent(Version)}&BinPath=${encodeURIComponent(BinPath)}`,
    moduleName: 'Rclone',
    timeoutMs: 60000,
    onTimeout: () => showNotification('Rclone 下载请求超时，后台可能仍在下载，请稍后刷新或检查文件', 'warning'),
    onSuccess: () => showNotification('Rclone 下载成功', 'success'),
    onError: (err) => showNotification('Rclone 下载失败: ' + (err.message || err), 'danger'),
  })
}


// 挂到 window 上，方便外部绑定
window.downloadRclone = downloadRclone;

// ddns-go 下载按钮逻辑
function downloadDDNSGo() {
  const Version = document.getElementById('ThirdPartyExtDdnsGOVersion').value
  const BinPath = document.getElementById('DdnsGOBinPath').value
  window.downloadThirdParty({
    url: `/@api/admin/get_ThirdParty_ddnsgo?Version=${encodeURIComponent(Version)}&BinPath=${encodeURIComponent(BinPath)}`,
    moduleName: 'DDNS-GO',
    timeoutMs: 60000,
    onTimeout: () => showNotification('DDNS-GO 下载请求超时，后台可能仍在下载，请稍后刷新或检查文件', 'warning'),
    onSuccess: () => showNotification('DDNS-GO 下载成功', 'success'),
    onError: (err) => showNotification('DDNS-GO 下载失败: ' + (err.message || err), 'danger'),
  })
}
window.downloadDDNSGo = downloadDDNSGo;

// ddnsgo 重置密码按钮逻辑
function resetDDNSGOPassword() {
  const binPath = document.getElementById('DdnsGOBinPath').value;
  const configPath = document.getElementById('ThirdPartyExtDdnsGOConfigFilePath').value;
  if (!binPath || !configPath) {
    showNotification('请填写DDNS-go路径和配置文件路径', 'danger');
    return;
  }
  showNotification('正在重置DDNS-go密码...', 'info');
  window.API.request(
    `/@api/admin/SpecialOPT?opt=ddnsgo_reset_admin&binPath=${encodeURIComponent(binPath)}&configPath=${encodeURIComponent(configPath)}`,
    {},
    { needToken: true, method: 'GET' }
  ).then(res => {
    if (res.code < 10) {
      showNotification('密码重置为 nascore , 你需要重启nascore才可以使用新密码登陆', 'success');
    } else {
      showNotification('重置密码失败: ' + (res.message || ''), 'danger');
    }
  }).catch(err => {
    showNotification('重置密码失败: ' + (err.message || err), 'danger');
  });
}
window.resetDDNSGOPassword = resetDDNSGOPassword;

function restartDDNSGo() {
  const binPath = document.getElementById('DdnsGOBinPath').value;
  const configPath = document.getElementById('ThirdPartyExtDdnsGOConfigFilePath').value;
  if (!binPath || !configPath) {
    showNotification('请填写DDNS-go路径和配置文件路径', 'danger');
    return;
  }
  showNotification('正在重启DDNS-go...', 'info');
  window.API.request(
    `/@api/admin/SpecialOPT?opt=ddnsgo_restart&binPath=${encodeURIComponent(binPath)}&configPath=${encodeURIComponent(configPath)}`,
    {},
    { needToken: true, method: 'GET' }
  ).then(res => {
    if (res.code < 10) {
      showNotification('重启结果：' + (res.data || '无返回'), 'success');
    } else {
      showNotification('重启失败: ' + (res.message || ''), 'danger');
    }
  }).catch(err => {
    showNotification('重启失败: ' + (err.message || err), 'danger');
  });
}
window.restartDDNSGo = restartDDNSGo;

function downloadAdgRules() {
  const DownLoadlink = document.getElementById('ThirdPartyExtAdGuardUpstream_dns_fileUpdateUrl').value;
  const GitHubDownloadMirror = (document.getElementById('ThirdPartyExtGitHubDownloadMirror') && document.getElementById('ThirdPartyExtGitHubDownloadMirror').value) || '';
  const savepath = document.getElementById('ThirdPartyExtAdGuardUpstream_dns_file').value;
  if (!DownLoadlink || !savepath) {
    showNotification('请填写规则文件保存路径和更新地址', 'danger');
    return;
  }
  showNotification('正在下载规则文件...', 'info');
  window.API.request(
    `/@api/admin/get_adguard_rules?DownLoadlink=${encodeURIComponent(DownLoadlink)}&GitHubDownloadMirror=${encodeURIComponent(GitHubDownloadMirror)}&savepath=${encodeURIComponent(savepath)}`,
    {},
    { needToken: true, method: 'GET' }
  ).then(res => {
    if (res.code < 10) {
      showNotification('规则文件下载成功', 'success');
    } else {
      showNotification('规则文件下载失败: ' + (res.message || ''), 'danger');
    }
  }).catch(err => {
    showNotification('规则文件下载失败: ' + (err.message || err), 'danger');
  });
}
window.downloadAdgRules = downloadAdgRules;

function downloadOpenlist() {
  const Version = document.getElementById('ThirdPartyExtOpenlistVersion').value;
  const BinPath = document.getElementById('OpenlistBinPath').value;
  window.downloadThirdParty({
    url: `/@api/admin/get_ThirdParty_openlist?Version=${encodeURIComponent(Version)}&BinPath=${encodeURIComponent(BinPath)}`,
    moduleName: 'OpenList',
    timeoutMs: 60000,
    onTimeout: () => showNotification('OpenList 下载请求超时，后台可能仍在下载，请稍后刷新或检查文件', 'warning'),
    onSuccess: () => showNotification('OpenList 下载成功', 'success'),
    onError: (err) => showNotification('OpenList 下载失败: ' + (err.message || err), 'danger'),
  })
}
window.downloadOpenlist = downloadOpenlist;

function downloadCaddy2() {
  const Version = document.getElementById('ThirdPartyExtCaddy2Version').value;
  const BinPath = document.getElementById('Caddy2BinPath').value;
  window.downloadThirdParty({
    url: `/@api/admin/get_ThirdParty_caddy2?Version=${encodeURIComponent(Version)}&BinPath=${encodeURIComponent(BinPath)}`,
    moduleName: 'Caddy2',
    timeoutMs: 60000,
    onTimeout: () => showNotification('Caddy2 下载请求超时，后台可能仍在下载，请稍后刷新或检查文件', 'warning'),
    onSuccess: () => showNotification('Caddy2 下载成功', 'success'),
    onError: (err) => showNotification('Caddy2 下载失败: ' + (err.message || err), 'danger'),
  })
}
window.downloadCaddy2 = downloadCaddy2;

function resetOpenListPassword() {
  const binPath = document.getElementById('OpenlistBinPath').value;
  const dataPath = document.getElementById('ThirdPartyExtOpenlistDataPath').value;
  if (!binPath || !dataPath) {
    showNotification('请填写OpenList路径和数据目录', 'danger');
    return;
  }
  showNotification('正在重置OpenList密码...', 'info');
  window.API.request(
    `/@api/admin/SpecialOPT?opt=openlist_reset_admin&binPath=${encodeURIComponent(binPath)}&dataPath=${encodeURIComponent(dataPath)}`,
    {},
    { needToken: true, method: 'GET' }
  ).then(res => {
    const resultSpan = document.getElementById('openlist-reset-result');
    if (res.code < 10) {
      showNotification('OpenList密码重置成功，用户名admin，密码为随机新密码，请查看输出', 'success');
      if (resultSpan) resultSpan.textContent = '';
      // 弹出模态框显示内容
      const modal = document.getElementById('openlist-reset-modal');
      const modalContent = document.getElementById('openlist-reset-modal-content');
      if (modal && modalContent) {
        modalContent.textContent = res.data || '';
        modal.classList.remove('hidden');
      }
    } else {
      showNotification('OpenList密码重置失败: ' + (res.message || ''), 'danger');
      if (resultSpan) resultSpan.textContent = '';
    }
  }).catch(err => {
    showNotification('OpenList密码重置失败: ' + (err.message || err), 'danger');
    const resultSpan = document.getElementById('openlist-reset-result');
    if (resultSpan) resultSpan.textContent = '';
  });
}
window.resetOpenListPassword = resetOpenListPassword;