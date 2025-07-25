document.addEventListener('DOMContentLoaded', function () {
  // 获取表单元素
  const form = document.getElementById('personalSettingsForm')
  const hideHiddenFilesInput = document.getElementById('hideHiddenFiles')
  const useSingleClickInput = document.getElementById('useSingleClick')
  const onlineEditFileSizeLimitInput = document.getElementById('onlineEditFileSizeLimit')
  const useOnlyThumbnailsInput = document.getElementById('useOnlyThumbnails')
  const imagePreviewSizeLimitInput = document.getElementById('imagePreviewSizeLimit')
  const showExactDateInput = document.getElementById('showExactDate')
  const maxConcurrentUploadsInput = document.getElementById('maxConcurrentUploads')

  // 确保所有必要的元素都存在
  if (form) {
    // 加载并显示当前设置
    const config = window.NascoreConfig.get()
    hideHiddenFilesInput.checked = config.hideHiddenFiles
    useSingleClickInput.checked = config.useSingleClick
    onlineEditFileSizeLimitInput.value = config.onlineEditFileSizeLimit
    useOnlyThumbnailsInput.checked = config.useOnlyThumbnails || false
    imagePreviewSizeLimitInput.value = config.imagePreviewSizeLimit || 1024
    showExactDateInput.checked = config.showExactDate || false
    maxConcurrentUploadsInput.value = config.maxConcurrentUploads || 3

    // 处理表单提交
    form.addEventListener('submit', function (e) {
      e.preventDefault()

      // 保存新设置
      const newConfig = {
        ...config,
        hideHiddenFiles: hideHiddenFilesInput.checked,
        useSingleClick: useSingleClickInput.checked,
        onlineEditFileSizeLimit: parseInt(onlineEditFileSizeLimitInput.value, 10),
        useOnlyThumbnails: useOnlyThumbnailsInput.checked,
        imagePreviewSizeLimit: parseInt(imagePreviewSizeLimitInput.value, 10),
        showExactDate: showExactDateInput.checked,
        maxConcurrentUploads: Math.max(1, Math.min(20, parseInt(maxConcurrentUploadsInput.value, 10) || 1)),
      }

      window.NascoreConfig.save(newConfig)
      window.showNotification('设置已保存', 'success')

      // 如果当前在文件列表页面,刷新列表以应用新设置
      if (window.location.pathname.endsWith('nascore.shtml')) {
        window.location.reload()
      }
    })
  }

  // 处理密码修改表单
  const changePasswordForm = document.getElementById('changePasswordForm')
  
  // 确保密码修改表单存在
  if (changePasswordForm) {
    console.log('密码修改表单找到，添加事件监听器')
    
    // 确保提交按钮存在
    const submitButton = changePasswordForm.querySelector('button[type="submit"]')
    if (!submitButton) {
      console.error('未找到密码修改表单提交按钮')
    } else {
      console.log('找到密码修改表单提交按钮')
    }
    
    changePasswordForm.addEventListener('submit', function (e) {
      console.log('密码修改表单提交事件触发')
      e.preventDefault()

      const oldPassword = document.getElementById('oldPassword').value
      const newPassword = document.getElementById('newPassword').value
      const confirmPassword = document.getElementById('confirmPassword').value

      console.log('表单数据收集完成')

      // 验证输入
      if (!oldPassword || !newPassword || !confirmPassword) {
        console.log('表单验证失败：字段为空')
        if (typeof window.showNotification === 'function') {
          window.showNotification('请填写所有密码字段', 'error')
        } else {
          console.error('showNotification 函数不存在')
          alert('请填写所有密码字段')
        }
        return
      }

      if (newPassword !== confirmPassword) {
        console.log('密码确认失败')
        if (typeof window.showNotification === 'function') {
          window.showNotification('新密码两次输入不一致', 'error')
        } else {
          alert('新密码两次输入不一致')
        }
        return
      }

      if (newPassword.length < 1) {
        console.log('新密码长度验证失败')
        if (typeof window.showNotification === 'function') {
          window.showNotification('新密码长度不能为空', 'error')
        } else {
          alert('新密码长度不能为空')
        }
        return
      }

      if (oldPassword === newPassword) {
        console.log('新旧密码相同')
        if (typeof window.showNotification === 'function') {
          window.showNotification('新密码不能与当前密码相同', 'error')
        } else {
          alert('新密码不能与当前密码相同')
        }
        return
      }

      // 获取表单提交按钮
      const submitBtn = e.target.querySelector('button[type="submit"]')
      
      // 如果找不到提交按钮，尝试直接从changePasswordForm获取
      const buttonToUse = submitBtn || changePasswordForm.querySelector('button[type="submit"]')
      
      // 保存原始文本，用于恢复
      let originalText = '更新密码'
      if (buttonToUse) {
        originalText = buttonToUse.textContent || '更新密码'
        buttonToUse.disabled = true
        buttonToUse.textContent = '更新中...'
      }

      // 发送密码修改请求
      const token = TokenManager.getAccessToken()
      console.log('获取到的token:', token ? '存在' : '不存在')

      if (!token) {
        console.log('token不存在，需要登录')
        if (typeof window.showNotification === 'function') {
          window.showNotification('请先登录', 'error')
        } else {
          alert('请先登录')
        }
        if (buttonToUse) {
          buttonToUse.disabled = false
          buttonToUse.textContent = originalText
        }
        return
      }

      console.log('开始发送密码修改请求')
      
      // 替换为正确的API URL（确保不使用模板变量）
      const apiUrl = window.location.origin + '/@api/user/changePassword'
      console.log('API URL:', apiUrl)
      
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword,
        }),
      })
        .then((response) => {
          console.log('收到响应:', response.status)
          return response.json()
        })
        .then((data) => {
          console.log('响应数据:', data)
          if (!data.error) {
            console.log('密码修改成功')
            if (typeof window.showNotification === 'function') {
              window.showNotification('密码修改成功', 'success')
            } else {
              alert('密码修改成功')
            }
            // 清空表单
            changePasswordForm.reset()
          } else {
            console.log('密码修改失败:', data.message)
            if (typeof window.showNotification === 'function') {
              window.showNotification(data.message || '密码修改失败', 'error')
            } else {
              alert(data.message || '密码修改失败')
            }
          }
        })
        .catch((error) => {
          console.error('密码修改请求错误:', error)
          if (typeof window.showNotification === 'function') {
            window.showNotification('网络错误，请重试', 'error')
          } else {
            alert('网络错误，请重试')
          }
        })
        .finally(() => {
          // 恢复按钮状态
          if (buttonToUse) {
            buttonToUse.disabled = false
            buttonToUse.textContent = originalText
          }
        })
    })
  } else {
    console.error('未找到密码修改表单元素 #changePasswordForm')
  }
})
