window.editor = window.editor || null;
window.viewMode = window.viewMode || 'content';
window.rawInput = window.rawInput || null;
window.regexInput = window.regexInput || null;
window.renderTarget = window.renderTarget || null;
window.regexError = window.regexError || null;
window.groupList = window.groupList || null;
window.presetContainer = window.presetContainer || null;
window.searchMarks = window.searchMarks || [];

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

/* 초기화 함수 */
function initApp() {
  window.rawInput = document.getElementById('raw-input');
  window.regexInput = document.getElementById('regex-input');
  window.renderTarget = document.getElementById('render-target');
  window.regexError = document.getElementById('regex-error');
  window.groupList = document.getElementById('group-list');
  window.presetContainer = document.getElementById('preset-container');
  const textArea = document.getElementById('template-input');

  if (!window.rawInput || !window.regexInput || !window.renderTarget || !window.regexError || !window.groupList) {
    console.error('필수 DOM 요소를 찾을 수 없습니다.');
    return;
  }

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
      theme: 'default',
    });
    window.editor.on('change', () => {
      render();
    });
  }

  [window.rawInput, window.regexInput].forEach(el => {
    if (el) el.addEventListener('input', render);
  });

  if (window.regexInput) {
    window.regexInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        render();
      }
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

  initPresets();
  setViewMode('content');
  initMobileView();
  initResizer();
}

/* 모바일 초기 뷰 */
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

/* 텍스트 찾기 */
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

  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    const from = cursor.from();
    const to = cursor.to();
    window.editor.setSelection(from, to);
    window.editor.focus();
    setTimeout(() => {
      const cmContent = window.editor.getWrapperElement().querySelector('.CodeMirror-code');
      if (cmContent) {
        const range = document.createRange();
        const selection = window.getSelection();
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
    window.editor.scrollIntoView({ from, to }, 150);
  } else {
    window.editor.setSelection(cursor.from(), cursor.to());
    window.editor.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 150);
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

/* 클립보드 복사 */
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

/* 프리셋 관리 */
function initPresets() {
  if (typeof window.customPresets === 'undefined') {
    console.warn('customPresets가 로드되지 않았습니다.');
    return;
  }

  const leftGroup = document.querySelector('.preset-bar-left');
  if (!leftGroup) {
    console.error('.preset-bar-left를 찾을 수 없습니다.');
    return;
  }

  window.customPresets.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.innerText = p.name;
    btn.onclick = () => {
      leftGroup.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (window.rawInput) window.rawInput.value = p.input || "";
      if (window.regexInput) window.regexInput.value = p.regex || "";
      setTemplateValue(p.template || "");
      if (window.rawInput) autoResizeTextarea(window.rawInput);
      if (window.regexInput) autoResizeTextarea(window.regexInput);
      render();
    };
    leftGroup.appendChild(btn);
  });
}

/* 뷰 모드 */
function toggleViewMode() {
  const viewToggle = document.getElementById('view-toggle');
  if (window.viewMode === 'content') {
    window.viewMode = 'debug';
    viewToggle.innerText = '캡쳐보기';
  } else {
    window.viewMode = 'content';
    viewToggle.innerText = '내용보기';
  }
  render();
}

function setViewMode(mode) {
  window.viewMode = mode;
  const viewToggle = document.getElementById('view-toggle');
  if (viewToggle) {
    viewToggle.innerText = mode === 'content' ? '내용보기' : '캡쳐보기';
  }
  render();
}

/* 렌더링 */
function render() {
  if (!window.rawInput || !window.regexInput || !window.renderTarget) return;
  if (!document.body.contains(window.rawInput) || !document.body.contains(window.regexInput)) return;

  const text = window.rawInput.value;
  let regexStr = window.regexInput.value.trim();
  const template = getTemplateValue();

  if (window.regexError) {
    window.regexError.style.display = 'none';
  }

  if (window.groupList) {
    window.groupList.innerHTML = '';
  }

  const headerSpan = document.querySelector('.group-header span');
  if (headerSpan) {
    headerSpan.innerText = '매칭 그룹 정보 ($n)';
    headerSpan.style.color = '';
  }

  if (!regexStr || !text) {
    if (!window.renderTarget.querySelector('.notice-box')) {
      window.renderTarget.innerHTML = '';
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

      window.groupList.innerHTML = '';
      for (let i = 1; i < firstMatch.length; i++) {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.innerHTML = `<span class="group-id">$${i}</span><span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${firstMatch[i] || '-'}</span>`;
        window.groupList.appendChild(item);
      }

      let finalHtml = "";
      matches.forEach(match => {
        let temp = template.replace(/\$(\d+)/g, (fullMatch, num) => {
          const index = parseInt(num);
          if (index >= match.length) return fullMatch;
          if (window.viewMode === 'debug') {
            return `<span style="background:yellow; color:red;">$${index}</span>`;
          } else {
            return match[index] || "";
          }
        });
        finalHtml += temp;
      });
      window.renderTarget.innerHTML = finalHtml;
    } else {
      if (headerSpan) {
        headerSpan.innerText = '매칭 그룹 정보 (❌ 매칭 결과가 없습니다)';
        headerSpan.style.color = '#e74c3c';
      }
    }
  } catch (e) {
    window.regexError.style.display = 'block';
    window.regexError.innerText = e.message;
    if (headerSpan) {
      headerSpan.innerText = '매칭 그룹 정보 (⚠️ 정규식 오류)';
      headerSpan.style.color = '#e74c3c';
    }
  }
}

/* 기타 함수 */
function toggleGroupList() {
  const list = document.getElementById('group-list');
  const icon = document.getElementById('group-toggle-icon');
  if (list.classList.contains('collapsed')) {
    list.classList.remove('collapsed');
    icon.innerText = '▲';
  } else {
    list.classList.add('collapsed');
    icon.innerText = '▼';
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
    setTimeout(() => {
      if (window.editor) window.editor.refresh();
      if (window.rawInput) autoResizeTextarea(window.rawInput);
      if (window.regexInput) autoResizeTextarea(window.regexInput);
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

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function selectAllEditor() {
  if (window.editor) {
    window.editor.execCommand('selectAll');
    window.editor.focus();
  }
}

window.toggleSection = function(sectionId) {
  const section = document.getElementById(sectionId);
  const iconId = sectionId.replace('-section', '-toggle-icon');
  const icon = document.getElementById(iconId);
  if (!section || !icon) {
    console.warn(`toggleSection: ${sectionId} 또는 ${iconId}를 찾을 수 없습니다.`);
    return;
  }

  if (section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
    icon.innerText = '··· [접기]';
  } else {
    section.classList.add('collapsed');
    icon.innerText = '··· [펼치기]';
  }
};

/* 정규식 JSON 저장 */
function saveAsRegexJSON() {
  const regexPattern = window.regexInput ? window.regexInput.value : '';
  const template = getTemplateValue();

  if (!regexPattern) {
    alert('정규식 패턴을 입력해주세요.');
    return;
  }

  if (!template) {
    alert('디자인 코드를 입력해주세요.');
    return;
  }

  openModal();
}

function openModal() {
  const modal = document.getElementById('custom-modal');
  const input = document.getElementById('script-name-input');
  modal.classList.add('active');
  setTimeout(() => {
    input.focus();
    input.select();
  }, 100);
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      confirmSave();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  };
}

function closeModal() {
  const modal = document.getElementById('custom-modal');
  modal.classList.remove('active');
}

function confirmSave() {
  const scriptName = document.getElementById('script-name-input').value.trim();
  if (!scriptName) {
    alert('스크립트 이름을 입력해주세요.');
    return;
  }

  const regexPattern = window.regexInput ? window.regexInput.value : '';
  const template = getTemplateValue();

  let cleanRegex = regexPattern.trim();
  const slashMatch = cleanRegex.match(/^\/(.*)\/([a-z]*)$/s);
  if (slashMatch) {
    cleanRegex = slashMatch[1];
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const regexJSON = {
    "id": generateUUID(),
    "scriptName": scriptName,
    "findRegex": cleanRegex,
    "replaceString": template,
    "trimStrings": [""],
    "placement": [2],
    "disabled": false,
    "markdownOnly": true,
    "promptOnly": false,
    "runOnEdit": true,
    "substituteRegex": 0,
    "minDepth": null,
    "maxDepth": null
  };

  const blob = new Blob([JSON.stringify(regexJSON, null, 4)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = scriptName.replace(/\s+/g, '-').replace(/[^\w가-힣-]/g, '') + '.json';
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  closeModal();
}
