const themeEditor = {
  editor: null,
  originalJSON: null,
  searchMatches: [],
  currentMatchIndex: -1,

  init: function() {
    this.editor = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
      mode: 'css',
      theme: 'default',
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false
    });

    document.getElementById('fileInput').addEventListener('change', this.handleFileSelect.bind(this));
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.searchNext();
      } else {
        this.performSearch();
      }
    });

    const replaceInput = document.getElementById('replaceInput');
    replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.replaceOne();
      }
    });
  },

  handleFileSelect: function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // 검색 상태 초기화
          this.clearSearchHighlights();
          this.searchMatches = [];
          this.currentMatchIndex = -1;
          document.getElementById('searchInput').value = '';
          document.getElementById('searchCounter').textContent = '';
          document.getElementById('replaceInput').value = '';
        // txt 파일이면 그냥 텍스트로 로드
        if (file.name.endsWith('.txt')) {
          this.originalJSON = null;  // txt는 JSON 없음
          this.editor.setValue(event.target.result || "");
          showToast(`✅ ${file.name} 로드 완료`);
          return;
        }

        // json 파일 처리
        this.originalJSON = JSON.parse(event.target.result);
        if (this.originalJSON.hasOwnProperty('custom_css')) {
          this.editor.setValue(this.originalJSON.custom_css || "");
          showToast(`✅ ${file.name} 로드 완료`);
        } else {
          showToast('❌ JSON 파일에 custom_css 필드가 없습니다.');
        }
      } catch (error) {
        showToast('❌ JSON 파일 파싱 오류');
        console.error(error);
      }
    };
    reader.readAsText(file);
  },

  performSearch: function() {
  const query = document.getElementById('searchInput').value;
  const counter = document.getElementById('searchCounter');
  this.clearSearchHighlights();

  if (!query) {
    this.searchMatches = [];
    this.currentMatchIndex = -1;
    counter.textContent = '';  // 카운터 초기화
    return;
  }

  this.searchMatches = [];
  const cursor = this.editor.getSearchCursor(query, { line: 0, ch: 0 }, { caseFold: true });
  
  while (cursor.findNext()) {
    this.searchMatches.push({ from: cursor.from(), to: cursor.to() });
  }

  if (this.searchMatches.length > 0) {
    this.currentMatchIndex = 0;
    this.highlightAllMatches();
    this.jumpToMatch(this.currentMatchIndex);
    counter.textContent = `(${this.searchMatches.length}개 찾음)`;
  } else {
    counter.textContent = '(0개 찾음)';
  }
},

searchNext: function() {
  const counter = document.getElementById('searchCounter');
  
  if (this.searchMatches.length === 0) {
    this.performSearch();
    return;
  }

  this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
  this.jumpToMatch(this.currentMatchIndex);
  counter.textContent = `(${this.currentMatchIndex + 1}/${this.searchMatches.length})`;
},

searchPrev: function() {
  const counter = document.getElementById('searchCounter');
  
  if (this.searchMatches.length === 0) {
    this.performSearch();
    return;
  }

  this.currentMatchIndex = (this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
  this.jumpToMatch(this.currentMatchIndex);
  counter.textContent = `(${this.currentMatchIndex + 1}/${this.searchMatches.length})`;
},


  highlightAllMatches: function() {
    this.searchMatches.forEach((match, index) => {
      this.editor.markText(match.from, match.to, {
        className: index === this.currentMatchIndex ? 'highlight-current' : 'highlight-match'
      });
    });
  },

  clearSearchHighlights: function() {
    this.editor.getAllMarks().forEach(mark => mark.clear());
  },

  jumpToMatch: function(index) {
    if (this.searchMatches.length === 0) return;
    
    const match = this.searchMatches[index];
    this.editor.scrollIntoView(match.from, 100);
    this.editor.setSelection(match.from, match.to);
    this.clearSearchHighlights();
    this.currentMatchIndex = index;
    this.highlightAllMatches();
  },

  searchNext: function() {
    if (this.searchMatches.length === 0) {
      this.performSearch();
      return;
    }

    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
    this.jumpToMatch(this.currentMatchIndex);
    //showToast(`${this.searchMatches.length}개 발견 (${this.currentMatchIndex + 1}/${this.searchMatches.length})`);
  },

  searchPrev: function() {
    if (this.searchMatches.length === 0) {
      this.performSearch();
      return;
    }

    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
    this.jumpToMatch(this.currentMatchIndex);
    //showToast(`${this.searchMatches.length}개 발견 (${this.currentMatchIndex + 1}/${this.searchMatches.length})`);
  },

  replaceOne: function() {
    if (this.searchMatches.length === 0) {
      showToast('❌ 검색 결과가 없습니다');
      return;
    }

    const replaceText = document.getElementById('replaceInput').value;
    const match = this.searchMatches[this.currentMatchIndex];
    
    this.editor.replaceRange(replaceText, match.from, match.to);
    showToast('✅ 1개 변경 완료');
    
    setTimeout(() => this.performSearch(), 100);
  },

  replaceAll: function() {
    if (this.searchMatches.length === 0) {
      showToast('❌ 검색 결과가 없습니다');
      return;
    }

    const replaceText = document.getElementById('replaceInput').value;
    const count = this.searchMatches.length;

    for (let i = this.searchMatches.length - 1; i >= 0; i--) {
      const match = this.searchMatches[i];
      this.editor.replaceRange(replaceText, match.from, match.to);
    }

    showToast(`✅ ${count}개 변경 완료`);
    
    setTimeout(() => this.performSearch(), 100);
  },

  copyAllCSS: function() {
    const cssContent = this.editor.getValue();
    
    if (!cssContent) {
      showToast('❌ 복사할 내용이 없습니다');
      return;
    }

    navigator.clipboard.writeText(cssContent).then(() => {
      showToast('복사 완료!');
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = cssContent;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        showToast('복사 완료!');
      } catch (e) {
        showToast('❌ 복사 실패');
      }
      
      document.body.removeChild(textArea);
    });
  },

  downloadJSON: function() {
    const content = this.editor.getValue();
    
    if (!content) {
      showToast('❌ 다운로드할 내용이 없습니다');
      return;
    }

    const originalFile = document.getElementById('fileInput').files[0];
    
    // txt 파일인 경우
    if (!this.originalJSON) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalFile ? `modified_${originalFile.name}` : 'modified.txt';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('✅ TXT 파일 다운로드 완료!');
      return;
    }

    // json 파일인 경우
    const modifiedJSON = { ...this.originalJSON };
    modifiedJSON.custom_css = content;

    if (modifiedJSON.hasOwnProperty('name') && typeof modifiedJSON.name === 'string') {
      if (!modifiedJSON.name.endsWith('수정')) {
        modifiedJSON.name = modifiedJSON.name + "수정";
      }
    }

    const blob = new Blob([JSON.stringify(modifiedJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const originalFileName = originalFile?.name || 'custom_css.json';
    a.download = `modified_${originalFileName}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✅ JSON 파일 다운로드 완료!');
  }
};

// 토스트 알림 표시 (개선 버전)
let toastTimeout = null;

function showToast(message) {
  const existingToast = document.querySelector('.toast');
  
  if (existingToast) {
    // 기존 타임아웃 취소
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    // 기존 토스트 제거
    existingToast.remove();
  }
  
  // 새 토스트 생성
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 3초 후 자동 제거
  toastTimeout = setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 3000);
}

// 바꾸기 박스 토글
function toggleReplaceBox() {
  const box = document.getElementById('replaceBox');
  const btn = document.getElementById('toggleReplaceBtn');
  const isActive = box.classList.toggle('active');
  btn.textContent = isActive ? '접기' : '바꾸기';
}

// 초기화
function initThemeEditor() {
  themeEditor.init();
}
