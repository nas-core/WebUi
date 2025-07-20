// 模态框组件
class Modal {
  constructor() {
    this.overlay = null;
    this.content = null;
    this.isOpen = false;
    this.onClose = null;
  }

  // 创建模态框容器
  createOverlay() {
    if (this.overlay) {
      return this.overlay;
    }

    this.overlay = document.createElement("div");
    this.overlay.className =
      "fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4";
    this.overlay.style.display = "none";

    this.content = document.createElement("div");
    this.content.className =
      "bg-gray-800 rounded-lg shadow-xl w-full max-w-md fade-in border border-gray-700";

    this.overlay.appendChild(this.content);
    document.body.appendChild(this.overlay);

    // 点击遮罩关闭模态框
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC键关闭模态框
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    return this.overlay;
  }

  // 显示模态框
  show(content, onClose = null) {
    this.createOverlay();
    this.content.innerHTML = content;
    this.overlay.style.display = "flex";
    this.isOpen = true;
    this.onClose = onClose;

    // 为关闭按钮添加事件监听器
    const closeBtn = this.content.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    // 为取消按钮添加事件监听器
    const cancelBtn = this.content.querySelector(".modal-cancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.close());
    }

    // 聚焦到第一个输入框
    setTimeout(() => {
      const firstInput = this.content.querySelector("input, textarea, select");
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  // 关闭模态框
  close() {
    if (!this.isOpen) return;

    this.overlay.style.display = "none";
    this.isOpen = false;

    if (this.onClose) {
      this.onClose();
    }
  }

  // 销毁模态框
  destroy() {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
      this.content = null;
    }
    this.isOpen = false;
    this.onClose = null;
  }

  // 创建基础模态框HTML结构
  createModalHTML(title, formContent, buttons = null) {
    const defaultButtons = `
      <button type="button" class="modal-cancel px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
        取消
      </button>
      <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
        保存
      </button>
    `;

    return `
      <div class="p-6">
        <div class="flex justify-between items-center pb-4 border-b border-gray-700 mb-4">
          <h3 class="text-xl font-semibold text-gray-100">${title}</h3>
          <button class="modal-close text-gray-400 hover:text-gray-100 focus:outline-none transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form class="modal-form">
          ${formContent}

          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-6">
            ${buttons || defaultButtons}
          </div>
        </form>
      </div>
    `;
  }

  // 显示链接编辑模态框
  async showLinkEditor(link = null, categories = [], onSave = null) {
    const isEdit = link !== null;
    const title = isEdit ? "编辑链接" : "添加链接";

    // 构建分类选项
    let categoryOptions = '<option value="0">无分类</option>';
    categories.forEach((cat) => {
      const selected = link && link.category_id === cat.id ? "selected" : "";
      categoryOptions += `<option value="${cat.id}" ${selected}>${cat.name}</option>`;
    });

    const formContent = `
      <div class="space-y-4">
        <div>
          <label for="link-title" class="block text-gray-300 text-sm font-medium mb-2">
            标题 <span class="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="link-title"
            name="title"
            value="${link ? link.title : ""}"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="请输入链接标题"
          />
        </div>

        <div>
          <label for="link-url" class="block text-gray-300 text-sm font-medium mb-2">
            网址 <span class="text-red-400">*</span>
          </label>
          <input
            type="url"
            id="link-url"
            name="url"
            value="${link ? link.url : ""}"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label for="link-description" class="block text-gray-300 text-sm font-medium mb-2">
            描述
          </label>
          <textarea
            id="link-description"
            name="description"
            rows="3"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            placeholder="可选的链接描述"
          >${link ? link.description : ""}</textarea>
        </div>

        <div>
          <label for="link-category" class="block text-gray-300 text-sm font-medium mb-2">
            分类
          </label>
          <select
            id="link-category"
            name="category_id"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            ${categoryOptions}
          </select>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="link-public"
            name="is_public"
            ${link && link.is_public ? "checked" : ""}
            class="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label for="link-public" class="ml-2 text-gray-300 text-sm">
            公开显示
          </label>
        </div>
      </div>
    `;

    // 添加删除按钮（如果是编辑模式）
    let buttons = null;
    if (isEdit) {
      buttons = `
        <button type="button" class="modal-delete px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
          删除
        </button>
        <div class="flex-1"></div>
        <button type="button" class="modal-cancel px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
          取消
        </button>
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          保存
        </button>
      `;
    }

    const modalHTML = this.createModalHTML(title, formContent, buttons);

    this.show(modalHTML, () => {
      // 清理事件监听器
    });

    // 绑定表单提交事件
    const form = this.content.querySelector(".modal-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const linkData = {
          id: link ? link.id : 0,
          title: formData.get("title").trim(),
          url: formData.get("url").trim(),
          description: formData.get("description").trim(),
          category_id: parseInt(formData.get("category_id")) || 0,
          is_public: formData.get("is_public") === "on",
        };

        // 验证必填字段
        if (!linkData.title) {
          alert("请输入链接标题");
          return;
        }
        if (!linkData.url) {
          alert("请输入链接地址");
          return;
        }

        if (onSave) {
          try {
            await onSave(linkData);
            this.close();
          } catch (error) {
            console.error("[links] 保存链接失败:", error);
            alert("保存失败: " + error.message);
          }
        }
      });
    }

    // 绑定删除按钮事件
    if (isEdit) {
      const deleteBtn = this.content.querySelector(".modal-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
          if (confirm("确定要删除这个链接吗？此操作不可撤销。")) {
            try {
              await window.api.deleteLink(link.id);
              // 从本地数据中移除
              const index = window.app.links.findIndex((l) => l.id === link.id);
              if (index !== -1) {
                window.app.links.splice(index, 1);
              }
              window.app.filterAndRenderLinks();
              this.close();
            } catch (error) {
              console.error("[links] 删除链接失败:", error);
              alert("删除失败: " + error.message);
            }
          }
        });
      }
    }
  }

  // 显示分类编辑模态框
  async showCategoryEditor(category = null, onSave = null) {
    const isEdit = category !== null;
    const title = isEdit ? "编辑分类" : "添加分类";

    const formContent = `
      <div class="space-y-4">
        <div>
          <label for="category-name" class="block text-gray-300 text-sm font-medium mb-2">
            分类名称 <span class="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="category-name"
            name="name"
            value="${category ? category.name : ""}"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="请输入分类名称"
          />
        </div>

        <div>
          <label for="category-sort" class="block text-gray-300 text-sm font-medium mb-2">
            排序值
          </label>
          <input
            type="number"
            id="category-sort"
            name="sort_num"
            value="${category ? category.sort_num : 0}"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="数值越大排序越靠前"
          />
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="category-public"
            name="is_public"
            ${category && category.is_public ? "checked" : ""}
            class="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label for="category-public" class="ml-2 text-gray-300 text-sm">
            公开显示
          </label>
        </div>
      </div>
    `;

    // 添加删除按钮（如果是编辑模式）
    let buttons = null;
    if (isEdit) {
      buttons = `
        <button type="button" class="modal-delete px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
          删除
        </button>
        <div class="flex-1"></div>
        <button type="button" class="modal-cancel px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
          取消
        </button>
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          保存
        </button>
      `;
    }

    const modalHTML = this.createModalHTML(title, formContent, buttons);

    this.show(modalHTML, () => {
      // 清理事件监听器
    });

    // 绑定表单提交事件
    const form = this.content.querySelector(".modal-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const categoryData = {
          id: category ? category.id : 0,
          name: formData.get("name").trim(),
          sort_num: parseInt(formData.get("sort_num")) || 0,
          is_public: formData.get("is_public") === "on",
        };

        // 验证必填字段
        if (!categoryData.name) {
          alert("请输入分类名称");
          return;
        }

        if (onSave) {
          try {
            await onSave(categoryData);
            this.close();
          } catch (error) {
            console.error("[links] 保存分类失败:", error);
            alert("保存失败: " + error.message);
          }
        }
      });
    }

    // 绑定删除按钮事件
    if (isEdit) {
      const deleteBtn = this.content.querySelector(".modal-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
          if (confirm("确定要删除这个分类吗？此操作不可撤销。")) {
            try {
              await window.api.deleteCategory(category.id);
              // 从本地数据中移除
              const index = window.app.categories.findIndex(
                (c) => c.id === category.id,
              );
              if (index !== -1) {
                window.app.categories.splice(index, 1);
              }
              // 重置选中的分类到"全部"
              if (window.app.selectedCategoryId === category.id) {
                window.app.selectedCategoryId = 0;
              }
              window.app.render();
              this.close();
            } catch (error) {
              console.error("[links] 删除分类失败:", error);
              alert("删除失败: " + error.message);
            }
          }
        });
      }
    }
  }

  // 显示确认对话框
  showConfirm(message, onConfirm = null) {
    const formContent = `
      <div class="text-center py-4">
        <div class="mb-4">
          <svg class="mx-auto w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.314 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <p class="text-gray-300 text-lg">${message}</p>
      </div>
    `;

    const buttons = `
      <button type="button" class="modal-cancel px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
        取消
      </button>
      <button type="button" class="modal-confirm px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
        确定
      </button>
    `;

    const modalHTML = this.createModalHTML("确认操作", formContent, buttons);

    this.show(modalHTML, () => {
      // 清理事件监听器
    });

    // 绑定确认按钮事件
    const confirmBtn = this.content.querySelector(".modal-confirm");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        if (onConfirm) {
          try {
            await onConfirm();
            this.close();
          } catch (error) {
            console.error("[links] 确认操作失败:", error);
            alert("操作失败: " + error.message);
          }
        } else {
          this.close();
        }
      });
    }
  }

  // 显示加载中对话框
  showLoading(message = "加载中...") {
    const formContent = `
      <div class="text-center py-8">
        <div class="mb-4">
          <svg class="animate-spin mx-auto w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p class="text-gray-300">${message}</p>
      </div>
    `;

    const modalHTML = `
      <div class="p-6">
        ${formContent}
      </div>
    `;

    this.show(modalHTML, () => {
      // 清理事件监听器
    });
  }
}

// 创建全局模态框实例
window.modal = new Modal();
