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
          window.showNotification('命令已复制到剪贴板 并替换了路径，你可能需要编辑后执行', 'success')
        } 
      })
      .catch((err) => {
        console.error('复制失败:', err)
        if (window.showNotification) {
          window.showNotification('复制命令失败，请手动复制。', 'danger')
        } 
      })
  }
  
  window.copyLegoCommand = copyLegoCommand

function copyRcloneMountCommand() {
    const rcloneMountCommand = document.getElementById('ThirdPartyExtRcloneAutoMountCommand').value
    const rcloneBinPath = document.getElementById('RcloneBinPath').value
    const rcloneConfigFilePath = document.getElementById('RcloneConfigFilePath').value
    let commandToCopy = rcloneMountCommand.replace(/\${BinPath}/g, rcloneBinPath)

    if (rcloneConfigFilePath) {
      commandToCopy = commandToCopy.replace(/\${ConfigFilePath}/g, "--config=" + rcloneConfigFilePath)
    } else {
      commandToCopy = commandToCopy.replace(/\${ConfigFilePath}/g, "")
    }
    commandToCopy = commandToCopy.replace(/&nascore/g, '')

    navigator.clipboard
      .writeText(commandToCopy)
      .then(() => {
        if (window.showNotification) {
          window.showNotification('命令已复制到剪贴板 并替换了路径，你可能需要编辑后执行', 'success')
        }
      })
      .catch((err) => {
        console.error('复制失败:', err)
        if (window.showNotification) {
          window.showNotification('复制命令失败，请手动复制。', 'danger')
        } 
      })
}

window.copyRcloneMountCommand = copyRcloneMountCommand

