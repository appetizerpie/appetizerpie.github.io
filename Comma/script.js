// 전역 변수
let processedData = null;
let originalFilename = '';

// 초기화 함수
function initComma() {
  console.log('Comma 페이지 초기화');
  
  // 이벤트 리스너
  const inputText = document.getElementById('inputText');
  if (inputText) {
    inputText.addEventListener('input', updateCharCount);
  }
}

// HTML 태그 보호하며 쉼표 제거
function removeCommasProtectHTML(text) {
  const parts = [];
  let lastIndex = 0;
  const tagRegex = /<[^>]+>/g;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index).replace(/,/g, ''));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex).replace(/,/g, ''));
  }

  return parts.join('');
}

// 텍스트에서 쉼표 제거
function removeCommas() {
  const input = document.getElementById('inputText').value;
  const badge = document.getElementById('resultBadge');

  if (!input.trim()) {
    showToast('텍스트를 입력하세요');
    badge.classList.remove('show');
    return;
  }

  const tempText = input.replace(/<[^>]+>/g, '');
  const commaCount = (tempText.match(/,/g) || []).length;

  if (commaCount === 0) {
    document.getElementById('outputText').value = input;
    updateCharCount();
    badge.textContent = '쉼표 없음';
    badge.classList.add('error', 'show');
    return;
  }

  const output = removeCommasProtectHTML(input);
  document.getElementById('outputText').value = output;
  updateCharCount();
  badge.textContent = `${commaCount}개 제거`;
  badge.classList.remove('error');
  badge.classList.add('show');
}

// 클립보드 복사
async function copyToClipboard() {
  const output = document.getElementById('outputText').value;

  if (!output.trim()) {
    showToast('복사할 내용이 없습니다');
    return;
  }

  try {
    await navigator.clipboard.writeText(output);
    showToast('✅ 복사 완료!');
  } catch (err) {
    // 폴백
    const textArea = document.createElement('textarea');
    textArea.value = output;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      showToast('✅ 복사 완료!');
    } catch (e) {
      showToast('❌ 복사 실패');
    }
    
    document.body.removeChild(textArea);
  }
}

// 텍스트 지우기
function clearText() {
  document.getElementById('inputText').value = '';
  document.getElementById('outputText').value = '';
  document.getElementById('resultBadge').classList.remove('show', 'error');
  updateCharCount();
}

// 글자 수 업데이트
function updateCharCount() {
  const inputText = document.getElementById('inputText').value;
  const outputText = document.getElementById('outputText').value;
  document.getElementById('inputCount').textContent = inputText.length + ' 자';
  document.getElementById('outputCount').textContent = outputText.length + ' 자';
}

// 파일 로드
function loadFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  originalFilename = file.name;
  document.getElementById('fileName').textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      processJSONFile(e.target.result);
    } catch (error) {
      showToast('❌ 파일 처리 중 오류 발생');
      console.error(error);
    }
  };
  reader.onerror = () => showToast('❌ 파일 읽기 실패');
  reader.readAsText(file);
}

// JSONL 파일 처리
function processJSONFile(content) {
  try {
    const lines = content.trim().split('\n');
    let totalMessages = 0;
    let totalCommasRemoved = 0;
    const processedLines = [];

    lines.forEach(line => {
      if (!line.trim()) return;

      try {
        const obj = JSON.parse(line);

        // 메시지 처리
        if (obj.mes) {
          const original = obj.mes;
          obj.mes = removeCommasProtectHTML(obj.mes);
          const tempText = original.replace(/<[^>]+>/g, '');
          totalCommasRemoved += (tempText.match(/,/g) || []).length;
        }

        // swipes 처리
        if (obj.swipes && Array.isArray(obj.swipes)) {
          obj.swipes = obj.swipes.map(swipe => {
            const original = swipe;
            const processed = removeCommasProtectHTML(swipe);
            const tempText = original.replace(/<[^>]+>/g, '');
            totalCommasRemoved += (tempText.match(/,/g) || []).length;
            return processed;
          });
        }

        processedLines.push(JSON.stringify(obj));
        totalMessages++;
      } catch (err) {
        processedLines.push(line);
      }
    });

    processedData = processedLines.join('\n');

    // 통계 업데이트
    const removedElement = document.getElementById('removedCommas');
    document.getElementById('totalMessages').textContent = totalMessages;

    if (totalCommasRemoved === 0) {
      removedElement.textContent = '역병 없음';
      removedElement.classList.add('no-comma');
    } else {
      removedElement.textContent = totalCommasRemoved;
      removedElement.classList.remove('no-comma');
    }

    document.getElementById('downloadBtn').disabled = false;
    showToast('✅ 파일 처리 완료!');
  } catch (error) {
    showToast('❌ JSON 파일 처리 중 오류 발생');
    console.error(error);
  }
}

// 파일 다운로드
function downloadFile() {
  if (!processedData) {
    showToast('❌ 처리된 데이터가 없습니다');
    return;
  }

  const blob = new Blob([processedData], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const newFilename = originalFilename.replace(/(\.[^.]+)$/, '_dalcleaned$1');
  
  const link = document.createElement('a');
  link.href = url;
  link.download = newFilename;
  link.click();
  
  URL.revokeObjectURL(url);
  showToast('✅ 다운로드 완료!');
}

// 파일 초기화
function clearFile() {
  const removedElement = document.getElementById('removedCommas');
  
  document.getElementById('fileInput').value = '';
  document.getElementById('fileName').textContent = '선택된 파일 없음';
  document.getElementById('totalMessages').textContent = '0';
  removedElement.textContent = '0';
  removedElement.classList.remove('no-comma');
  document.getElementById('downloadBtn').disabled = true;
  
  processedData = null;
  originalFilename = '';
}

// 토스트 알림
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.warn('Toast element not found');
    return;
  }

  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}
