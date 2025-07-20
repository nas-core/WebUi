// 主题切换和主题设置模态框逻辑  采用用原生css 和js 切换主题兼容 bootstarp和tailwind
// 存储主题的 key
const THEME_KEY = 'nascore-theme';

// 动态插入主题切换弹窗CSS（自包含，无需外部依赖）
(function injectThemeModalCSS() {
  if (document.getElementById('theme-modal-style')) return;
  const style = document.createElement('style');
  style.id = 'theme-modal-style';
  style.textContent = `
  .theme-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.4);
  }
  .theme-modal-overlay.hidden { display: none; }
  .theme-modal-box {
    background: var(--bg-card, #fff);
    color: var(--text-main, #1f2937);
    border-radius: 1rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    width: 22rem;
    max-width: 96vw;
    padding: 2rem 1.5rem 1.5rem 1.5rem;
    border: 1px solid var(--border-main, #e5e7eb);
  }
  [data-theme='dark'] .theme-modal-box {
    background: var(--bg-card, #23272f);
    color: var(--text-main, #f3f4f6);
    border-color: var(--border-main, #2d2d31);
  }
  .theme-modal-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 1.2rem;
  }
  .theme-modal-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .theme-modal-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.7rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-main, #e5e7eb);
    background: none;
    color: inherit;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.15s, border 0.15s;
  }
  .theme-modal-btn:hover, .theme-modal-btn:focus {
    background: var(--bg-main, #f3f4f6);
  }
  [data-theme='dark'] .theme-modal-btn:hover, [data-theme='dark'] .theme-modal-btn:focus {
    background: #23272f;
  }
  .theme-modal-btn-active {
    border: 2px solid #2563eb;
    background: #e0e7ff;
  }
  [data-theme='dark'] .theme-modal-btn-active {
    border: 2px solid #60a5fa;
    background: #1e293b;
  }
  .theme-modal-icon {
    display: inline-block;
    width: 1.5em;
    height: 1.5em;
    vertical-align: middle;
  }
  .theme-modal-icon-light {
    background: linear-gradient(135deg, #ffe066 60%, #fffbe6 100%);
    border-radius: 50%;
    border: 2px solid #ffe066;
  }
  .theme-modal-icon-dark {
    background: linear-gradient(135deg, #23272f 60%, #18181b 100%);
    border-radius: 50%;
    border: 2px solid #23272f;
  }
  .theme-modal-icon-auto {
    background: linear-gradient(135deg, #60a5fa 60%, #e0e7ff 100%);
    border-radius: 50%;
    border: 2px solid #60a5fa;
  }
  .theme-modal-tip {
    font-size: 0.85rem;
    color: var(--text-secondary, #6b7280);
    margin-top: 1.2rem;
  }
  .theme-modal-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.2rem;
  }
  .theme-modal-close {
    padding: 0.4rem 1.2rem;
    border-radius: 0.4rem;
    border: none;
    background: var(--bg-main, #f3f4f6);
    color: var(--text-main, #1f2937);
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.15s;
  }
  .theme-modal-close:hover {
    background: #e5e7eb;
  }
  [data-theme='dark'] .theme-modal-close {
    background: #23272f;
    color: #f3f4f6;
  }
  [data-theme='dark'] .theme-modal-close:hover {
    background: #18181b;
  }
  `;
  document.head.appendChild(style);
})();

// 应用主题（兼容 data-theme 和 Tailwind dark class）
function applyTheme(theme) {
  // 1. 记住用户选择
  localStorage.setItem(THEME_KEY, theme);
  // 2. 兼容 tailwind/原生/Bootstrap
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (theme === 'auto') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}

// 获取当前主题
function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || 'auto';
}

// 更新主题文本显示
function updateThemeText(theme) {
  const themeTextElement = document.getElementById('currentThemeText');
  if (themeTextElement) {
    let themeText = '跟随系统';
    if (theme === 'light') themeText = '明亮模式';
    else if (theme === 'dark') themeText = '暗黑模式';
    themeTextElement.textContent = themeText;
  }
}

// 创建主题设置模态框（全部自定义class，不用tailwindcss类名）
function createThemeModal() {
  if (document.getElementById('themeModal')) return;
  const modal = document.createElement('div');
  modal.id = 'themeModal';
  modal.className = 'theme-modal-overlay hidden';
  modal.innerHTML = `
    <div class="theme-modal-box">
      <h2 class="theme-modal-title">主题设置</h2>
      <div class="theme-modal-options">
        <button class="theme-modal-btn" data-theme="light">
          <span class="theme-modal-icon theme-modal-icon-light"></span>
          <span>明亮主题</span>
        </button>
        <button class="theme-modal-btn" data-theme="dark">
          <span class="theme-modal-icon theme-modal-icon-dark"></span>
          <span>暗黑主题</span>
        </button>
        <button class="theme-modal-btn" data-theme="auto">
          <span class="theme-modal-icon theme-modal-icon-auto"></span>
          <span>跟随系统</span>
        </button>
      </div>
      <p class="theme-modal-tip">主题设置将保存在您的浏览器中。</p>
      <div class="theme-modal-footer">
        <button id="closeThemeModal" class="theme-modal-close">关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 关闭按钮
  document.getElementById('closeThemeModal').onclick = function() {
    modal.classList.add('hidden');
  };

  // 主题选项点击
  modal.querySelectorAll('.theme-modal-btn').forEach(btn => {
    btn.onclick = function() {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
      updateThemeText(theme);
      modal.classList.add('hidden');
    };
  });
}

// 打开主题设置模态框
function openThemeModal() {
  createThemeModal();
  const modal = document.getElementById('themeModal');
  // 高亮当前主题
  const currentTheme = getCurrentTheme();
  modal.querySelectorAll('.theme-modal-btn').forEach(btn => {
    if (btn.getAttribute('data-theme') === currentTheme) {
      btn.classList.add('theme-modal-btn-active');
    } else {
      btn.classList.remove('theme-modal-btn-active');
    }
  });
  modal.classList.remove('hidden');
}

// 绑定主题设置按钮
function bindThemeButton() {
  document.querySelectorAll('[data-action="open-theme-modal"]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      openThemeModal();
    });
  });
}

// 初始化主题
(function() {
  let theme = getCurrentTheme();
  if (!localStorage.getItem(THEME_KEY) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'auto';
  }
  applyTheme(theme);
  updateThemeText(theme);
  bindThemeButton();
})();

// 监听系统主题变化，auto 模式下同步切换
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    if (getCurrentTheme() === 'auto') {
      applyTheme('auto');
    }
  });
}
window.openThemeModal = openThemeModal; 