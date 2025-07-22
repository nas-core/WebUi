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
document.getElementById('lego-download-btn').onclick = downloadLego

// 挂到 window 上，方便外部绑定
window.downloadLego = downloadLego
