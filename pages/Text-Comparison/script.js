// ── LCS ──────────────────────────────────────────────────────────────────────
function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) dp.push(new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);

  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1] && dp[i][j] > dp[i][j-1] && dp[i][j] > dp[i-1][j]) {
      ops.push({ type: 'eq',  val: a[i-1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      ops.push({ type: 'add', val: b[j-1] }); j--;
    } else {
      ops.push({ type: 'del', val: a[i-1] }); i--;
    }
  }
  return ops.reverse();
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── 글자 단위 인라인 diff HTML ───────────────────────────────────────────────
function charDiffHtml(lineA, lineB) {
  const ops = lcs([...lineA], [...lineB]);
  let html = '';
  let buf = '', bufType = null;

  const flush = () => {
    if (!buf) return;
    if      (bufType === 'add') html += `<span class="c-add">${esc(buf)}</span>`;
    else if (bufType === 'del') html += `<span class="c-del">${esc(buf)}</span>`;
    else                         html += esc(buf);
    buf = ''; bufType = null;
  };

  for (const op of ops) {
    if (op.type !== bufType) flush();
    bufType = op.type;
    buf += op.val;
  }
  flush();
  return html;
}

// ── 상태 ─────────────────────────────────────────────────────────────────────
let currentUnit = 'char';
let lineOps = [];
let savedTextA = '';
let savedTextB = '';

function setUnit(u) {
  currentUnit = u;
  document.getElementById('tabChar').classList.toggle('active', u === 'char');
  document.getElementById('tabLine').classList.toggle('active', u === 'line');
  if (lineOps.length) {
    updateStats();
    renderDiff();
  }
}

function updateStats() {
  let addCnt = 0, delCnt = 0, eqCnt = 0, total = 0;
  const unit = currentUnit === 'char' ? '글자' : '줄';

  if (currentUnit === 'char') {
    const charOps = lcs([...savedTextA], [...savedTextB]);
    for (const op of charOps) {
      if      (op.type === 'add') addCnt++;
      else if (op.type === 'del') delCnt++;
      else                         eqCnt++;
    }
    total = charOps.length;
  } else {
    for (const op of lineOps) {
      if      (op.type === 'add') addCnt++;
      else if (op.type === 'del') delCnt++;
      else                         eqCnt++;
    }
    total = lineOps.length;
  }

  document.getElementById('statsBar').innerHTML = `
    <div class="stats-toggle" onclick="this.parentElement.classList.toggle('expanded')">
      통계 결과 요약 <span class="toggle-icon">▼</span>
    </div>
    <div class="stats-content">
      <div class="stat"><span class="stat-dot dot-eq"></span><span class="stat-label">동일</span> <strong>${eqCnt}</strong>${unit}</div>
      <div class="stat-div"></div>
      <div class="stat"><span class="stat-dot dot-add"></span><span class="stat-label">추가</span> <strong>${addCnt}</strong>${unit}</div>
      <div class="stat-div"></div>
      <div class="stat"><span class="stat-dot dot-del"></span><span class="stat-label">삭제</span> <strong>${delCnt}</strong>${unit}</div>
      <div class="stat-total"><span class="stat-total-label">총</span> <span class="stat-total-val">${total}${unit}</span></div>
    </div>
  `;
}

// ── 실행 ─────────────────────────────────────────────────────────────────────
function runDiff() {
  const a = document.getElementById('textA').value;
  const b = document.getElementById('textB').value;
  if (!a.trim() && !b.trim()) return;

  savedTextA = a;
  savedTextB = b;

  const isMatchMode = document.getElementById('matchMode').checked;

  const linesA = a.split('\n');
  const linesB = b.split('\n');
  lineOps = lcs(linesA, linesB);

  updateStats();
  renderDiff();

  // 일치하는 문장 찾기 모드
  const matchPanel = document.getElementById('matchPanel');
  if (isMatchMode) {
    findMatchingSentences(a, b);
    matchPanel.style.display = '';
    matchPanel.classList.add('expanded');
  } else {
    matchPanel.style.display = 'none';
  }

  const wrap = document.getElementById('resultWrap');
  wrap.classList.add('visible');
  document.getElementById('resultPanel').classList.add('expanded');
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── 렌더 ─────────────────────────────────────────────────────────────────────
function renderDiff() {
  const body = document.getElementById('diffBody');
  let html = '';
  let lineNo = 0;
  let i = 0;

  while (i < lineOps.length) {
    const op = lineOps[i];

    if (op.type === 'del' || op.type === 'add') {
      let runDel = [];
      let runAdd = [];
      let j = i;
      while (j < lineOps.length && (lineOps[j].type === 'del' || lineOps[j].type === 'add')) {
        if (lineOps[j].type === 'del') runDel.push(lineOps[j].val);
        else runAdd.push(lineOps[j].val);
        j++;
      }

      if (currentUnit === 'char' && runDel.length > 0 && runAdd.length > 0) {
        const minLen = Math.min(runDel.length, runAdd.length);
        for(let k = 0; k < minLen; k++) {
          lineNo++;
          const inHtml = charDiffHtml(runDel[k], runAdd[k]);
          html += `<div class="diff-line ln-mod" style="height:auto;">
            <span class="line-no">${lineNo}</span>
            <span class="line-sign">±</span>
            <span class="line-content">${inHtml}</span>
          </div>`;
        }
        for(let k = minLen; k < runDel.length; k++) {
          html += `<div class="diff-line ln-del">
            <span class="line-no" style="color:#ef4444;opacity:0.7">−</span>
            <span class="line-sign">−</span>
            <span class="line-content">${esc(runDel[k])}</span>
          </div>`;
        }
        for(let k = minLen; k < runAdd.length; k++) {
          lineNo++;
          html += `<div class="diff-line ln-add">
            <span class="line-no">${lineNo}</span>
            <span class="line-sign">+</span>
            <span class="line-content">${esc(runAdd[k])}</span>
          </div>`;
        }
      } else {
        // Output pure deletes first, then pure adds
        for (const d of runDel) {
          html += `<div class="diff-line ln-del">
            <span class="line-no" style="color:#ef4444;opacity:0.7">−</span>
            <span class="line-sign">−</span>
            <span class="line-content">${esc(d)}</span>
          </div>`;
        }
        for (const a of runAdd) {
          lineNo++;
          html += `<div class="diff-line ln-add">
            <span class="line-no">${lineNo}</span>
            <span class="line-sign">+</span>
            <span class="line-content">${esc(a)}</span>
          </div>`;
        }
      }
      i = j;
      continue;
    }

    // eq
    lineNo++;
    html += `<div class="diff-line ln-eq">
      <span class="line-no">${lineNo}</span>
      <span class="line-sign"></span>
      <span class="line-content">${esc(op.val)}</span>
    </div>`;
    i++;
  }

  body.innerHTML = html || '<div class="empty-state">차이가 없습니다</div>';
}

function clearAll() {
  document.getElementById('textA').value = '';
  document.getElementById('textB').value = '';
  document.getElementById('resultWrap').classList.remove('visible');
  document.getElementById('matchPanel').style.display = 'none';
  lineOps = [];
}

// ── 일치하는 문장 찾기 ──────────────────────────────────────────────────────
function findMatchingSentences(textA, textB) {
  const body = document.getElementById('matchBody');

  // 줄 단위로 분리 후, 빈 줄 제거하여 문장 추출
  const sentencesA = textA.split('\n').map(s => s.trim()).filter(Boolean);
  const sentencesB = textB.split('\n').map(s => s.trim()).filter(Boolean);

  // Set으로 기준 텍스트 문장 저장
  const setA = new Set(sentencesA);

  // 변경 텍스트에서 기준 텍스트와 일치하는 문장 찾기
  const matches = [];
  const seen = new Set();
  sentencesB.forEach(sentence => {
    if (setA.has(sentence) && !seen.has(sentence)) {
      matches.push(sentence);
      seen.add(sentence);
    }
  });

  if (matches.length === 0) {
    body.innerHTML = '<div class="empty-state">일치하는 문장이 없습니다</div>';
    return;
  }

  let html = `<div style="padding: 10px 18px; font-size: 12px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">
    총 <strong>${matches.length}</strong>개의 일치하는 문장이 발견되었습니다.
  </div>`;

  matches.forEach((sentence, idx) => {
    html += `<div class="diff-line ln-match">
      <span class="line-no">${idx + 1}</span>
      <span class="line-sign">✓</span>
      <span class="line-content">${esc(sentence)}</span>
    </div>`;
  });

  body.innerHTML = html;
}
