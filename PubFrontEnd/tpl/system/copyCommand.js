function copyLegoCommand() {
    const acmeLegoCommand = document.getElementById('AcmeLegoCommand').value
    const acmeLegoPath = document.getElementById('AcmeLegoPath').value
    const acmeLegoBinPath = document.getElementById('AcmeLegoBinPath').value
  
    let commandToCopy = acmeLegoCommand.replace(/\${LEGO_PATH}/g, acmeLegoPath)
    commandToCopy = commandToCopy.replace(/\${BinPath}/g, acmeLegoBinPath)
    commandToCopy = commandToCopy.replace(/&nascore/g, '')
  
    navigator.clipboard
      .writeText(commandToCopy)
      .then(() => {
        if (window.showNotification) {
          window.showNotification('命令已复制到剪贴板 并替换了路径，你可以粘贴到终端中执行', 'success')
        } else {
          alert('命令已复制到剪贴板 并替换了路径，你可以粘贴到终端中执行')
        }
      })
      .catch((err) => {
        console.error('复制失败:', err)
        if (window.showNotification) {
          window.showNotification('复制命令失败，请手动复制。', 'danger')
        } else {
          alert('复制命令失败，请手动复制。')
        }
      })
  }
  
  window.copyLegoCommand = copyLegoCommand

document.getElementById('lego-copy-command-btn')?.addEventListener('click', copyLegoCommand)