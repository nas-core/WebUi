// 通用文件/目录浏览器
// 用法: window.openFileBower({type: 'file'|'dir', startPath: '', onSelect: function(path){}})
(function(){
  if(window.openFileBower) return;
  // 创建弹窗DOM
  function createModal() {
    let modal = document.getElementById('file-bower-modal');
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = 'file-bower-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 hidden';
    modal.innerHTML = `
      <div class="bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
          <h3 class="text-lg font-semibold text-blue-700 dark:text-blue-400">选择文件/目录</h3>
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
    const modal = createModal();
    const pathInput = modal.querySelector('#file-bower-path');
    const listDiv = modal.querySelector('#file-bower-list');
    const upBtn = modal.querySelector('#file-bower-upbtn');
    const selectBtn = modal.querySelector('#file-bower-selectbtn');
    function loadDir(path) {
      pathInput.value = path;
      listDiv.innerHTML = '<div class="text-center text-gray-400 py-6">加载中...</div>';
      API.request('/@adminapi/admin/getDirectoryContents?path=' + encodeURIComponent(path), {}, {method:'GET', needToken:true})
        .then(res => {
          if(res.code !== 1 || !Array.isArray(res.data)) {
            listDiv.innerHTML = '<div class="text-center text-red-500 py-6">加载失败</div>';
            return;
          }
          renderList(res.data, path);
        })
        .catch(()=>{
          listDiv.innerHTML = '<div class="text-center text-red-500 py-6">加载失败</div>';
        });
    }
    function renderList(items, basePath) {
      let html = '<ul class="divide-y divide-gray-100 dark:divide-zinc-700">';
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
            loadDir(p);
          } else {
            selected = p;
            listDiv.querySelectorAll('li').forEach(x=>x.classList.remove('bg-blue-100','dark:bg-blue-900'));
            this.classList.add('bg-blue-100','dark:bg-blue-900');
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
            // TODO: 调用API重命名
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
      if(type === 'dir') val = pathInput.value;
      else val = selected || pathInput.value;
      if(opt.onSelect) opt.onSelect(val);
      modal.classList.add('hidden');
    };
    // 新建文件/目录按钮事件
    modal.querySelector('#file-bower-newfilebtn').onclick = function() {
      const dir = pathInput.value;
      const name = prompt('输入新文件名');
      if(name) {
        // TODO: 调用API新建文件
      }
    };
    modal.querySelector('#file-bower-newdirbtn').onclick = function() {
      const dir = pathInput.value;
      const name = prompt('输入新目录名');
      if(name) {
        // TODO: 调用API新建目录
      }
    };
    modal.classList.remove('hidden');
    loadDir(curPath);
  };
})(); 