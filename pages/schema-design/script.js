window.editor = window.editor || null;
window.schemaInput = window.schemaInput || null;
window.renderTarget = window.renderTarget || null;
window.renderError = window.renderError || null;
window.searchMarks = window.searchMarks || [];
window.variablesCollapsed = true;

/* 유틸리티 함수 */
function getTemplateValue() {
    return window.editor ? window.editor.getValue() : document.getElementById('template-input').value;
}

function setTemplateValue(value) {
    if (window.editor) {
        window.editor.setValue(value);
    } else {
        document.getElementById('template-input').value = value;
    }
}

/* 프리셋 로드 */
function loadPreset(presetName) {
    const preset = window.schemaPresets[presetName];
    if (!preset) return;
    
    window.schemaInput.value = JSON.stringify(preset.schema, null, 2);
    setTemplateValue(preset.template);
    
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    window.variablesCollapsed = true;
    const arrow = document.getElementById('variable-arrow');
    if(arrow) arrow.textContent = '[열기]';
    
    render();
    extractVariables();
}

/* 초기화 */
function resetAll() {
    if (confirm('모든 내용을 초기화하시겠습니까?')) {
        window.schemaInput.value = '';
        setTemplateValue('');
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        
        // 초기 안내문 복구
        const noticeHTML = `
            <div class="notice-box">
                <h3>💡 사용 방법</h3>
                <span class="notice-badge step-1">1</span>채팅에 출력된 스키마를 입력하세요.<br>
                <span class="notice-badge step-2">2</span>추출값에서 <code>{{변수명}}</code>을 확인하세요.<br>
                <span class="notice-badge step-3">3</span>디자인을 입력하세요.<br>
                <span class="notice-badge step-4">4</span>실시간으로 결과를 확인할 수 있습니다.
                <hr>
                <span class="notice-badge step-5">✔</span>프리셋을 눌러서 미리보기.
            </div>
        `;
        window.renderTarget.innerHTML = noticeHTML;
        
        render();
        extractVariables();
    }
}

/* 배열 속성 값 찾기 헬퍼 */
function findValuesInObjectArrays(obj, key) {
    if (!obj || typeof obj !== 'object') return null;

    if (Array.isArray(obj)) {
        if (obj.length && obj[0] && typeof obj[0] === 'object' && key in obj[0]) {
            return obj.map(x => x?.[key]).filter(v => v !== undefined);
        }
        for (const v of obj) {
            const r = findValuesInObjectArrays(v, key);
            if (r) return r;
        }
        return null;
    }

    for (const k of Object.keys(obj)) {
        const r = findValuesInObjectArrays(obj[k], key);
        if (r) return r;
    }
    return null;
}

/* Schema에서 모든 변수 추출 (Template 없을 때용) - 배열 자체는 제외 */
function extractFromSchema(schema, prefix = 'data') {
    const vars = [];
    
    if (typeof schema === 'object' && schema !== null && !Array.isArray(schema)) {
        Object.keys(schema).forEach(key => {
            const value = schema[key];
            const fullPath = `${prefix}.${key}`;
            
            if (Array.isArray(value)) {
                // 배열 자체는 추가 안 함
                // 배열 내부 객체의 속성만 추출
                if (value.length > 0 && typeof value[0] === 'object') {
                    Object.keys(value[0]).forEach(subKey => {
                        const subValue = value.map(item => item[subKey]).filter(v => v !== undefined);
                        // 배열 요소의 속성: character.name 형식
                        const singularKey = key.endsWith('s') ? key.slice(0, -1) : key;
                        vars.push({ path: `${singularKey}.${subKey}`, value: subValue });
                    });
                }
            } else if (typeof value === 'object' && value !== null) {
                // 중첩 객체는 각 속성 추출
                Object.keys(value).forEach(subKey => {
                    vars.push({ path: `${fullPath}.${subKey}`, value: value[subKey] });
                });
            } else {
                // 일반 값
                vars.push({ path: fullPath, value });
            }
        });
    }
    
    return vars;
}

/* 변수 추출 함수 - Template 무관하게 Schema 기반 추출 */
function extractVariables() {
    const schemaText = window.schemaInput.value.trim();
    
    if (!schemaText) {
        updateVariableDisplay([]);
        return;
    }
    
    try {
        const schema = JSON.parse(schemaText);
        
        // Template 유무 상관없이 Schema 구조로 추출
        const extractedVars = extractFromSchema(schema);
        
        updateVariableDisplay(extractedVars);
    } catch (e) {
        updateVariableDisplay([]);
    }
}

/* Schema에서 모든 변수 추출 - 배열 자체는 제외 */
function extractFromSchema(schema, prefix = 'data') {
    const vars = [];
    
    if (typeof schema === 'object' && schema !== null && !Array.isArray(schema)) {
        Object.keys(schema).forEach(key => {
            const value = schema[key];
            const fullPath = `${prefix}.${key}`;
            
            if (Array.isArray(value)) {
                // 배열 자체는 추가 안 함
                // 배열 내부 객체의 속성만 추출
                if (value.length > 0 && typeof value[0] === 'object') {
                    Object.keys(value[0]).forEach(subKey => {
                        const subValue = value.map(item => item[subKey]).filter(v => v !== undefined);
                        // 배열 요소의 속성: character.name 형식
                        const singularKey = key.endsWith('s') ? key.slice(0, -1) : key;
                        vars.push({ path: `${singularKey}.${subKey}`, value: subValue });
                    });
                }
            } else if (typeof value === 'object' && value !== null) {
                // 중첩 객체는 각 속성 추출
                Object.keys(value).forEach(subKey => {
                    vars.push({ path: `${fullPath}.${subKey}`, value: value[subKey] });
                });
            } else {
                // 일반 값
                vars.push({ path: fullPath, value });
            }
        });
    }
    
    return vars;
}

/* 중첩 객체에서 값 가져오기 */
function getNestedValue(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
    }
    
    return current;
}

/* 변수 표시 업데이트 */
function updateVariableDisplay(extractedVars) {
    const countEl = document.getElementById('variable-count');
    const listEl = document.getElementById('variable-list');
    
    if (!countEl || !listEl) return;
    
    const totalCount = extractedVars.reduce((sum, item) => {
        if (Array.isArray(item.value)) {
            return sum + item.value.length;
        }
        return sum + 1;
    }, 0);
    
    countEl.textContent = `📊 추출값: ${totalCount}개`;
    
    if (extractedVars.length === 0) {
        listEl.innerHTML = '';
        listEl.classList.add('collapsed');
        return;
    }
    
    listEl.innerHTML = '';
    
    extractedVars.forEach(varItem => {
        const { path, value } = varItem;
        
        let count = 1;
        if (Array.isArray(value)) {
            count = value.length;
        } else if (value === undefined) {
            count = 0;
        }
        
        const item = document.createElement('div');
        item.className = 'variable-item';
        item.innerHTML = `
            <code title="{{${path}}}">{{${path}}}</code>
            <span class="variable-value">${count}개</span>
        `;
        listEl.appendChild(item);
    });
    
    if (window.variablesCollapsed) {
        listEl.classList.add('collapsed');
    } else {
        listEl.classList.remove('collapsed');
    }
}

/* 변수 섹션 토글 */
function toggleVariables() {
    window.variablesCollapsed = !window.variablesCollapsed;
    const arrow = document.getElementById('variable-arrow');
    const list = document.getElementById('variable-list');
    
    if (window.variablesCollapsed) {
        arrow.textContent = '[열기]';
        list.classList.add('collapsed');
    } else {
        arrow.textContent = '[닫기]';
        list.classList.remove('collapsed');
    }
}

/* 초기화 함수 */
function initApp() {

    // Handlebars 커스텀 헬퍼 등록
    Handlebars.registerHelper('join', function(array, separator) {
        if (Array.isArray(array)) {
            return array.join(separator || ', ');
        }
        return '';
    });

    
    window.schemaInput = document.getElementById('schema-input');
    window.renderTarget = document.querySelector('#preview-render .render-wrapper');
    window.renderError = document.getElementById('render-error');
    const textArea = document.getElementById('template-input');

    if (!window.schemaInput || !window.renderTarget || !window.renderError) {
        console.error('필수 DOM 요소를 찾을 수 없습니다.');
        return;
    }

    window.schemaInput.value = '';

    if (window.editor && window.editor.toTextArea) {
        try {
            window.editor.toTextArea();
        } catch (e) {}
    }

    if (textArea) {
        window.editor = CodeMirror.fromTextArea(textArea, {
            mode: 'htmlmixed',
            lineNumbers: true,
            lineWrapping: true,
        });
        
        window.editor.setValue('');
        
        window.editor.on('change', () => {
            render();
            extractVariables();
        });
    }

    if (window.schemaInput) {
        window.schemaInput.addEventListener('input', () => {
            render();
            extractVariables();
        });
    }

    const findQuery = document.getElementById('find-query');
    if (findQuery) {
        findQuery.addEventListener('input', () => {
            performSearch();
        });
        findQuery.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.shiftKey ? findText('prev') : findText('next');
            }
        });
    }

    const replaceQuery = document.getElementById('replace-query');
    if (replaceQuery) {
        replaceQuery.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                replaceOne();
            }
        });
    }

    initMobileView();
    initResizer();
    render();
    extractVariables();

    const arrow = document.getElementById('variable-arrow');
    const list = document.getElementById('variable-list');
    
    if (window.variablesCollapsed) {
        if (arrow) arrow.textContent = '[열기]';
        if (list) list.classList.add('collapsed');
    }
}

function initMobileView() {
    if (window.innerWidth <= 768) {
        const editorSide = document.getElementById('editor-side');
        const previewSide = document.getElementById('preview-side');
        editorSide.classList.add('hidden');
        previewSide.classList.remove('hidden');
        const tabs = document.querySelectorAll('.mobile-tab');
        if (tabs.length > 0) {
            tabs[1].classList.add('active');
            tabs[0].classList.remove('active');
        }
    }
}

function clearSearchHighlights() {
    window.searchMarks.forEach(mark => mark.clear());
    window.searchMarks = [];
}

function performSearch() {
    const query = document.getElementById('find-query').value;
    clearSearchHighlights();
    if (!query) return;
    let cursor = window.editor.getSearchCursor(query, { line: 0, ch: 0 }, { caseFold: true });
    while (cursor.findNext()) {
        const mark = window.editor.markText(cursor.from(), cursor.to(), {
            className: 'search-highlight'
        });
        window.searchMarks.push(mark);
    }
}

function findText(direction = 'next') {
    const query = document.getElementById('find-query').value;
    if (!query) {
        alert("검색어를 입력해주세요.");
        return;
    }

    const startPos = (direction === 'next') ? window.editor.getCursor('to') : window.editor.getCursor('from');
    let cursor = window.editor.getSearchCursor(query, startPos, { caseFold: true });
    if (!cursor.find(direction === 'prev')) {
        const loopStart = (direction === 'next') ? { line: 0, ch: 0 } : { line: window.editor.lineCount(), ch: 0 };
        cursor = window.editor.getSearchCursor(query, loopStart, { caseFold: true });
        if (!cursor.find(direction === 'prev')) {
            alert("일치하는 단어가 없습니다.");
            return;
        }
    }

    clearSearchHighlights();
    let allCursor = window.editor.getSearchCursor(query, { line: 0, ch: 0 }, { caseFold: true });
    while (allCursor.findNext()) {
        const mark = window.editor.markText(allCursor.from(), allCursor.to(), {
            className: 'search-highlight'
        });
        window.searchMarks.push(mark);
    }

    const currentMark = window.editor.markText(cursor.from(), cursor.to(), {
        className: 'search-highlight-current'
    });
    window.searchMarks.push(currentMark);
    
    window.editor.setSelection(cursor.from(), cursor.to());
    window.editor.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 150);
}

function toggleReplaceBox() {
    const box = document.getElementById('replace-box');
    const btn = document.getElementById('toggle-replace-btn');
    const isActive = box.classList.toggle('active');
    btn.textContent = isActive ? '접기' : '바꾸기';
    if (isActive) {
        setTimeout(() => {
            document.getElementById('replace-query').focus();
        }, 10);
    }
}

function replaceOne() {
    const findVal = document.getElementById('find-query').value;
    const replaceVal = document.getElementById('replace-query').value;
    if (!findVal) {
        alert("검색어를 먼저 입력해주세요.");
        return;
    }

    const startPos = window.editor.getCursor('to');
    let cursor = window.editor.getSearchCursor(findVal, startPos, { caseFold: true });
    if (!cursor.findNext()) {
        cursor = window.editor.getSearchCursor(findVal, { line: 0, ch: 0 }, { caseFold: true });
        if (!cursor.findNext()) {
            alert("일치하는 단어가 없습니다.");
            return;
        }
    }

    cursor.replace(replaceVal);
    window.editor.setSelection(cursor.from(), cursor.to());
    window.editor.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 150);
    setTimeout(() => {
        performSearch();
    }, 10);
}

function replaceAll() {
    const findVal = document.getElementById('find-query').value;
    const replaceVal = document.getElementById('replace-query').value;
    if (!findVal) {
        alert("검색어를 먼저 입력해주세요.");
        return;
    }

    let cursor = window.editor.getSearchCursor(findVal, { line: 0, ch: 0 }, { caseFold: true });
    let count = 0;
    window.editor.operation(function () {
        while (cursor.findNext()) {
            cursor.replace(replaceVal);
            count++;
        }
    });
    clearSearchHighlights();
    if (count === 0) {
        alert("일치하는 단어가 없습니다.");
    } else {
        alert(count + "개를 변경했습니다.");
    }
}

function copyToClipboard(id, btn) {
    let textToCopy = "";
    if (id === 'template-input') {
        textToCopy = getTemplateValue();
    } else {
        const el = document.getElementById(id);
        if (el) textToCopy = el.value;
    }

    if (!textToCopy) {
        alert("복사할 내용이 없습니다.");
        return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        const oldText = btn.innerText;
        btn.innerText = "복사완료!";
        btn.classList.add('success');
        setTimeout(() => {
            btn.innerText = oldText;
            btn.classList.remove('success');
        }, 1200);
    }).catch(err => {
        console.error('복사 실패:', err);
        alert("복사에 실패했습니다.");
    });
}

function render() {
    if (!window.schemaInput || !window.renderTarget) return;
    if (!document.body.contains(window.schemaInput)) return;

    const schemaText = window.schemaInput.value.trim();
    const template = getTemplateValue();

    if (window.renderError) {
        window.renderError.style.display = 'none';
    }

    if (!schemaText || !template) {
        if (!window.renderTarget.querySelector('.notice-box')) {
            window.renderTarget.innerHTML = '';
        }
        return;
    }

    try {
        const schema = JSON.parse(schemaText);
        const compiledTemplate = Handlebars.compile(template);
        const html = compiledTemplate({ data: schema });
        window.renderTarget.innerHTML = html;
    } catch (e) {
        window.renderError.style.display = 'block';
        window.renderError.innerText = '오류: ' + e.message;
    }
}

function switchMobileTab(tab) {
    const editorSide = document.getElementById('editor-side');
    const previewSide = document.getElementById('preview-side');
    const tabs = document.querySelectorAll('.mobile-tab');
    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'editor') {
        editorSide.classList.remove('hidden');
        previewSide.classList.add('hidden');
        tabs[0].classList.add('active');
        setTimeout(() => {
            if (window.editor) window.editor.refresh();
        }, 10);
    } else {
        editorSide.classList.add('hidden');
        previewSide.classList.remove('hidden');
        tabs[1].classList.add('active');
    }
}

function initResizer() {
    const resizer = document.getElementById('resizer');
    const editorSide = document.getElementById('editor-side');
    const previewSide = document.getElementById('preview-side');
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newLeftWidth > 20 && newLeftWidth < 80) {
            editorSide.style.width = `${newLeftWidth}%`;
            previewSide.style.width = `${100 - newLeftWidth}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
