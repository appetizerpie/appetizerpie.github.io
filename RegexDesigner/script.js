const rawInput = document.getElementById('raw-input');
const regexInput = document.getElementById('regex-input');
const renderTarget = document.getElementById('render-target');
const regexError = document.getElementById('regex-error');
const groupList = document.getElementById('group-list');
const presetContainer = document.getElementById('preset-container');

let editor;
let viewMode = 'content';

/* 유틸리티 함수 */
function getTemplateValue() {
    return editor ? editor.getValue() : document.getElementById('template-input').value;
}

function setTemplateValue(value) {
    if (editor) {
        editor.setValue(value);
    } else {
        document.getElementById('template-input').value = value;
    }
}

/* 1. 에디터 및 초기화 */
window.onload = function() {
    const textArea = document.getElementById('template-input');
    if (textArea) {
        editor = CodeMirror.fromTextArea(textArea, {
            mode: 'xml',
            lineNumbers: true,
            lineWrapping: true,
            theme: 'default',
            //inputStyle: 'contenteditable',
            //touchDragDelay: 200
        });

        editor.on('change', () => {
            render();
        });
    }

    initPresets();
    setViewMode('content');
    initMobileView();
    initResizer();
    initWidthInputKeydown();
};

/* 모바일 초기 뷰 설정 */
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

/* 2. 텍스트 찾기 (CodeMirror 방식) */
function findText(direction = 'next') {
    const query = document.getElementById('find-query').value;
    if (!query) {
        alert("검색어를 입력해주세요.");
        return;
    }

    const startPos = (direction === 'next')
        ? editor.getCursor('to')
        : editor.getCursor('from');
    let cursor = editor.getSearchCursor(query, startPos, { caseFold: true });
    if (!cursor.find(direction === 'prev')) {
        const loopStart = (direction === 'next')
            ? { line: 0, ch: 0 }
            : { line: editor.lineCount(), ch: 0 };
        cursor = editor.getSearchCursor(query, loopStart, { caseFold: true });
        if (!cursor.find(direction === 'prev')) {
            alert("일치하는 단어가 없습니다.");
            return;
        }
    }

    // 모바일 감지
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // 모바일: 네이티브 DOM 선택 사용
        const from = cursor.from();
        const to = cursor.to();
        
        // CodeMirror 선택
        editor.setSelection(from, to);
        editor.focus();
        
        // DOM 레벨에서도 강제로 선택
        setTimeout(() => {
            const cmContent = editor.getWrapperElement().querySelector('.CodeMirror-code');
            if (cmContent) {
                const range = document.createRange();
                const selection = window.getSelection();
                
                // CodeMirror의 내부 요소 찾기
                const lines = cmContent.querySelectorAll('.CodeMirror-line');
                if (lines.length > from.line) {
                    const textNode = lines[from.line].firstChild;
                    if (textNode) {
                        range.setStart(textNode, Math.min(from.ch, textNode.textContent.length));
                        range.setEnd(textNode, Math.min(to.ch, textNode.textContent.length));
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }
        }, 50);
        
        editor.scrollIntoView({ from, to }, 150);
    } else {
        // 데스크톱: 기존 방식
        editor.setSelection(cursor.from(), cursor.to());
        editor.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 150);
    }
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


// 3. 한 번 바꾸기
function replaceOne() {
  const findVal    = document.getElementById('find-query').value;
  const replaceVal = document.getElementById('replace-query').value;

  if (!findVal) {
    alert("검색어를 먼저 입력해주세요.");
    return;
  }

  // 현재 선택 영역 기준으로 검색 시작 (findText와 동작 통일)
  const startPos = editor.getCursor('to');
  let cursor = editor.getSearchCursor(findVal, startPos, { caseFold: true });

  if (!cursor.findNext()) {
    // 끝까지 못 찾으면 처음부터 다시
    cursor = editor.getSearchCursor(findVal, { line: 0, ch: 0 }, { caseFold: true });
    if (!cursor.findNext()) {
      alert("일치하는 단어가 없습니다.");
      return;
    }
  }

  cursor.replace(replaceVal);      // 현재 매치만 교체
  editor.setSelection(cursor.from(), cursor.to());
  editor.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 150);
}

// 4. 모두 바꾸기
function replaceAll() {
  const findVal    = document.getElementById('find-query').value;
  const replaceVal = document.getElementById('replace-query').value;

  if (!findVal) {
    alert("검색어를 먼저 입력해주세요.");
    return;
  }

  let cursor = editor.getSearchCursor(findVal, { line: 0, ch: 0 }, { caseFold: true });
  let count = 0;

  editor.operation(function () {
    while (cursor.findNext()) {
      cursor.replace(replaceVal);
      count++;
    }
  });

  if (count === 0) {
    alert("일치하는 단어가 없습니다.");
  } else {
    alert(count + "개를 변경했습니다.");
  }
}


/* 3. 클립보드 복사 */
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

/* 4. 프리셋 관리 */
function initPresets() {
    if (typeof customPresets === 'undefined') return;

    customPresets.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.innerText = p.name;
        btn.onclick = () => {
            presetContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            rawInput.value = p.input || "";
            regexInput.value = p.regex || "";
            setTemplateValue(p.template || "");
            autoResizeTextarea(rawInput);
            autoResizeTextarea(regexInput);
            render();
        };
        presetContainer.appendChild(btn);
    });
}

/* 5. 뷰 모드 설정 */
function toggleViewMode() {
    const viewToggle = document.getElementById('view-toggle');
    
    if (viewMode === 'content') {
        viewMode = 'debug';
        viewToggle.innerText = '캡쳐보기';
    } else {
        viewMode = 'content';
        viewToggle.innerText = '내용보기';
    }
    
    render();
}

function setViewMode(mode) {
    viewMode = mode;
    const viewToggle = document.getElementById('view-toggle');
    if (viewToggle) {
        viewToggle.innerText = mode === 'content' ? '내용보기' : '캡쳐보기';
    }
    render();
}

/* 6. 핵심 렌더링 로직 */
function render() {
    const text = rawInput.value;
    let regexStr = regexInput.value.trim();
    const template = getTemplateValue();
    
    regexError.style.display = 'none';
    groupList.innerHTML = '';
    
    const headerSpan = document.querySelector('.group-header span');
    if (headerSpan) {
        headerSpan.innerText = '매칭 그룹 정보 ($n)';
        headerSpan.style.color = '';
    }

     if (!regexStr || !text) {
        if (!renderTarget.querySelector('.notice-box')) {
            renderTarget.innerHTML = '';
        }
        return;
    }

    try {
        let pattern, flags;
        const slashMatch = regexStr.match(/^\/(.*)\/([a-z]*)$/s);
        if (slashMatch) {
            pattern = slashMatch[1];
            flags = slashMatch[2];
        } else {
            pattern = regexStr;
            flags = '';
        }
        
        if (!flags.includes('g')) {
            flags += 'g';
        }
        
        const re = new RegExp(pattern, flags);
        const matches = [...text.matchAll(re)];
        
        if (matches.length > 0) {
            const firstMatch = matches[0];
            
            if (headerSpan) {
                headerSpan.innerText = `매칭 그룹 정보 (${firstMatch.length - 1}개 발견)`;
                headerSpan.style.color = '';
            }
            
            groupList.innerHTML = '';
            for (let i = 1; i < firstMatch.length; i++) {
                const item = document.createElement('div');
                item.className = 'group-item';
                item.innerHTML = `<span class="group-id">$${i}</span><span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${firstMatch[i] || '-'}</span>`;
                groupList.appendChild(item);
            }
            
            let finalHtml = "";
            matches.forEach(match => {
                let temp = template.replace(/\$(\d+)/g, (fullMatch, num) => {
                    const index = parseInt(num);
                    if (index >= match.length) return fullMatch;
                    if (viewMode === 'debug') {
                        return `<span style="background:yellow; color:red;">$${index}</span>`;
                    } else {
                        return match[index] || "";
                    }
                });
                finalHtml += temp;
            });
            
            renderTarget.innerHTML = finalHtml;
        } else {
            if (headerSpan) {
                headerSpan.innerText = '매칭 그룹 정보 (❌ 매칭 결과가 없습니다)';
                headerSpan.style.color = '#e74c3c';
            }
        }
        
    } catch (e) {
        regexError.style.display = 'block';
        regexError.innerText = e.message;
        
        if (headerSpan) {
            headerSpan.innerText = '매칭 그룹 정보 (⚠️ 정규식 오류)';
            headerSpan.style.color = '#e74c3c';
        }
    }
}

/* 7. 이벤트 리스너 */
[rawInput, regexInput].forEach(el => el.addEventListener('input', render));

regexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        render();           
    }
});

document.getElementById('find-query').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.shiftKey ? findText('prev') : findText('next');
    }
});

/* 8. 기타 유틸리티 함수 */
function toggleGroupList() {
    const list = document.getElementById('group-list');
    const icon = document.getElementById('group-toggle-icon');

    if (list.classList.contains('collapsed')) {
        list.classList.remove('collapsed');
        icon.innerText = '▼';
    } else {
        list.classList.add('collapsed');
        icon.innerText = '▲';
    }
}

function resetAll() {
    location.reload();
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
    } else {
        editorSide.classList.add('hidden');
        previewSide.classList.remove('hidden');
        tabs[1].classList.add('active');
    }
}

document.getElementById('theme-toggle').addEventListener('click', function() {
    const previewSide = document.querySelector('.preview-side');
    const themeToggle = document.getElementById('theme-toggle');

    previewSide.classList.toggle('dark-mode');

    if (previewSide.classList.contains('dark-mode')) {
        themeToggle.innerText = '☀️';
    } else {
        themeToggle.innerText = '🌙';
    }
});

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

function toggleWidthControl() {
    const panel = document.getElementById('width-control');
    const btn = document.getElementById('width-toggle-btn');

    panel.classList.toggle('active');
    btn.classList.toggle('active');
}

function setPreviewWidth() {
    const input = document.getElementById('preview-width-input');
    const width = parseInt(input.value);

    if (!width || width < 200 || width > 2000) {
        alert('200~2000 사이의 값을 입력하세요.');
        return;
    }

    const previewSide = document.getElementById('preview-side');
    const editorSide = document.getElementById('editor-side');
    const container = document.querySelector('.container');
    const containerWidth = container.getBoundingClientRect().width;

    const percentage = (width / containerWidth) * 100;

    if (percentage < 10 || percentage > 90) {
        alert('현재 화면에서 설정 가능한 범위를 벗어났습니다.');
        return;
    }

    previewSide.style.width = `${percentage}%`;
    editorSide.style.width = `${100 - percentage}%`;
}

function resetPreviewWidth() {
    const previewSide = document.getElementById('preview-side');
    const editorSide = document.getElementById('editor-side');

    editorSide.style.width = '40%';
    previewSide.style.width = '60%';

    document.getElementById('preview-width-input').value = '';
}

function initWidthInputKeydown() {
    const widthInput = document.getElementById('preview-width-input');
    if (widthInput) {
        widthInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                setPreviewWidth();
            }
        });
    }
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function selectAllEditor() {
    if (editor) {
        editor.execCommand('selectAll');
        editor.focus();
    }
}
