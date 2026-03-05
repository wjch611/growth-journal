// main.js - 精简版：移除音乐控件，只保留核心功能 + 自动适配 GitHub Pages
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
  if (url.startsWith('http') || url.startsWith('blob')) return url;
  const cleanUrl = url.replace(/^\//, '');
  return BASE_PATH + cleanUrl;
};

// 配置
const ITEMS_PER_PAGE = 3;
let currentPage = 1;
let currentSearchKeyword = '';
let allEntries = [];

// 搜索框变量
let searchContainer = null;
let searchInput = null;
let searchToggleBtn = null;

// ========== 搜索框初始化 ==========
function initSearchBox() {
  if (document.getElementById('search-toggle-btn')) return;

  searchToggleBtn = document.createElement('button');
  searchToggleBtn.id = 'search-toggle-btn';
  searchToggleBtn.innerHTML = '🔍';
  searchToggleBtn.title = '搜索日记';
  document.body.appendChild(searchToggleBtn);

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
          if (prevFilename) finalHtml += `<a href="entries/${prevFilename}" class="nav-link prev" data-entry-link style="margin:0 2.5rem; color:#a78bfa; text-decoration:none;">← 上一篇</a>`;
        }
        if (currentIndex < allEntries.length - 1) {
          const next = allEntries[currentIndex + 1];
          const nextFilename = next.filename || (next.date ? `${next.date}.md` : null);
          if (nextFilename) finalHtml += `<a href="entries/${nextFilename}" class="nav-link next" data-entry-link style="margin:0 2.5rem; color:#a78bfa; text-decoration:none;">下一篇 →</a>`;
        }
        finalHtml += '</div>';
      }
      contentEl.innerHTML = finalHtml;
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
    })
    .catch(err => {
      console.error(err);
      showError('无法加载文章', err.message + '<br>请求地址: ' + fetchUrl);
    });
}

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

// 初始化
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
    const updateOpacity = (val) => {
      const fixed = parseFloat(val).toFixed(2);
      document.documentElement.style.setProperty('--content-bg-opacity', fixed);
      opacityValueSpan.textContent = fixed;
      fixed <= 0.01 ? contentEl.setAttribute('data-opacity', '0') : contentEl.removeAttribute('data-opacity');
    };
    updateOpacity(opacitySlider.value);
    opacitySlider.addEventListener('input', (e) => updateOpacity(e.target.value));
  }

  // 引用轮播
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
  setInterval(updateQuote, 30000);
});