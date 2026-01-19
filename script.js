// 페이지 설정
const pages = {
  regex: {
    html: 'RegexDesigner/index.html',
    css: 'RegexDesigner/style.css',
    js: ['RegexDesigner/presets.js', 'RegexDesigner/script.js'],
    title: '🎨 ST 정규식 디자인 미리보기'
  },
  comma: {
    html: 'Comma/index.html',
    css: 'Comma/style.css',
    js: 'Comma/script.js',
    title: '📝 쉼표 제거기'
  },
  theme: {
    html: 'Theme/index.html',
    css: 'Theme/style.css',
    js: 'Theme/script.js',
    title: '🔍 테마 & TXT 뷰어'
  }
};

let currentPage = null;
let loadedScripts = new Set();

async function loadPage(pageName) {
  if (currentPage === pageName) return;
  
  const page = pages[pageName];
  if (!page) return;

    // 완전히 새로 시작하려면 페이지 리로드
  if (loadedScripts.size > 0 && currentPage !== null) {
    // 쿼리 파라미터로 페이지 전달 후 리로드
    window.location.href = `?page=${pageName}`;
    return;
  }

  try {
    const response = await fetch(page.html);
    const html = await response.text();
    document.getElementById('app').innerHTML = html;

    if (page.css) loadCSS(page.css);

    if (page.js) {
      const scripts = Array.isArray(page.js) ? page.js : [page.js];
      for (const src of scripts) {
        await loadJS(src);
        loadedScripts.add(src);
      }
    }

    const titleElement = document.getElementById('page-title');
    if (titleElement && page.title) {
      titleElement.textContent = page.title;
    }

    // 페이지별 초기화
    if (pageName === 'regex' && typeof initApp === 'function') {
      setTimeout(initApp, 0);
    } else if (pageName === 'comma' && typeof initComma === 'function') {
      setTimeout(initComma, 0);
    } else if (pageName === 'theme' && typeof initThemeEditor === 'function') {
      setTimeout(initThemeEditor, 0);
    }

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageName);
    });

    currentPage = pageName;

    document.getElementById('dropdown-menu').classList.add('hidden');
    document.querySelector('.dropdown-title').classList.remove('open');

  } catch (error) {
    console.error('페이지 로드 실패:', error);
    document.getElementById('app').innerHTML = '<h1>페이지를 불러올 수 없습니다.</h1>';
  }
}

function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.className = 'page-css';
  document.head.appendChild(link);
}

function loadJS(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.className = 'page-js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function toggleDropdown(e) {
  document.getElementById('dropdown-menu').classList.toggle('hidden');
  e.currentTarget.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const dropdown = document.querySelector('.menu-dropdown');
  if (!dropdown.contains(e.target)) {
    document.getElementById('dropdown-menu').classList.add('hidden');
    document.querySelector('.dropdown-title').classList.remove('open');
  }
});

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => loadPage(btn.dataset.page));
});

// URL 파라미터 확인
const urlParams = new URLSearchParams(window.location.search);
const initialPage = urlParams.get('page') || 'regex';
loadPage(initialPage);
