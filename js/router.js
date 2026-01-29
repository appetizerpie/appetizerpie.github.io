class Router {
    constructor() {
        this.routes = {
            '/': {
                template: 'pages/st-regex/index.html',
                scripts: [
                    'pages/st-regex/presets.js',
                    'pages/st-regex/script.js'
                ],
                styles: ['pages/st-regex/style.css'],
                title: '정규식 디자인 미리보기'
            },
            '/theme-viewer': {
                template: 'pages/theme-viewer/index.html',
                scripts: ['pages/theme-viewer/script.js'],
                styles: ['pages/theme-viewer/style.css'],
                title: '테마 & TXT 뷰어'
            },
            '/schema-design': {
                template: 'pages/schema-design/index.html',
                scripts: [
                    'pages/schema-design/presets.js',
                    'pages/schema-design/script.js'
                ],
                styles: ['pages/schema-design/style.css'],
                title: '스키마 디자인 미리보기'
            }
        };

        this.app = document.getElementById('app');
        this.currentScripts = [];
        this.currentStyles = [];
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

async handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes[hash];
    
    if (!route) {
        this.app.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h1>404</h1>
                <p>페이지를 찾을 수 없습니다.</p>
                <a href="#/">홈으로 돌아가기</a>
            </div>
        `;
        return;
    }

    try {
        // ✅ 1. 페이드아웃
        this.app.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 200));

        // 이전 리소스 정리
        this.cleanup();

        // HTML 로드
        const response = await fetch(route.template);
        if (!response.ok) {
            throw new Error(`템플릿 로드 실패: ${response.status}`);
        }
        const html = await response.text();
        this.app.innerHTML = html;

        if (window.navbarManager) {
            window.navbarManager.updateTitle(route.title);
            }
            document.title = '도구 모음';

        // CSS 로드
        if (route.styles) {
            for (const styleUrl of route.styles) {
                await this.loadStyle(styleUrl);
            }
        }

        // 스크립트 로드 (순서대로)
        if (route.scripts) {
            for (const scriptUrl of route.scripts) {
                await this.loadScript(scriptUrl);
            }
        }

        // DOM이 완전히 준비될 때까지 대기
        await new Promise(resolve => requestAnimationFrame(resolve));

        // 페이지별 초기화 함수 실행
        if (typeof initApp === 'function') {
            try {
                initApp();
            } catch (error) {
                console.error('❌ initApp 실행 오류:', error);
                throw error;
            }
        }

        // ✅ 2. 페이드인
        requestAnimationFrame(() => {
            this.app.style.opacity = '1';
        });

    } catch (error) {
        console.error('페이지 로드 실패:', error);
        this.app.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h1>⚠️ 오류</h1>
                <p>페이지 로드 중 오류가 발생했습니다.</p>
                <p style="color: #999; font-size: 0.9em;">${error.message}</p>
            </div>
        `;
        // ✅ 에러 페이지도 보이도록
        this.app.style.opacity = '1';
    }
}


    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src + '?t=' + Date.now(); // 캐시 방지
            script.onload = resolve;
            script.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
            document.body.appendChild(script);
            this.currentScripts.push(script);
        });
    }

    loadStyle(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href + '?t=' + Date.now(); // 캐시 방지
            link.onload = resolve;
            link.onerror = () => reject(new Error(`스타일 로드 실패: ${href}`));
            document.head.appendChild(link);
            this.currentStyles.push(link);
        });
    }

    cleanup() {
    
    // ✅ ST 정규식 도구 전역 변수 정리
    if (window.editor) {
        try {
            if (window.editor.toTextArea) {
                window.editor.toTextArea();
            }
        } catch (e) {
            console.warn('CodeMirror cleanup 실패:', e);
        }
    }
    window.editor = undefined;
    window.rawInput = undefined;
    window.regexInput = undefined;
    window.renderTarget = undefined;
    window.regexError = undefined;
    window.groupList = undefined;
    window.presetContainer = undefined;
    window.searchMarks = []; // ✅ 추가
    
    // ✅ 테마 뷰어 전역 변수 정리
    if (window.themeEditor && window.themeEditor.editor) {
        try {
            if (window.themeEditor.editor.toTextArea) {
                window.themeEditor.editor.toTextArea();
            }
        } catch (e) {
            console.warn('테마 에디터 cleanup 실패:', e);
        }
    }
    window.themeEditor = undefined;
    
    // ✅ 스키마 디자인 전역 변수 정리
    if (window.schemaEditor && window.schemaEditor.editor) {
        try {
            if (window.schemaEditor.editor.toTextArea) {
                window.schemaEditor.editor.toTextArea();
            }
        } catch (e) {
            console.warn('스키마 에디터 cleanup 실패:', e);
        }
    }
    window.schemaEditor = undefined;
    
    // 동적 스크립트/스타일 제거
    this.currentScripts.forEach(script => {
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }
    });
    this.currentStyles.forEach(style => {
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }
    });
    
    this.currentScripts = [];
    this.currentStyles = [];
}
}

document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
});