// app.js - 原生JS主逻辑，结构清晰，支持拖拽排序和移动端
class App {
  constructor() {
    this.user = null;
    this.isAdmin = false;
    this.isLoggedIn = false;
    this.isEditMode = false;
    this.categories = [];
    this.links = [];
    this.filteredLinks = [];
    this.selectedCategoryId = 0;
    this.searchQuery = '';
    this.drag = { type: '', el: null, start: 0, placeholder: null };
    this.init();
  }
  // 初始化
  async init() {
    this.cacheDom();
    this.bindEvents();
    await this.checkAuth();
    await this.loadData();
    this.renderAll();
  }
  cacheDom() {
    this.dom = {
      userInfo: document.getElementById('user-info'),
      menuBtn: document.getElementById('menu-btn'),
      dropdownMenu: document.getElementById('dropdown-menu'),
      searchInput: document.getElementById('search-input'),
      categories: document.getElementById('categories-container'),
      links: document.getElementById('links-container'),
      empty: document.getElementById('empty-state'),
      toast: document.getElementById('toast-container'),
      loading: document.getElementById('loading-overlay'),
    };
  }
  bindEvents() {
    // 菜单
    this.dom.menuBtn.onclick = e => {
      e.stopPropagation();
      this.dom.dropdownMenu.style.display = this.dom.dropdownMenu.style.display === 'block' ? 'none' : 'block';
    };
    document.addEventListener('click', () => {
      this.dom.dropdownMenu.style.display = 'none';
    });
    // 搜索
    this.dom.searchInput.oninput = e => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterLinks();
      this.renderLinks();
    };
    // 拖拽（鼠标+触摸）
    this.dom.categories.addEventListener('mousedown', e => this.dragStart(e, 'category'));
    this.dom.categories.addEventListener('touchstart', e => this.dragStart(e, 'category'), {passive:false});
    this.dom.links.addEventListener('mousedown', e => this.dragStart(e, 'link'));
    this.dom.links.addEventListener('touchstart', e => this.dragStart(e, 'link'), {passive:false});
    document.addEventListener('mousemove', e => this.dragMove(e));
    document.addEventListener('touchmove', e => this.dragMove(e), {passive:false});
    document.addEventListener('mouseup', e => this.dragEnd(e));
    document.addEventListener('touchend', e => this.dragEnd(e));
  }
  // 拖拽排序
  dragStart(e, type) {
    if (!this.isEditMode) return;
    let target = e.target.closest(type==='category'?'.category-item':'.link-card');
    if (!target) return;
    if (!(e.target.classList.contains('drag-handle') || (e.touches && e.touches[0] && e.touches[0].target.classList.contains('drag-handle')))) return;
    e.preventDefault();
    this.drag.type = type;
    this.drag.el = target;
    this.drag.start = (e.clientY || (e.touches && e.touches[0].clientY));
    target.classList.add('dragging');
    // 占位符
    let ph = document.createElement('div');
    ph.className = type==='category'?'category-placeholder':'link-placeholder';
    target.parentNode.insertBefore(ph, target.nextSibling);
    this.drag.placeholder = ph;
  }
  dragMove(e) {
    if (!this.drag.el) return;
    e.preventDefault && e.preventDefault();
    let y = (e.clientY || (e.touches && e.touches[0].clientY));
    let container = this.drag.type==='category'?this.dom.categories:this.dom.links;
    let items = Array.from(container.children).filter(x=>x!==this.drag.el && !x.classList.contains('category-placeholder') && !x.classList.contains('link-placeholder'));
    let found = null;
    for (let item of items) {
      let rect = item.getBoundingClientRect();
      if (y < rect.top + rect.height/2) { found = item; break; }
    }
    if (found) container.insertBefore(this.drag.placeholder, found);
    else container.appendChild(this.drag.placeholder);
  }
  async dragEnd(e) {
    if (!this.drag.el) return;
    let container = this.drag.type==='category'?this.dom.categories:this.dom.links;
    let items = Array.from(container.children).filter(x=>!x.classList.contains('category-placeholder') && !x.classList.contains('link-placeholder'));
    let newIdx = Array.from(container.children).indexOf(this.drag.placeholder);
    let oldIdx = Array.from(container.children).indexOf(this.drag.el);
    if (newIdx !== oldIdx) {
      container.insertBefore(this.drag.el, this.drag.placeholder);
      if (this.drag.type==='category') await this.updateCategoriesSort();
      else await this.updateLinksSort();
      this.showToast('排序已更新','success');
    }
    this.drag.el.classList.remove('dragging');
    this.drag.placeholder.remove();
    this.drag = { type: '', el: null, start: 0, placeholder: null };
  }
  // 认证
  async checkAuth() {
    let info = window.api.getUserInfo();
    if (info) {
      this.user = info.username;
      this.isAdmin = info.isAdmin;
      this.isLoggedIn = true;
      this.dom.userInfo.textContent = '欢迎, ' + this.user + (this.isAdmin ? ' (管理员)' : '');
    } else {
      this.isLoggedIn = false;
      this.dom.userInfo.textContent = '未登录';
    }
  }
  // 数据加载
  async loadData() {
    this.showLoading(true);
    if (this.isLoggedIn) {
      [this.categories, this.links] = await Promise.all([
        window.api.getCategories(),
        window.api.getLinks()
      ]);
    } else {
      [this.categories, this.links] = await Promise.all([
        window.api.getCategories(true),
        window.api.getLinks(true)
      ]);
    }
    this.showLoading(false);
  }
  // 渲染
  renderAll() {
    this.renderCategories();
    this.filterLinks();
    this.renderLinks();
  }
  renderCategories() {
    let html = '';
    html += `<div class="category-item${this.selectedCategoryId===0?' selected':''}" data-id="0">全部</div>`;
    this.categories.sort((a,b)=>b.sort_num-a.sort_num).forEach(cat=>{
      html += `<div class="category-item${this.selectedCategoryId===cat.id?' selected':''}" data-id="${cat.id}">
        <span class="drag-handle" title="拖动排序">≡</span>
        <span>${cat.name}</span>
        <span class="category-badge">${cat.is_public?'🌍':'🔒'}</span>
      </div>`;
    });
    this.dom.categories.innerHTML = html;
    // 分类点击
    Array.from(this.dom.categories.querySelectorAll('.category-item')).forEach(el=>{
      el.onclick = e => {
        if (this.isEditMode && el.dataset.id!=='0') this.showEditCategoryModal(Number(el.dataset.id));
        else {
          this.selectedCategoryId = Number(el.dataset.id);
          this.renderCategories();
          this.filterLinks();
          this.renderLinks();
        }
      };
    });
  }
  filterLinks() {
    this.filteredLinks = this.links.filter(link=>{
      let catMatch = this.selectedCategoryId===0 || link.category_id===this.selectedCategoryId;
      let searchMatch = !this.searchQuery || link.title.toLowerCase().includes(this.searchQuery) || link.url.toLowerCase().includes(this.searchQuery) || (link.description||'').toLowerCase().includes(this.searchQuery);
      return catMatch && searchMatch;
    });
  }
  renderLinks() {
    if (!this.filteredLinks.length) {
      this.dom.links.innerHTML = '';
      this.dom.empty.style.display = '';
      return;
    }
    this.dom.empty.style.display = 'none';
    let html = '';
    this.filteredLinks.sort((a,b)=>b.sort_num-a.sort_num).forEach(link=>{
      html += `<div class="link-card" data-id="${link.id}">
        <span class="drag-handle" title="拖动排序">≡</span>
        <div class="link-title">${link.title}${link.is_public?'':'<span style=\"margin-left:0.5em;color:#aaa;\">🔒</span>'}</div>
        <div class="link-url">${link.url}</div>
        ${link.description?`<div class="link-desc">${link.description}</div>`:''}
      </div>`;
    });
    this.dom.links.innerHTML = html;
    // 链接点击
    Array.from(this.dom.links.querySelectorAll('.link-card')).forEach(el=>{
      el.onclick = e => {
        if (this.isEditMode) this.showEditLinkModal(Number(el.dataset.id));
        else {
          let link = this.links.find(l=>l.id===Number(el.dataset.id));
          if (link) window.open(link.url,'_blank');
        }
      };
    });
  }
  // 排序API
  async updateCategoriesSort() {
    let items = Array.from(this.dom.categories.querySelectorAll('.category-item')).filter(x=>x.dataset.id!=='0');
    let sortData = items.map((el,idx)=>({id:Number(el.dataset.id),sort_num:items.length-idx}));
    await window.api.updateCategoriesSort(sortData);
    sortData.forEach(item=>{
      let cat = this.categories.find(c=>c.id===item.id);
      if (cat) cat.sort_num = item.sort_num;
    });
  }
  async updateLinksSort() {
    let items = Array.from(this.dom.links.querySelectorAll('.link-card'));
    let sortData = items.map((el,idx)=>({id:Number(el.dataset.id),sort_num:items.length-idx}));
    await window.api.updateLinksSort(sortData);
    sortData.forEach(item=>{
      let link = this.links.find(l=>l.id===item.id);
      if (link) link.sort_num = item.sort_num;
    });
  }
  // 编辑模式
  toggleEditMode() {
    if (!this.isLoggedIn) return this.showToast('请先登录','error');
    this.isEditMode = !this.isEditMode;
    this.renderCategories();
    this.renderLinks();
  }
  // 分类/链接模态框
  showAddCategoryModal() {
    if (!this.isLoggedIn) return this.showToast('请先登录','error');
    window.modal.formModal({
      title:'添加分类',
      fields:[
        {label:'分类名称',name:'name',type:'text',required:true},
        {label:'排序值',name:'sort_num',type:'number',value:0},
        {label:'公开显示',name:'is_public',type:'checkbox',value:false,desc:'公开'},
      ],
      onSubmit: async data => {
        let newCat = await window.api.addCategory(data);
        this.categories.push(newCat);
        this.renderCategories();
        this.showToast('分类添加成功','success');
      }
    });
  }
  showEditCategoryModal(id) {
    let cat = this.categories.find(c=>c.id===id);
    if (!cat) return;
    window.modal.formModal({
      title:'编辑分类',
      fields:[
        {label:'分类名称',name:'name',type:'text',required:true,value:cat.name},
        {label:'排序值',name:'sort_num',type:'number',value:cat.sort_num},
        {label:'公开显示',name:'is_public',type:'checkbox',value:cat.is_public,desc:'公开'},
      ],
      isEdit:true,
      onSubmit: async data => {
        data.id = id;
        let updated = await window.api.updateCategory(data);
        let idx = this.categories.findIndex(c=>c.id===id);
        if (idx>-1) this.categories[idx]=updated;
        this.renderCategories();
        this.showToast('分类更新成功','success');
      },
      onDelete: async () => {
        await window.api.deleteCategory(id);
        this.categories = this.categories.filter(c=>c.id!==id);
        this.renderCategories();
        this.showToast('分类已删除','success');
      }
    });
  }
  showAddLinkModal() {
    if (!this.isLoggedIn) return this.showToast('请先登录','error');
    window.modal.formModal({
      title:'添加链接',
      fields:[
        {label:'标题',name:'title',type:'text',required:true},
        {label:'网址',name:'url',type:'url',required:true},
        {label:'描述',name:'description',type:'textarea'},
        {label:'分类',name:'category_id',type:'select',value:0,options:[{value:0,label:'无分类'}].concat(this.categories.map(c=>({value:c.id,label:c.name})))},
        {label:'公开显示',name:'is_public',type:'checkbox',value:false,desc:'公开'},
      ],
      onSubmit: async data => {
        let newLink = await window.api.addLink(data);
        this.links.push(newLink);
        this.filterLinks();
        this.renderLinks();
        this.showToast('链接添加成功','success');
      }
    });
  }
  showEditLinkModal(id) {
    let link = this.links.find(l=>l.id===id);
    if (!link) return;
    window.modal.formModal({
      title:'编辑链接',
      fields:[
        {label:'标题',name:'title',type:'text',required:true,value:link.title},
        {label:'网址',name:'url',type:'url',required:true,value:link.url},
        {label:'描述',name:'description',type:'textarea',value:link.description},
        {label:'分类',name:'category_id',type:'select',value:link.category_id,options:[{value:0,label:'无分类'}].concat(this.categories.map(c=>({value:c.id,label:c.name})))},
        {label:'公开显示',name:'is_public',type:'checkbox',value:link.is_public,desc:'公开'},
      ],
      isEdit:true,
      onSubmit: async data => {
        data.id = id;
        let updated = await window.api.updateLink(data);
        let idx = this.links.findIndex(l=>l.id===id);
        if (idx>-1) this.links[idx]=updated;
        this.filterLinks();
        this.renderLinks();
        this.showToast('链接更新成功','success');
      },
      onDelete: async () => {
        await window.api.deleteLink(id);
        this.links = this.links.filter(l=>l.id!==id);
        this.filterLinks();
        this.renderLinks();
        this.showToast('链接已删除','success');
      }
    });
  }
  // Toast
  showToast(msg, type='info') {
    let div = document.createElement('div');
    div.className = 'toast toast-'+type;
    div.textContent = msg;
    this.dom.toast.appendChild(div);
    setTimeout(()=>{div.style.opacity=0;setTimeout(()=>div.remove(),300);},3000);
  }
  // Loading
  showLoading(show) {
    this.dom.loading.style.display = show ? 'flex' : 'none';
  }
}
window.app = new App();
