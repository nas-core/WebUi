// 通用文件/目录浏览器
// 用法: window.openFileBower({type: 'file'|'dir', startPath: '', onSelect: function(path){}})
(function(){
  if(window.openFileBower) return;
  // 创建弹窗DOM
  function createModal(type) {
    let modal = document.getElementById('file-bower-modal');
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = 'file-bower-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 hidden';
    // 标题根据type变化
    var title = '选择文件/目录';
    if(type === 'dir') title = '选择目录';
    else if(type === 'file') title = '选择文件';
    modal.innerHTML = `
      <div class="bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
          <h3 class="text-lg font-semibold text-blue-700 dark:text-blue-400" id="file-bower-title">${title}</h3>
          <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl" onclick="document.getElementById('file-bower-modal').classList.add('hidden')">&times;</button>
        </div>
        <div class="px-6 pt-4 pb-2 flex flex-row gap-2">
          <button type="button" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm" id="file-bower-newfilebtn">新建文件</button>
          <button type="button" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm" id="file-bower-newdirbtn">新建目录</button>
        </div>
        <div class="px-6 py-2">
          <div class="mb-2 flex items-center gap-2">
            <input type="text" id="file-bower-path" class="w-full rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm" readonly>
            <button type="button" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded flex items-center justify-center" id="file-bower-upbtn" title="上一级">⤴</button>
          </div>
          <div class="overflow-y-auto max-h-80 border border-gray-100 dark:border-zinc-700 rounded" id="file-bower-list"></div>
        </div>
        <div class="flex justify-end gap-2 px-6 pb-4">
          <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition" id="file-bower-selectbtn">选择</button>
          <button type="button" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded-lg shadow transition" onclick="document.getElementById('file-bower-modal').classList.add('hidden')">取消</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  // 打开文件/目录浏览器
  window.openFileBower = function(opt) {
    const type = opt.type || 'file';
    let curPath = opt.startPath || '/';
    let selected = '';
    const modal = createModal(type);
    const pathInput = modal.querySelector('#file-bower-path');
    const listDiv = modal.querySelector('#file-bower-list');
    const upBtn = modal.querySelector('#file-bower-upbtn');
    const selectBtn = modal.querySelector('#file-bower-selectbtn');
    const titleEl = modal.querySelector('#file-bower-title');
    if(type === 'dir') titleEl.textContent = '选择目录';
    else if(type === 'file') titleEl.textContent = '选择文件';
    else titleEl.textContent = '选择文件/目录';
    function loadDir(path) {
      pathInput.value = path;
      listDiv.innerHTML = '<div class="text-center text-gray-400 py-6">加载中...</div>';
      // 切换目录时清除选中状态和按钮
      if(type === 'file') {
        selected = '';
        if(selectBtn) selectBtn.style.display = 'none';
      }
      API.request('/@adminapi/admin/getDirectoryContents?path=' + encodeURIComponent(path), {}, {method:'GET', needToken:true})
        .then(res => {
          if(res.code !== 1 && res.code !== undefined) {
            listDiv.innerHTML = '<div class="text-center text-red-500 py-6">加载失败</div>';
            return;
          }
          let items = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          // 排序：目录在前，文件在后，均按名称排序
          items = items.slice().sort(function(a, b) {
            if(a.is_dir && !b.is_dir) return -1;
            if(!a.is_dir && b.is_dir) return 1;
            return a.name.localeCompare(b.name, 'zh-CN');
          });
          renderList(items, path);
          // type=file 未选中文件时隐藏选择按钮
          if(type === 'file') {
            selectBtn.style.display = selected ? '' : 'none';
          } else {
            selectBtn.style.display = '';
          }
        })
        .catch(()=>{
          listDiv.innerHTML = '<div class="text-center text-red-500 py-6">加载失败</div>';
        });
    }
    function renderList(items, basePath) {
      let html = '';
      if(items.length === 0) {
        html = '<div class="text-center text-gray-400 py-6">暂无内容</div>';
        listDiv.innerHTML = html;
        return;
      }
      html = '<ul class="divide-y divide-gray-100 dark:divide-zinc-700">';
      items.forEach(item => {
        let icon = item.is_dir ? '📁' : '📄';
        html += `<li class="flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-700 ${item.is_dir ? 'font-bold' : ''}" data-path="${basePath.replace(/\/$/,'') + '/' + item.name}" data-dir="${item.is_dir}">
          ${icon}<span class="ml-2 flex-1 truncate">${item.name}</span>
          <button type='button' class='ml-2 text-xs text-blue-600 hover:underline file-bower-renamebtn' title='重命名' data-path="${basePath.replace(/\/$/,'') + '/' + item.name}">重命名</button>
        </li>`;
      });
      html += '</ul>';
      listDiv.innerHTML = html;
      listDiv.querySelectorAll('li').forEach(li => {
        li.onclick = function(e) {
          if(e.target.classList.contains('file-bower-renamebtn')) return; // 避免重命名按钮冒泡
          const p = this.getAttribute('data-path');
          const isDir = this.getAttribute('data-dir') === 'true';
          if(isDir) {
            // 目录点击：进入子目录（file/dir模式都允许）
            loadDir(p);
            if(type === 'dir') {
              // 选择目录时，允许选中当前目录（可选：可加一个“选中当前目录”按钮）
            }
          } else {
            // 文件点击：file模式可选中
            if(type === 'file') {
              selected = p;
              listDiv.querySelectorAll('li').forEach(x=>x.classList.remove('bg-blue-100','dark:bg-blue-900'));
              this.classList.add('bg-blue-100','dark:bg-blue-900');
              selectBtn.style.display = '';
            }
          }
        };
      });
      // 绑定重命名按钮事件
      listDiv.querySelectorAll('.file-bower-renamebtn').forEach(btn => {
        btn.onclick = function(e) {
          e.stopPropagation();
          const oldPath = this.getAttribute('data-path');
          const oldName = oldPath.split('/').pop();
          const newName = prompt('输入新名称', oldName);
          if(newName && newName !== oldName) {
            const newPath = oldPath.replace(/[^/]+$/, newName);
            API.request('/@adminapi/admin/renameFileOrDir?old_path=' + encodeURIComponent(oldPath) + '&new_path=' + encodeURIComponent(newPath), {}, {method:'POST', needToken:true})
              .then(res => {
                if(res.code === 1) loadDir(pathInput.value);
                else alert(res.message || '重命名失败');
              });
          }
        };
      });
    }
    upBtn.onclick = function() {
      let p = pathInput.value;
      if(p === '/' || p === '') return;
      let arr = p.split('/');
      arr.pop();
      if(arr.length === 0) arr = ['/'];
      loadDir(arr.join('/') || '/');
    };
    selectBtn.onclick = function() {
      let val = '';
      if(type === 'dir') val = selected || pathInput.value;
      else val = selected || pathInput.value;
      if(opt.onSelect) opt.onSelect(val);
      modal.classList.add('hidden');
    };
    // 新建文件/目录按钮事件
    modal.querySelector('#file-bower-newfilebtn').onclick = function() {
      const dir = pathInput.value;
      const name = prompt('输入新文件名');
      if(name) {
        API.request('/@adminapi/admin/createFile?path=' + encodeURIComponent(dir.replace(/\/$/, '') + '/' + name), {}, {method:'POST', needToken:true})
          .then(res => {
            if(res.code === 1) loadDir(dir);
            else alert(res.message || '创建失败');
          });
      }
    };
    modal.querySelector('#file-bower-newdirbtn').onclick = function() {
      const dir = pathInput.value;
      const name = prompt('输入新目录名');
      if(name) {
        API.request('/@adminapi/admin/createDir?path=' + encodeURIComponent(dir.replace(/\/$/, '') + '/' + name), {}, {method:'POST', needToken:true})
          .then(res => {
            if(res.code === 1) loadDir(dir);
            else alert(res.message || '创建失败');
          });
      }
    };
    modal.classList.remove('hidden');
    loadDir(curPath);
  };
})(); 