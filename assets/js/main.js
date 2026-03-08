// main.js - 精简版：保留核心功能 + 自动代码高亮 + 代码透明度同步 + 复制按钮 + 图片自适应 + 自动适配 GitHub Pages + 长代码折叠及遮罩 + 平滑圆角 + 图片路径鲁棒解析 + 滚动条透明
const contentEl = document.getElementById('content');

// ========== 路径修复逻辑：自动识别 GitHub 仓库名 ==========
const getBasePath = () => {
  if (window.location.hostname.includes('github.io')) {
    return '/growth-journal/';
  }
  return '/';
};
const BASE_PATH = getBasePath();


const fixUrl = (url) => {
  if (!url) return '';

  // 已经是完整 URL，直接返回
  if (url.startsWith('http') || url.startsWith('blob') || url.startsWith('data:')) {
    return url;
  }

  // 移除开头的斜杠，得到纯相对路径
  let cleanUrl = url.replace(/^\//, '');

  // 如果 BASE_PATH 是 '/'（本地开发或根部署），直接返回 cleanUrl
  if (BASE_PATH === '/' || BASE_PATH === '') {
    return '/' + cleanUrl;
  }

  // 提取仓库名（去掉前后斜杠）
  const repoName = BASE_PATH.replace(/^\//, '').replace(/\/$/, '');

  // 如果 cleanUrl 已经以仓库名开头（GitHub Pages 常见情况），直接返回 / + cleanUrl（避免重复）
  if (cleanUrl.startsWith(repoName + '/')) {
    return '/' + cleanUrl;
  }

  // 正常情况：前面拼接 BASE_PATH
  return BASE_PATH + cleanUrl;
};


// ========== 注入滚动条透明样式（WebKit + Firefox） ==========
(function injectScrollbarStyle() {
  const style = document.createElement('style');
  style.id = 'code-scrollbar-style';
  style.innerHTML = `
/* 代码块内部滚动条 - WebKit */
.code-wrapper pre::-webkit-scrollbar { width: 10px; height: 8px; background: transparent; }
.code-wrapper pre::-webkit-scrollbar-track { background: transparent; }
.code-wrapper pre::-webkit-scrollbar-thumb { background: rgba(0,0,0,0); border-radius: 8px; }
/* Firefox */
.code-wrapper pre { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0) rgba(0,0,0,0); }
/* 若需要更显眼，可调整 rgba(0,0,0,0.12) 之类的值 */
`;
  document.head.appendChild(style);
})();

// ========== 归一化路径函数：支持 ../ ./ / absolute 和在 file:// 下的回退 ==========
function normalizePath(basePath, relativePath) {
  try {
    const origin = window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : (window.location.protocol === 'file:' ? 'file:///' + (window.location.pathname || '') : window.location.origin);

    let baseCandidate = basePath;
    if (!baseCandidate.startsWith('/')) baseCandidate = '/' + baseCandidate;
    if (!baseCandidate.endsWith('/')) baseCandidate = baseCandidate + '/';

    const baseForUrl = origin + baseCandidate;
    const u = new URL(relativePath, baseForUrl);
    return u.pathname + (u.search || '') + (u.hash || '');
  } catch (e) {
    const baseParts = (basePath || '').split('/').filter(Boolean);
    const relParts = (relativePath || '').split('/');
    const stack = baseParts.slice();
    relParts.forEach(part => {
      if (part === '..') {
        if (stack.length) stack.pop();
      } else if (part === '.') {
      } else if (part) {
        stack.push(part);
      }
    });
    return '/' + stack.join('/');
  }
}

// ========== 复制函数（兼容回退） ==========
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error('execCommand copy failed'));
    } catch (e) {
      document.body.removeChild(ta);
      reject(e);
    }
  });
}

// ========== 其余原有配置 ==========
const ITEMS_PER_PAGE = 3;
let currentPage = 1;
let currentSearchKeyword = '';
let allEntries = [];
let currentOpacity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--content-bg-opacity')) || 1;

// 搜索框变量
let searchContainer = null;
let searchInput = null;
let searchToggleBtn = null;

// 记录上一次阅读的文章路径（用于从搜索结果返回）
let lastViewedArticleUrl = null;
let lastViewedArticleIndex = -1;

// ========== 自动加载 highlight.js ==========
(function loadHighlightJS() {
  if (!window.hljs) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
    script.onload = () => { /* hljs 自动可用 */ };
    document.head.appendChild(script);
  }
})();

// ========== 搜索框初始化（美化版） ==========
function initSearchBox() {
  if (document.getElementById('search-toggle-btn')) return;

  // 注入搜索框专属样式（玻璃感 + 呼吸 + 聚焦发光 + 涟漪）
  const style = document.createElement('style');
  style.id = 'search-box-style';
  style.innerHTML = `
    #search-toggle-btn {
      position: fixed;
      top: 16px;
      left: 16px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(40,40,80,0.75), rgba(20,20,50,0.75));
      backdrop-filter: blur(12px);
      border: 1px solid rgba(167,139,250,0.35);
      color: #a78bfa;
      font-size: 1.4rem;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 0 rgba(167,139,250,0.3);
      transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    #search-toggle-btn:hover {
      transform: scale(1.12) translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(167,139,250,0.6);
      color: #ffffff;
      animation: pulse-ring 2s infinite;
    }

    #search-toggle-btn:active {
      transform: scale(0.94);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }

    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(167,139,250,0.4); }
      70% { box-shadow: 0 0 0 12px rgba(167,139,250,0); }
      100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); }
    }

    #diary-search-container {
      position: fixed;
      top: 78px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px) scale(0.95);
      opacity: 0;
      visibility: hidden;
      z-index: 10002;
      width: 100%;
      max-width: 460px;
      padding: 0 1.5rem;
      transition: all 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    #diary-search-container.show {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0) scale(1);
    }

    #diary-search-input {
      width: 100%;
      padding: 1rem 1.4rem;
      font-size: 1.08rem;
      border: 1px solid rgba(167,139,250,0.35);
      border-radius: 16px;
      background: rgba(15,15,45,0.88);
      backdrop-filter: blur(16px);
      color: #e0e0ff;
      outline: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    }

    #diary-search-input:focus {
      border-color: #a78bfa;
      box-shadow: 0 0 0 4px rgba(167,139,250,0.25);
      background: rgba(20,20,50,0.92);
      color: #ffffff;
    }

    #diary-search-input::placeholder {
      color: rgba(224,224,255,0.5);
      transition: opacity 0.3s ease;
    }

    #diary-search-input:focus::placeholder {
      opacity: 0.3;
    }

    /* 输入中轻微发光 */
    #diary-search-input:not(:placeholder-shown) {
      box-shadow: 0 0 20px rgba(167,139,250,0.2);
    }
  `;
  document.head.appendChild(style);

  // 创建搜索触发按钮
  searchToggleBtn = document.createElement('button');
  searchToggleBtn.id = 'search-toggle-btn';
  searchToggleBtn.innerHTML = '🔍';
  searchToggleBtn.title = '搜索日记';
  document.body.appendChild(searchToggleBtn);

  // 创建搜索容器
  searchContainer = document.createElement('div');
  searchContainer.id = 'diary-search-container';
  searchContainer.innerHTML = `
    <input type="text" id="diary-search-input" placeholder="搜索标题、日期或内容..." autocomplete="off">
  `;
  document.body.appendChild(searchContainer);

  searchInput = document.getElementById('diary-search-input');

  function toggleSearchBox(show = null) {
    const isVisible = searchContainer.classList.contains('show');
    const shouldShow = show !== null ? show : !isVisible;

    if (shouldShow) {
      // 进入搜索前，记录当前文章状态
      if (!currentSearchKeyword) {
        // 如果当前不是搜索结果页，记录当前页面（文章或列表）
        const currentState = history.state;
        if (currentState && currentState.type === 'md') {
          lastViewedArticleUrl = currentState.url;
          lastViewedArticleIndex = currentState.index ?? -1;
        } else {
          lastViewedArticleUrl = null;
          lastViewedArticleIndex = -1;
        }
      }

      searchContainer.classList.add('show');
      setTimeout(() => {
        searchInput.focus();
        if (searchInput.value.trim()) {
          currentSearchKeyword = searchInput.value.trim();
          loadAllEntries();
        }
      }, 300);
    } else {
      searchContainer.classList.remove('show');
      searchInput.blur(); // 收起时失焦

      // 退出搜索时，优先恢复上次阅读的文章
      if (lastViewedArticleUrl) {
        loadMarkdown(lastViewedArticleUrl, lastViewedArticleIndex);
        lastViewedArticleUrl = null;  // 清空记录，避免重复使用
        lastViewedArticleIndex = -1;
      } else {
        // 如果没有上次文章记录，则回到列表
        currentSearchKeyword = '';
        loadAllEntries();
      }
    }
  }

  searchToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSearchBox();
  });

  searchInput.addEventListener('input', (e) => {
    currentSearchKeyword = e.target.value.trim();
    currentPage = 1;
    loadAllEntries();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchContainer.classList.contains('show')) {
      toggleSearchBox(false);
    }
  });

  document.addEventListener('click', (e) => {
    if (searchContainer.classList.contains('show') &&
        !searchContainer.contains(e.target) &&
        e.target.id !== 'search-toggle-btn') {
      toggleSearchBox(false);
    }
  });
}

function showLoading() {
  contentEl.innerHTML = '<div class="loading" style="text-align:center; padding:6rem 1rem; color:#888;">加载中...</div>';
}

function showError(message, detail = '') {
  contentEl.innerHTML = `
    <div style="text-align:center; padding:6rem 1rem; color:#ff6b6b;">
      <h3>加载失败</h3>
      <p>${message}</p>
      ${detail ? `<small>${detail}</small>` : ''}
    </div>`;
}

// ========== 渲染 Markdown 并优化代码块和图片 ==========
function loadMarkdown(url, currentIndex = -1) {
  showLoading();
  const fetchUrl = fixUrl(url);

  fetch(fetchUrl)
    .then(res => {
      if (!res.ok) throw new Error(`文件加载失败 (${res.status})`);
      return res.text();
    })
    .then(md => {
      const html = marked.parse(md);

      let finalHtml = `<div class="markdown-content">${html}</div>`;

      if (currentIndex >= 0 && allEntries.length > 1) {
        finalHtml += '<div class="article-nav" style="margin-top:3rem; padding-top:2rem; border-top:1px solid rgba(120,140,255,0.25); text-align:center; font-size:1.1rem;">';
        if (currentIndex > 0) {
          const prev = allEntries[currentIndex - 1];
          const prevFilename = prev.filename || (prev.date ? `${prev.date}.md` : null);
          if (prevFilename) finalHtml += `<a href="entries/${prevFilename}" class="nav-link prev" data-entry-link style="margin:0 1.5rem; color:#a78bfa; text-decoration:none;">← 上一篇</a>`;
        }
        if (currentIndex < allEntries.length - 1) {
          const next = allEntries[currentIndex + 1];
          const nextFilename = next.filename || (next.date ? `${next.date}.md` : null);
          if (nextFilename) finalHtml += `<a href="entries/${nextFilename}" class="nav-link next" data-entry-link style="margin:0 1.5rem; color:#a78bfa; text-decoration:none;">下一篇 →</a>`;
        }
        finalHtml += `<button id="exit-article-btn" style="margin-left:2rem; padding:0.3rem 0.8rem; font-size:1rem; border:none; border-radius:4px; background:#a78bfa; color:#fff; cursor:pointer;">返回</button>`;
        finalHtml += '</div>';
      }

      contentEl.innerHTML = finalHtml;

      const mdBase = (() => {
        try {
          const p = fetchUrl.split('?')[0].split('#')[0];
          if (p.endsWith('/')) return p;
          const idx = p.lastIndexOf('/');
          return idx !== -1 ? p.slice(0, idx + 1) : '/';
        } catch (e) {
          return '/';
        }
      })();

      contentEl.querySelectorAll('.markdown-content img').forEach(img => {
        const rawSrc = img.getAttribute('src') || '';
        let resolved = rawSrc;

        if (!/^(\w+:)?\/\//.test(rawSrc) && !rawSrc.startsWith('data:') && !rawSrc.startsWith('blob:')) {
          if (rawSrc.startsWith('/')) {
            resolved = (BASE_PATH + rawSrc.replace(/^\//, '')).replace(/\/\/+/g, '/');
          } else {
            resolved = normalizePath(mdBase, rawSrc);
            resolved = resolved.replace(/\/\/+/g, '/');
          }
        }

        img.src = resolved;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '1.5rem auto';
        img.style.borderRadius = '10px';
        img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      });

      contentEl.querySelectorAll('.markdown-content pre > code').forEach(code => {
        const pre = code.parentElement;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        wrapper.style.position = 'relative';
        wrapper.style.margin = '1.5rem 0';
        wrapper.style.borderRadius = '10px';
        wrapper.style.overflow = 'hidden';
        wrapper.style.backgroundColor = `rgba(30, 30, 47, ${currentOpacity})`;
        wrapper.style.transition = 'background-color 0.18s ease';

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        pre.style.overflowX = 'auto';
        pre.style.margin = '0';
        pre.style.padding = '2.5rem 1rem 1rem 1rem';
        pre.style.backgroundColor = 'transparent';
        pre.style.border = 'none';
        pre.style.maxHeight = 'none';
        pre.style.boxSizing = 'border-box';

        code.style.whiteSpace = 'pre';
        code.style.fontFamily = 'Fira Code, monospace';
        code.style.fontSize = '0.95rem';
        code.style.lineHeight = '1.5';
        code.style.display = 'block';

        if (window.hljs && typeof hljs.highlightElement === 'function') {
          try { hljs.highlightElement(code); } catch (e) { /* ignore */ }
        }

        const copyBtn = document.createElement('button');
        copyBtn.innerText = '复制';
        copyBtn.type = 'button';
        copyBtn.style.position = 'absolute';
        copyBtn.style.top = '0.6rem';
        copyBtn.style.right = '0.6rem';
        copyBtn.style.padding = '0.28rem 0.6rem';
        copyBtn.style.fontSize = '0.75rem';
        copyBtn.style.border = 'none';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.background = '#a78bfa';
        copyBtn.style.color = '#fff';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.zIndex = '12';
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          copyText(code.textContent || code.innerText).then(() => {
            const prev = copyBtn.innerText;
            copyBtn.innerText = '已复制';
            setTimeout(() => { copyBtn.innerText = prev; }, 1200);
          }).catch(() => {
            const prev = copyBtn.innerText;
            copyBtn.innerText = '复制失败';
            setTimeout(() => { copyBtn.innerText = prev; }, 1200);
          });
        });
        wrapper.appendChild(copyBtn);

        const MAX_HEIGHT = 400;
        const mask = document.createElement('div');
        mask.className = 'code-mask';
        mask.style.position = 'absolute';
        mask.style.bottom = '0';
        mask.style.left = '0';
        mask.style.width = '100%';
        mask.style.height = '88px';
        mask.style.background = `linear-gradient(to bottom, transparent, rgba(30, 30, 47, ${currentOpacity}))`;
        mask.style.pointerEvents = 'none';
        mask.style.transition = 'opacity 0.2s ease';
        mask.style.zIndex = '8';

        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = '展开';
        toggleBtn.type = 'button';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.top = '0.6rem';
        toggleBtn.style.right = '4.2rem';
        toggleBtn.style.padding = '0.28rem 0.6rem';
        toggleBtn.style.fontSize = '0.75rem';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.style.background = '#6b7280';
        toggleBtn.style.color = '#fff';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.zIndex = '12';
        toggleBtn.style.display = 'none';

        requestAnimationFrame(() => {
          if (pre.scrollHeight > MAX_HEIGHT + 6) {
            pre.style.maxHeight = `${MAX_HEIGHT}px`;
            pre.style.overflowY = 'auto';
            pre.style.webkitOverflowScrolling = 'touch';
            wrapper.appendChild(mask);
            toggleBtn.style.display = 'inline-block';
            toggleBtn.innerText = '展开';
            wrapper.appendChild(toggleBtn);
          } else {
            pre.style.maxHeight = 'none';
            pre.style.overflowY = 'auto';
            mask.style.opacity = '0';
            toggleBtn.style.display = 'none';
          }
        });

        let isExpanded = false;
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          isExpanded = !isExpanded;
          if (isExpanded) {
            pre.style.maxHeight = `${pre.scrollHeight + 60}px`;
            pre.style.overflowY = 'auto';
            mask.style.opacity = '0';
            toggleBtn.innerText = '折叠';
            setTimeout(() => {
              if (isExpanded) pre.style.maxHeight = 'none';
            }, 260);
          } else {
            pre.style.maxHeight = `${MAX_HEIGHT}px`;
            pre.style.overflowY = 'auto';
            mask.style.opacity = '1';
            toggleBtn.innerText = '展开';
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });

      const h1 = contentEl.querySelector('h1');
      document.title = h1 ? h1.textContent.trim() + ' | 我的成长日记' : '我的成长日记';
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      history.pushState({ type: 'md', url: fetchUrl, index: currentIndex }, '', fetchUrl);

      contentEl.querySelectorAll('[data-entry-link]').forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          const targetUrl = link.getAttribute('href');
          const targetIndex = allEntries.findIndex(item => {
            const fname = item.filename || (item.date ? `${item.date}.md` : '');
            return `entries/${fname}` === targetUrl;
          });
          loadMarkdown(targetUrl, targetIndex);
        });
      });

      const exitBtn = document.getElementById('exit-article-btn');
      if (exitBtn) {
        exitBtn.addEventListener('click', () => {
          currentSearchKeyword = '';
          loadAllEntries();
        });
      }
    })
    .catch(err => {
      console.error(err);
      showError('无法加载文章', err.message + '<br>请求地址: ' + fetchUrl);
    });
}

// ========== 透明度控制函数 ==========
function updateContentOpacity(val) {
  const fixed = Math.max(0, Math.min(1, parseFloat(val))) || 0;
  currentOpacity = fixed;
  document.documentElement.style.setProperty('--content-bg-opacity', fixed);
  if (fixed <= 0.01) contentEl.setAttribute('data-opacity', '0'); else contentEl.removeAttribute('data-opacity');

  contentEl.querySelectorAll('.code-wrapper').forEach(wrapper => {
    wrapper.style.backgroundColor = `rgba(30, 30, 47, ${fixed})`;
  });
  contentEl.querySelectorAll('.code-mask').forEach(mask => {
    mask.style.background = `linear-gradient(to bottom, transparent, rgba(30, 30, 47, ${fixed}))`;
  });
}

// ========== renderDiaryList / loadAllEntries / DOMContentLoaded 初始化逻辑 ==========
function renderDiaryList(page = 1) {
  let filtered = allEntries;
  if (currentSearchKeyword) {
    const kw = currentSearchKeyword.toLowerCase();
    filtered = allEntries.filter(item => {
      return (
        (item.title || '').toLowerCase().includes(kw) ||
        (item.preview || '').toLowerCase().includes(kw) ||
        (item.date || '').toLowerCase().includes(kw)
      );
    });
  }
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, end);

  let html = '';
  if (filtered.length === 0 && currentSearchKeyword) {
    html += '<p style="text-align:center; color:#888; margin:4rem 0; font-size:1.2rem;">没有找到匹配的日记</p>';
  } else if (filtered.length === 0) {
    html += '<h2 style="text-align:center; margin:4rem 0;">暂无日记</h2>';
  } else {
    html += `<p style="opacity:0.8; margin-bottom:1.5rem; text-align:center;">
      共 ${filtered.length} 篇匹配结果 | 第 ${page} / ${totalPages} 页
    </p>`;
  }

  html += '<div class="diary-list">';
  pageItems.forEach(item => {
    const filename = item.filename || (item.date ? `${item.date}.md` : null);
    if (!filename) return;
    const displayDate = item.date || filename.replace(/\.md$/i, '');
    const title = item.title || '未命名日记';
    const preview = item.preview || '(无摘要)';
    html += `
      <a href="entries/${filename}" class="diary-item" data-entry-link>
        <div class="diary-date">${displayDate}</div>
        <div class="diary-title">${title}</div>
        <div class="diary-preview">${preview}</div>
      </a>
    `;
  });
  html += '</div>';

  if (totalPages > 1) {
    html += '<div class="pagination" style="text-align:center; margin:2.5rem 0; font-size:1.1rem; color:#c0c8ff;">';
    if (page > 1) html += `<button class="page-btn" data-page="${page-1}">上一页</button> `;
    html += `<span>第 ${page} 页 / 共 ${totalPages} 页</span>`;
    if (page < totalPages) html += ` <button class="page-btn" data-page="${page+1}">下一页</button>`;
    html += '</div>';
  }

  contentEl.innerHTML = html;

  contentEl.querySelectorAll('[data-entry-link]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetUrl = link.getAttribute('href');
      const targetIndex = allEntries.findIndex(item => {
        const fname = item.filename || (item.date ? `${item.date}.md` : '');
        return `entries/${fname}` === targetUrl;
      });
      loadMarkdown(targetUrl, targetIndex);
    });
  });

  contentEl.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      currentPage = parseInt(e.target.dataset.page);
      renderDiaryList(currentPage);
    });
  });
}

function loadAllEntries() {
  showLoading();
  const possibleUrls = ['entries/index.json', 'index.json'];
  let attempt = 0;

  function tryNext() {
    if (attempt >= possibleUrls.length) {
      showError('无法加载日记列表', '所有 index.json 都加载失败');
      return;
    }

    const fetchUrl = fixUrl(possibleUrls[attempt]);

    fetch(fetchUrl)
      .then(res => {
        if (!res.ok) throw new Error(`加载失败 (${res.status})`);
        return res.json();
      })
      .then(entries => {
        entries.sort((a, b) => (b.date || '0000-00-00').localeCompare(a.date || '0000-00-00'));
        allEntries = entries;
        currentPage = 1;

        if (entries.length === 0) {
          contentEl.innerHTML = '<h2 style="text-align:center; margin:4rem 0;">暂无日记</h2>';
          return;
        }

        renderDiaryList(currentPage);
        document.title = '所有日记 | 我的成长日记';
        document.querySelectorAll('.nav-item').forEach(el => {
          el.classList.toggle('active', el.id === 'all-diaries-link');
        });
        history.pushState({ type: 'list' }, '', '#all');
      })
      .catch(err => {
        console.warn(`尝试 ${fetchUrl} 失败:`, err);
        attempt++;
        tryNext();
      });
  }
  tryNext();
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initSearchBox();

  document.getElementById('all-diaries-link')?.addEventListener('click', e => {
    e.preventDefault();
    currentSearchKeyword = '';
    loadAllEntries();
  });

  document.querySelectorAll('[data-link]:not(#all-diaries-link)').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      loadMarkdown(link.getAttribute('href'));
    });
  });

  window.addEventListener('popstate', e => {
    const state = e.state || {};
    if (state.type === 'list' || location.hash === '#all') {
      loadAllEntries();
    } else if (state.type === 'md' && state.url) {
      loadMarkdown(state.url, state.index ?? -1);
    } else {
      loadMarkdown('about.md');
    }
  });

  if (location.hash === '#all') {
    loadAllEntries();
  } else {
    loadMarkdown('about.md');
  }

  const opacitySlider = document.getElementById('ctrl-content-opacity');
  const opacityValueSpan = document.getElementById('val-content-opacity');
  if (opacitySlider && opacityValueSpan) {
    updateContentOpacity(opacitySlider.value);
    opacitySlider.addEventListener('input', (e) => updateContentOpacity(e.target.value));
  }

  const quotes = [
    { text: "我们都是星星的孩子。"},
    { text: "我们来自星辰，也将奔赴星辰。"},
    { text: "我们都在阴沟里，但仍有人仰望星空。"},
    { text: "每一个不曾起舞的日子，都是对生命的辜负。"}
  ];

  let currentQuoteIndex = 0;
  const quoteElement = document.getElementById('quote-content');
  const container = document.getElementById('quote-container');

  function updateQuote() {
    container.classList.add('quote-fade');
    setTimeout(() => {
      const quote = quotes[currentQuoteIndex];
      quoteElement.innerText = `“${quote.text}”`;
      currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
      container.classList.remove('quote-fade');
    }, 500);
  }

  updateQuote();
  setInterval(updateQuote, 10000);
});