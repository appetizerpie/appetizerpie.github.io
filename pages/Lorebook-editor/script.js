let loadedFiles = {}; // { fileName: loreData }
let currentFileName = '';
let currentUid = null;
let isFirstLoad = true;
let selectionMode = false;

const fileInput = document.getElementById('fileInput');
const fileSelector = document.getElementById('fileSelector');
const mobileFileSelector = document.getElementById('mobileFileSelector');
const entryList = document.getElementById('entryList');
const editorContent = document.getElementById('editorContent');
const emptyState = document.getElementById('emptyState');

// 1. Sidebar Toggle Logic
function toggleSidebar() {
    const container = document.querySelector('.editor-container');
    container.classList.toggle('sidebar-collapsed');
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('mobile-open');
}

// 2. File Loading Logic
function openFileDialog() {
    fileInput.click();
}

fileInput.addEventListener('change', function(e) {
    const files = e.target.files;
    if (!files.length) return;

    if (!isFirstLoad) {
        // 기존 상태 유지할지 덮어씌울지 결정 - 여기선 다중 지원이므로 누적
    }

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                loadedFiles[file.name] = data;
                
                currentFileName = file.name;
                loadFileData(data);
                updateFileSelectors();
            } catch (err) {
                alert(`${file.name}: JSON 형식이 올바르지 않습니다.`);
                console.error(err);
            }
        };
        reader.readAsText(file);
    });
    
    isFirstLoad = false;
    fileInput.value = '';
});

function updateFileSelectors() {
    const options = '<option value="">파일을 선택하세요</option>' + 
        Object.keys(loadedFiles).map(name => 
            `<option value="${name}" ${name === currentFileName ? 'selected' : ''}>${name}</option>`
        ).join('');
    
    fileSelector.innerHTML = options;
    mobileFileSelector.innerHTML = options;
}

function switchFile() {
    switchToFile(fileSelector.value);
}

function switchFileMobile() {
    switchToFile(mobileFileSelector.value);
}

function switchToFile(fileName) {
    if (!fileName || !loadedFiles[fileName]) return;
    currentFileName = fileName;
    fileSelector.value = fileName;
    mobileFileSelector.value = fileName;
    loadFileData(loadedFiles[fileName]);
}

function normalizeEntries(loreData) {
    if(!loreData.entries) loreData.entries = {};
    Object.keys(loreData.entries).forEach(k => {
        const e = loreData.entries[k];
        if (typeof e.uid === 'undefined') e.uid = Number(k);
        if (!Array.isArray(e.key)) e.key = [];
        if (!Array.isArray(e.keysecondary)) e.keysecondary = [];
        if (!Array.isArray(e.triggers)) e.triggers = [];

        if (typeof e.position === 'undefined') e.position = 0;
        if (typeof e.depth === 'undefined') e.depth = 4;
        if (typeof e.order === 'undefined') e.order = 100;
        if (typeof e.probability === 'undefined') e.probability = 100;
        if (typeof e.selective === 'undefined') e.selective = true;
        if (typeof e.constant === 'undefined') e.constant = false;
        if (typeof e.vectorized === 'undefined') e.vectorized = false;
        if (typeof e.disable === 'undefined') e.disable = false;
        if (typeof e.useProbability === 'undefined') e.useProbability = true;
        if (typeof e.displayIndex === 'undefined') e.displayIndex = e.uid;
    });
}

function loadFileData(loreData) {
    normalizeEntries(loreData);
    renderList();
    emptyState.style.display = 'flex';
    editorContent.style.display = 'none';
    currentUid = null;
    
    // 모바일 리스트 여닫기 유도
    if(window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('mobile-open');
        document.getElementById('sidebarOverlay').classList.add('mobile-open');
    }
}

function getCurrentLoreData() {
    return loadedFiles[currentFileName] || { entries: {} };
}

// 3. List Rendering
function renderList(filterText = '') {
    const loreData = getCurrentLoreData();
    entryList.innerHTML = '';
    
    const entries = Object.values(loreData.entries);
    
    // uid가 아닌 displayIndex 또는 배열 내 순서 기준 정렬 
    entries.sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));

    entries.forEach((entry, index) => {
        const seqIndex = index + 1;
        const title = entry.comment || '(제목 없음)';
        const keys = entry.key.join(', ');
        
        if (filterText) {
            const searchStr = (title + keys).toLowerCase();
            if (!searchStr.includes(filterText.toLowerCase())) return;
        }

        const mode = getStrategyInfo(entry);
        const li = document.createElement('li');
        li.className = `entry-item ${entry.disable ? 'disabled' : ''}`;
        if (currentUid == entry.uid) li.classList.add('active');
        
        // 드래그 앤 드롭 속성
        li.draggable = true;
        li.dataset.uid = entry.uid;
        
        // 체크박스 처리 (선택 모드에서만 표시)
        const isChecked = selectedUids.has(entry.uid) ? 'checked' : '';
        const checkboxHidden = selectionMode ? '' : 'style="display:none"';

        li.innerHTML = `
            <input type="checkbox" class="entry-check" value="${entry.uid}" ${isChecked} ${checkboxHidden} onclick="event.stopPropagation(); toggleSelect(this, ${entry.uid})">
            <div class="entry-info">
                <div class="entry-title">
                    <span class="uid-badge">#${seqIndex}</span>
                    <span class="entry-name">${title}</span>
                    ${entry.disable ? '<span class="disabled-badge">[비활성화]</span>' : ''}
                </div>
                <div class="entry-meta">
                    <span class="meta-badge ${mode.cls}">${mode.text}</span>
                    <span class="meta-badge badge-position">${getPositionLabel(entry.position, entry.role)}</span>
                </div>
            </div>
        `;
        
        li.onclick = () => {
            if (selectionMode) {
                // 선택 모드: 클릭하면 체크 토글
                const cb = li.querySelector('.entry-check');
                cb.checked = !cb.checked;
                toggleSelect(cb, entry.uid);
            } else {
                selectEntry(entry.uid);
                if(window.innerWidth <= 768) toggleMobileSidebar();
            }
        };
        
        // 드래그 이벤트
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragenter', handleDragEnter);
        li.addEventListener('dragleave', handleDragLeave);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);
        
        entryList.appendChild(li);
    });
    updateSelectedCount();
}

function filterList() {
    renderList(document.getElementById('searchInput').value);
}

function getStrategyInfo(entry) {
    if (entry.constant) return { text: '🔵 항상', cls: 'badge-constant' };
    if (entry.vectorized) return { text: '🟣 벡터화', cls: 'badge-vectorized' };
    return { text: '🟢 키워드', cls: 'badge-selective' };
}

function getPositionLabel(pos, role) {
    if (pos === 4) {
        if (role === 0) return '@D ⚙';
        if (role === 1) return '@D 👤';
        if (role === 2) return '@D 🤖';
        return '@D';
    }
    const map = {
        0: '캐릭터 전', 1: '캐릭터 후',
        2: '작가노트 전', 3: '작가노트 후',
        5: '↑EM', 6: '↓EM', 7: '➡ Outlet'
    };
    return map[pos] || `위치 ${pos}`;
}

// 4. Entry Selection & Editing
function selectEntry(uid) {
    currentUid = uid;
    const entry = getCurrentLoreData().entries[uid];

    emptyState.style.display = 'none';
    editorContent.style.display = 'block';

    // Update List UI
    document.querySelectorAll('.entry-item').forEach(el => el.classList.remove('active'));
    renderList(document.getElementById('searchInput').value);

    // Map entry to form
    const displayUidEl = document.getElementById('displayUid');
    if (displayUidEl) displayUidEl.textContent = uid;
    
    // 순번 계산 (displayIndex 정렬 기준)
    const allEntries = Object.values(getCurrentLoreData().entries);
    allEntries.sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    const seqIdx = allEntries.findIndex(e => e.uid === uid) + 1;
    document.getElementById('inputSeqIndex').value = seqIdx;
    
    document.getElementById('inputComment').value = entry.comment || '';
    document.getElementById('inputKey').value = entry.key.join(', ');
    document.getElementById('inputKeysecondary').value = entry.keysecondary.join(', ');
    document.getElementById('inputContent').value = entry.content || '';
    
    document.getElementById('chkEnable').checked = !entry.disable;
    document.getElementById('enableLabel').textContent = entry.disable ? '비활성화' : '활성화';

    const strategy = entry.constant ? 'constant' : entry.vectorized ? 'vectorized' : 'selective';
    document.getElementById('selectStrategy').value = strategy;

    let posValue = entry.position === 4 ? `4-${entry.role ?? 0}` : (entry.position ?? 0);
    document.getElementById('selectPosition').value = posValue;

    document.getElementById('inputDepth').value = entry.depth ?? 4;
    document.getElementById('inputOrder').value = entry.order ?? 100;
    document.getElementById('inputProbability').value = entry.probability ?? 100;

    document.getElementById('inputSelectiveLogic').value = entry.selectiveLogic ?? 0;
    document.getElementById('inputScanDepth').value = entry.scanDepth ?? '';
    document.getElementById('inputMatchWholeWords').value = entry.matchWholeWords === null ? 'null' : entry.matchWholeWords;
    document.getElementById('inputCaseSensitive').value = entry.caseSensitive === null ? 'null' : entry.caseSensitive;

    document.getElementById('inputGroup').value = entry.group || '';
    document.getElementById('inputGroupWeight').value = entry.groupWeight ?? 100;
    document.getElementById('inputUseGroupScoring').value = entry.useGroupScoring === null ? 'null' : entry.useGroupScoring;
    
    document.getElementById('chkExcludeRecursion').checked = !!entry.excludeRecursion;
    document.getElementById('chkPreventRecursion').checked = !!entry.preventRecursion;
    document.getElementById('chkDelayUntilRecursion').checked = !!entry.delayUntilRecursion;

    autoResize(document.getElementById('inputKey'));
    autoResize(document.getElementById('inputKeysecondary'));
    countTokens();
    updateDepthState();
}

function updateDepthState() {
    const posVal = document.getElementById('selectPosition').value;
    const isAtD = posVal.startsWith('4');
    const depthInput = document.getElementById('inputDepth');
    const depthGroup = document.getElementById('depthGroup');
    depthInput.disabled = !isAtD;
    depthGroup.style.opacity = isAtD ? '1' : '0.4';
}

function updateField(field, isNumber = false) {
    if (currentUid === null || !currentFileName) return;
    const elId = 'input' + field.charAt(0).toUpperCase() + field.slice(1);
    const val = document.getElementById(elId).value;
    getCurrentLoreData().entries[currentUid][field] = isNumber && val !== '' ? Number(val) : val;
}

function updateArrayField(field) {
    if (currentUid === null || !currentFileName) return;
    const elId = 'input' + field.charAt(0).toUpperCase() + field.slice(1);
    const val = document.getElementById(elId).value;
    const arr = val.split(',').map(s => s.trim()).filter(Boolean);
    getCurrentLoreData().entries[currentUid][field] = arr;
}

function updateCheckedField(field, invert = false) {
    if (currentUid === null || !currentFileName) return;
    const elId = 'chk' + field.charAt(0).toUpperCase() + field.slice(1);
    let val = document.getElementById(elId).checked;
    if(invert) val = !val;
    getCurrentLoreData().entries[currentUid][field] = val;
    if (field === 'disable') renderList(document.getElementById('searchInput').value);
}

function updateNullableBoolean(field) {
    if (currentUid === null || !currentFileName) return;
    const elId = 'input' + field.charAt(0).toUpperCase() + field.slice(1);
    const val = document.getElementById(elId).value;
    getCurrentLoreData().entries[currentUid][field] = val === 'null' ? null : (val === 'true');
}

function updateNullableField(field) {
    if (currentUid === null || !currentFileName) return;
    const elId = 'input' + field.charAt(0).toUpperCase() + field.slice(1);
    const val = document.getElementById(elId).value;
    getCurrentLoreData().entries[currentUid][field] = val === '' ? null : Number(val);
}

function updateEnable() {
    if (currentUid === null || !currentFileName) return;
    const checked = document.getElementById('chkEnable').checked;
    getCurrentLoreData().entries[currentUid].disable = !checked;
    document.getElementById('enableLabel').textContent = checked ? '활성화' : '비활성화';
    renderList(document.getElementById('searchInput').value);
}

function updateStrategy() {
    if (currentUid === null || !currentFileName) return;
    const v = document.getElementById('selectStrategy').value;
    const entry = getCurrentLoreData().entries[currentUid];
    entry.selective = (v === 'selective');
    entry.constant = (v === 'constant');
    entry.vectorized = (v === 'vectorized');
    renderList(document.getElementById('searchInput').value);
}

function updatePosition() {
    if (currentUid === null || !currentFileName) return;
    const val = document.getElementById('selectPosition').value;
    const entry = getCurrentLoreData().entries[currentUid];
    if (val.includes('-')) {
        const [pos, role] = val.split('-').map(Number);
        entry.position = pos;
        entry.role = role;
    } else {
        entry.position = Number(val);
        if (Number(val) !== 4) entry.role = null;
    }
    renderList(document.getElementById('searchInput').value);
    updateDepthState();
}

function updateListItemName() {
    renderList(document.getElementById('searchInput').value);
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

// ===== Drag & Drop Reordering =====
let dragSrcUid = null;

function handleDragStart(e) {
    dragSrcUid = Number(this.dataset.uid);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrcUid);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
    
    const targetUid = Number(this.dataset.uid);
    if (dragSrcUid === null || dragSrcUid === targetUid) return;
    
    const loreData = getCurrentLoreData();
    const entries = Object.values(loreData.entries);
    entries.sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    
    // 현재 순서에서 src와 target의 인덱스 찾기
    const srcIdx = entries.findIndex(e => e.uid === dragSrcUid);
    const tgtIdx = entries.findIndex(e => e.uid === targetUid);
    
    if (srcIdx === -1 || tgtIdx === -1) return;
    
    // 배열에서 제거 후 target 위치에 삽입
    const [moved] = entries.splice(srcIdx, 1);
    entries.splice(tgtIdx, 0, moved);
    
    // displayIndex 재할당
    entries.forEach((entry, i) => {
        entry.displayIndex = i;
    });
    
    renderList(document.getElementById('searchInput').value);
}

function handleDragEnd(e) {
    dragSrcUid = null;
    document.querySelectorAll('.entry-item').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
    });
}

function estimateTokens(text) {
    if (!text || text.trim().length === 0) return 0;
    let tokens = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        if (c >= 0xAC00 && c <= 0xD7AF)         tokens += 1.1;   // 한글 완성형 (ST 및 Llama/GPT 토크나이저 평균)
        else if (c >= 0x3000 && c <= 0x9FFF)    tokens += 1.1;   // CJK
        else if (c >= 0x1100 && c <= 0x11FF)    tokens += 1.0;   // 한글 자모
        else if (c === 0x20)                    tokens += 0.15;  // 공백
        else if (c === 0x0A || c === 0x0D)      tokens += 0.5;   // 줄바꿈
        else if (c <= 0x007F)                   tokens += 0.25;  // ASCII 영문/숫자 (4글자당 1토큰 평균)
        else                                    tokens += 0.8;   // 기타 특수문자
    }
    return Math.max(1, Math.ceil(tokens));
}

function countTokens() {
    const text = document.getElementById('inputContent').value;
    const approx = estimateTokens(text);
    document.getElementById('tokenCount').textContent = approx;
}

// Panels toggle
function togglePanel(id) {
    const p = document.getElementById(id);
    const icon = document.getElementById(id + '-icon');
    if (p.style.display === 'none') {
        p.style.display = 'block';
        icon.textContent = '▼';
    } else {
        p.style.display = 'none';
        icon.textContent = '▶';
    }
}

// Multiple Selection / Bulk
let selectedUids = new Set();

function toggleSelectMode() {
    selectionMode = !selectionMode;
    const btn = document.getElementById('selectModeBtn');
    const bulkTools = document.getElementById('bulkTools');
    
    if (selectionMode) {
        btn.textContent = '✅ 선택 모드 해제';
        btn.classList.add('active');
        bulkTools.style.display = 'flex';
    } else {
        btn.textContent = '☐ 선택 모드';
        btn.classList.remove('active');
        bulkTools.style.display = 'none';
        selectedUids.clear();
    }
    renderList(document.getElementById('searchInput').value);
}

function toggleSelect(checkbox, uid) {
    if(checkbox.checked) selectedUids.add(uid);
    else selectedUids.delete(uid);
    updateSelectedCount();
}

function selectAllEntries() {
    const checkboxes = document.querySelectorAll('.entry-check');
    checkboxes.forEach(cb => {
        cb.checked = true;
        selectedUids.add(Number(cb.value));
    });
    updateSelectedCount();
}

function deselectAllEntries() {
    const checkboxes = document.querySelectorAll('.entry-check');
    selectedUids.clear();
    checkboxes.forEach(cb => { cb.checked = false; });
    updateSelectedCount();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = selectedUids.size;
}

function openBulkEditModal() {
    if(selectedUids.size === 0) return alert('선택된 항목이 없습니다.');
    document.getElementById('bulkEditModal').style.display = 'flex';
}

function openTransferModal() {
    if(selectedUids.size === 0) return alert('선택된 항목이 없습니다.');
    const selectors = Object.keys(loadedFiles).filter(f => f !== currentFileName);
    
    document.getElementById('transferCount').textContent = selectedUids.size;
    
    // 타겟 파일 목록 채우기
    const targetSel = document.getElementById('transferTargetFile');
    targetSel.innerHTML = '<option value="">대상 파일 선택</option>' + 
        selectors.map(f => `<option value="${f}">${f}</option>`).join('');
        
    // 순서 변경 타겟 항목 채우기 (현재 파일)
    const entrySel = document.getElementById('transferTargetEntry');
    const loreData = getCurrentLoreData();
    const entries = Object.values(loreData.entries).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    entrySel.innerHTML = '<option value="">항목 선택</option>' + 
        entries.map(e => `<option value="${e.uid}">[#${e.uid}] ${e.comment || '(제목 없음)'}</option>`).join('');
        
    document.getElementById('transferModal').style.display = 'flex';
    
    // 라디오 버튼 초기화 - 순서 변경하기가 기본 선택
    document.querySelector('input[name="transferMode"][value="order"]').checked = true;
    toggleTransferMode();
}

function toggleTransferMode() {
    const isFile = document.querySelector('input[name="transferMode"][value="file"]').checked;
    document.getElementById('transferFileOptions').style.display = isFile ? 'block' : 'none';
    document.getElementById('transferFileFooter').style.display = isFile ? 'flex' : 'none';
    
    document.getElementById('transferOrderOptions').style.display = isFile ? 'none' : 'block';
    document.getElementById('transferOrderFooter').style.display = isFile ? 'none' : 'flex';
}



function quickOrderChange(pos) {
    const loreData = getCurrentLoreData();
    const entries = Object.values(loreData.entries).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    
    const selectedEntries = entries.filter(e => selectedUids.has(e.uid));
    const remainEntries = entries.filter(e => !selectedUids.has(e.uid));
    
    let newEntries = [];
    if (pos === 'top') {
        newEntries = [...selectedEntries, ...remainEntries];
    } else {
        newEntries = [...remainEntries, ...selectedEntries];
    }
    
    newEntries.forEach((entry, i) => {
        entry.displayIndex = i;
    });
    
    closeModal('transferModal');
    renderList(document.getElementById('searchInput').value);
}

function applyOrderChange() {
    const targetUidStr = document.getElementById('transferTargetEntry').value;
    if (!targetUidStr) return alert('이동 타겟 항목을 선택하세요.');
    const targetUid = Number(targetUidStr);
    if (selectedUids.has(targetUid)) return alert('선택한 항목 자체를 타겟으로 지정할 수 없습니다.');

    const loreData = getCurrentLoreData();
    const entries = Object.values(loreData.entries).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    
    const selectedEntries = entries.filter(e => selectedUids.has(e.uid));
    const remainEntries = entries.filter(e => !selectedUids.has(e.uid));
    
    const targetIdx = remainEntries.findIndex(e => e.uid === targetUid);
    if (targetIdx === -1) return alert('타겟 항목을 찾을 수 없습니다.');
    
    const newEntries = [
        ...remainEntries.slice(0, targetIdx + 1),
        ...selectedEntries,
        ...remainEntries.slice(targetIdx + 1)
    ];
    
    newEntries.forEach((entry, i) => {
        entry.displayIndex = i;
    });
    
    closeModal('transferModal');
    renderList(document.getElementById('searchInput').value);
}

function applyTransfer(action) {
    const targetFileName = document.getElementById('transferTargetFile').value;
    if (!targetFileName) return alert('대상 파일을 선택해주세요.');
    if (targetFileName === currentFileName) return alert('대상 파일이 현재 파일과 같습니다.');
    if (!loadedFiles[targetFileName]) return alert('대상 파일 데이터를 찾을 수 없습니다.');
    
    const targetLoreData = loadedFiles[targetFileName];
    const currentLoreData = getCurrentLoreData();
    
    // 대상 파일에서 쓸 수 있는 최대 UID 계산
    const targetUids = Object.keys(targetLoreData.entries).map(Number);
    let nextUid = targetUids.length > 0 ? Math.max(...targetUids) + 1 : 0;
    let nextDisplayIndex = targetUids.length; // 맨 뒤에 추가
    
    selectedUids.forEach(uid => {
        const sourceEntry = currentLoreData.entries[uid];
        // 엔트리 깊은 복사
        const newEntry = JSON.parse(JSON.stringify(sourceEntry));
        newEntry.uid = nextUid;
        newEntry.displayIndex = nextDisplayIndex;
        
        // 타겟에 추가
        targetLoreData.entries[nextUid] = newEntry;
        
        // move인 경우 원본 삭제
        if (action === 'move') {
            delete currentLoreData.entries[uid];
            if (currentUid === uid) currentUid = null;
        }
        
        nextUid++;
        nextDisplayIndex++;
    });
    
    if (action === 'move') {
        selectedUids.clear();
        if (currentUid === null) {
            document.getElementById('emptyState').style.display = 'flex';
            document.getElementById('editorContent').style.display = 'none';
        }
    }
    
    closeModal('transferModal');
    renderList(document.getElementById('searchInput').value);
    
    alert(`선택 항목들이 '${targetFileName}' 파일로 ${action === 'move' ? '이동' : '복사'}되었습니다.`);
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function applyBulkEdit() {
    const loreData = getCurrentLoreData();
    const sd = document.getElementById('bulkScanDepth').value;
    const ww = document.getElementById('bulkWholeWords').value;
    const cs = document.getElementById('bulkCaseSensitive').value;
    
    const targetField = document.getElementById('bulkTargetField').value;
    const searchStr = document.getElementById('bulkSearchStr').value;
    const replaceStr = document.getElementById('bulkReplaceStr').value;

    selectedUids.forEach(uid => {
        const entry = loreData.entries[uid];
        // 1. 옵션 변경
        if(sd !== 'skip') entry.scanDepth = (sd === 'null' ? null : Number(document.getElementById('bulkScanDepthStr').value));
        if(ww !== 'skip') entry.matchWholeWords = (ww === 'null' ? null : ww === 'true');
        if(cs !== 'skip') entry.caseSensitive = (cs === 'null' ? null : cs === 'true');
        
        // 2. 텍스트 치환
        if(searchStr) {
            if(targetField === 'comment' && entry.comment) {
                entry.comment = entry.comment.split(searchStr).join(replaceStr);
            }
            if(targetField === 'content' && entry.content) {
                entry.content = entry.content.split(searchStr).join(replaceStr);
            }
            if(targetField === 'key' && Array.isArray(entry.key)) {
                entry.key = entry.key.map(k => k.split(searchStr).join(replaceStr));
            }
        }
    });

    closeModal('bulkEditModal');
    renderList(document.getElementById('searchInput').value);
    if(currentUid !== null && selectedUids.has(currentUid)) selectEntry(currentUid);
    alert('일괄 적용되었습니다.');
}

function deleteSelectedEntries() {
    if(selectedUids.size === 0) return alert('선택된 항목이 없습니다.');
    if(!confirm(`총 ${selectedUids.size}개의 항목을 삭제하시겠습니까? (이 동작은 되돌릴 수 없습니다)`)) return;
    
    const loreData = getCurrentLoreData();
    selectedUids.forEach(uid => {
        delete loreData.entries[uid];
        if(currentUid === uid) {
            currentUid = null;
            emptyState.style.display = 'flex';
            editorContent.style.display = 'none';
        }
    });
    
    selectedUids.clear();
    document.getElementById('selectAllCheck').checked = false;
    renderList(document.getElementById('searchInput').value);
}

function addNewEntry() {
    if (!currentFileName) return alert('먼저 파일을 불러와주세요.');
    const loreData = getCurrentLoreData();
    const uids = Object.keys(loreData.entries).map(Number);
    const newUid = uids.length > 0 ? Math.max(...uids) + 1 : 0;

    loreData.entries[newUid] = createEmptyEntry(newUid);
    renderList(document.getElementById('searchInput').value);
    selectEntry(newUid);
}

function createEmptyEntry(uid) {
    return {
        uid: uid, key: [], keysecondary: [], comment: "새 항목", content: "",
        constant: false, vectorized: false, selective: true, selectiveLogic: 0,
        addMemo: true, order: 100, position: 0, disable: false, ignoreBudget: false,
        excludeRecursion: false, preventRecursion: false, matchPersonaDescription: false,
        matchCharacterDescription: false, matchCharacterPersonality: false,
        matchCharacterDepthPrompt: false, matchScenario: false, matchCreatorNotes: false,
        delayUntilRecursion: false, probability: 100, useProbability: true, depth: 4,
        outletName: "", group: "", groupOverride: false, groupWeight: 100,
        scanDepth: null, caseSensitive: null, matchWholeWords: null, useGroupScoring: null,
        automationId: "", role: null, sticky: 0, cooldown: 0, delay: 0, triggers: [],
        displayIndex: uid, characterFilter: { isExclude: false, names: [], tags: [] }
    };
}

// ===== 새 로어북 만들기 =====
function createNewLorebook() {
    const name = prompt('새 로어북 파일 이름을 입력하세요 (예: my_lorebook):', '새_로어북');
    if (!name) return;
    
    const fileName = name.endsWith('.json') ? name : name + '.json';
    
    if (loadedFiles[fileName]) {
        if (!confirm(`"${fileName}" 파일이 이미 존재합니다. 덮어쓸까요?`)) return;
    }
    
    const newLorebook = {
        entries: {}
    };
    
    loadedFiles[fileName] = newLorebook;
    currentFileName = fileName;
    isFirstLoad = false;
    
    updateFileSelectors();
    loadFileData(newLorebook);
    
    // 바로 첫 항목 추가
    addNewEntry();
}

// ===== 로어북 이름 변경 =====
function renameLorebook() {
    if (!currentFileName) return alert('이름을 변경할 파일이 없습니다.\n먼저 파일을 열거나 새로 만들어주세요.');

    const baseName = currentFileName.replace(/\.json$/i, '');
    const newName = prompt('새 파일 이름을 입력하세요:', baseName);
    if (!newName || newName.trim() === '') return;

    const newFileName = newName.trim().endsWith('.json') ? newName.trim() : newName.trim() + '.json';

    if (newFileName === currentFileName) return; // 변경 없음

    if (loadedFiles[newFileName]) {
        if (!confirm(`"${newFileName}" 이름이 이미 존재합니다. 덮어쓸까요?`)) return;
        delete loadedFiles[newFileName];
    }

    // 기존 키 → 새 키로 교체
    loadedFiles[newFileName] = loadedFiles[currentFileName];
    delete loadedFiles[currentFileName];
    currentFileName = newFileName;

    updateFileSelectors();
}

// ===== 번역/변환 통합 모달 =====
function openTranslateConvertModal(tab) {
    try {
        tab = tab || 'translate';

        // 변환 입력 초기화
        document.getElementById('convertInput').value = '';
        delete window._convertedLorebook;

        // 파일이 없으면 변환 탭으로 기본 전환
        if (tab === 'translate' && !currentFileName) {
            tab = 'convert';
        }

        // 번역 탭이면 키워드 준비
        if (tab === 'translate') {
            prepareKeywordTranslation();
        }

        switchTcTab(tab);
        document.getElementById('translateConvertModal').style.display = 'flex';
    } catch (e) {
        alert('모달 열기 오류: ' + e.message + '\n' + e.stack);
        console.error(e);
    }
}

function switchTcTab(tab) {
    if (tab === 'translate' && !currentFileName) {
        alert('먼저 파일을 열어주세요.');
        return;
    }

    if (tab === 'translate' && !window._kwUniqueKeywords) {
        prepareKeywordTranslation();
    }

    const translateSection = document.getElementById('tcTranslateSection');
    const convertSection = document.getElementById('tcConvertSection');
    const translateTab = document.getElementById('tcTranslateTab');
    const convertTab = document.getElementById('tcConvertTab');
    const translateFooter = document.getElementById('tcTranslateFooter');
    const convertFooter = document.getElementById('tcConvertFooter');

    if (tab === 'translate') {
        translateSection.style.display = 'block';
        convertSection.style.display = 'none';
        translateTab.classList.add('active');
        convertTab.classList.remove('active');
        translateFooter.style.display = 'flex';
        convertFooter.style.display = 'none';
    } else {
        translateSection.style.display = 'none';
        convertSection.style.display = 'block';
        translateTab.classList.remove('active');
        convertTab.classList.add('active');
        translateFooter.style.display = 'none';
        convertFooter.style.display = 'flex';
    }
}

// ===== JanitorAI → SillyTavern 변환기 =====

function mapJanitorPlacement(placement, position) {
    // JanitorAI placement + position → SillyTavern position 매핑
    const placementMap = {
        'personality': { before: 0, after: 1 },        // 캐릭터 정의 전/후
        'author_note': { before: 2, after: 3 },        // 작가 노트 전/후
        'scenario': { before: 0, after: 1 },            // 시나리오 → 캐릭터 정의로 대체
        'example_messages': { before: 5, after: 6 },   // ↑EM / ↓EM
    };
    
    const posKey = (position === 'before') ? 'before' : 'after';
    
    if (placementMap[placement]) {
        return placementMap[placement][posKey];
    }
    return 1; // 기본값: 캐릭터 정의 후
}

function convertJanitorToST() {
    const input = document.getElementById('convertInput').value.trim();
    if (!input) { alert('JanitorAI 스크립트 JSON을 붙여넣어주세요.'); return null; }
    
    let janitorEntries;
    try {
        janitorEntries = JSON.parse(input);
    } catch (e) {
        alert('JSON 형식이 올바르지 않습니다.\n' + e.message); return null;
    }
    
    if (!Array.isArray(janitorEntries)) {
        alert('JanitorAI 스크립트는 배열([...]) 형태여야 합니다.'); return null;
    }
    
    // SillyTavern V2 구조 생성
    const stLorebook = { entries: {} };
    
    janitorEntries.forEach((entry, index) => {
        const uid = index;
        const stPosition = mapJanitorPlacement(
            entry.placement || 'personality',
            entry.placementPosition || (entry.placement === 'personality' ? 'after' : 'after')
        );
        
        // key 필드 처리: 배열이면 그대로, 문자열이면 쉼표 분리
        let keys = [];
        if (Array.isArray(entry.key)) {
            keys = entry.key;
        } else if (entry.keysRaw || entry.keywordsRaw) {
            keys = (entry.keysRaw || entry.keywordsRaw).split(',').map(s => s.trim()).filter(Boolean);
        }
        
        // secondary key 처리
        let keysecondary = [];
        if (Array.isArray(entry.keysecondary)) {
            keysecondary = entry.keysecondary;
        } else if (entry.keysecondaryRaw) {
            keysecondary = entry.keysecondaryRaw.split(',').map(s => s.trim()).filter(Boolean);
        }
        
        stLorebook.entries[uid] = {
            uid: uid,
            key: keys,
            keysecondary: keysecondary,
            comment: entry.name || entry.comment || `항목 ${index}`,
            content: entry.content || '',
            constant: !!entry.constant,
            vectorized: false,
            selective: !entry.constant,
            selectiveLogic: entry.selectiveLogic ?? 0,
            addMemo: true,
            order: entry.insertion_order ?? entry.priority ?? 100,
            position: stPosition,
            disable: entry.enabled === false,
            ignoreBudget: false,
            excludeRecursion: !!entry.excludeRecursion,
            preventRecursion: !!entry.preventRecursion,
            matchPersonaDescription: false,
            matchCharacterDescription: false,
            matchCharacterPersonality: false,
            matchCharacterDepthPrompt: false,
            matchScenario: false,
            matchCreatorNotes: false,
            delayUntilRecursion: false,
            probability: entry.probability ?? 100,
            useProbability: true,
            depth: 4,
            outletName: '',
            group: entry.inclusionGroupRaw || '',
            groupOverride: false,
            groupWeight: entry.groupWeight ?? 100,
            scanDepth: entry.depth ?? null,
            caseSensitive: entry.case_sensitive === true ? true : null,
            matchWholeWords: entry.matchWholeWords === true ? true : null,
            useGroupScoring: null,
            automationId: '',
            role: null,
            sticky: 0,
            cooldown: 0,
            delay: 0,
            triggers: [],
            displayIndex: uid,
            characterFilter: { isExclude: false, names: [], tags: [] }
        };
    });
    window._convertedLorebook = stLorebook;
    return stLorebook;
}

function saveConvertedLorebook() {
    // 자동 변환
    if (!window._convertedLorebook) {
        if (!convertJanitorToST()) return;
    }

    const name = prompt('저장할 파일 이름:', 'converted_lorebook');
    if (!name) return;

    const fileName = name.endsWith('.json') ? name : name + '.json';
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(window._convertedLorebook, null, 4));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function openConvertedInEditor() {
    // 자동 변환
    if (!window._convertedLorebook) {
        if (!convertJanitorToST()) return;
    }

    const name = prompt('변환된 로어북 파일 이름:', 'converted_lorebook');
    if (!name) return;

    const fileName = name.endsWith('.json') ? name : name + '.json';

    loadedFiles[fileName] = window._convertedLorebook;
    currentFileName = fileName;
    isFirstLoad = false;

    updateFileSelectors();
    loadFileData(window._convertedLorebook);

    // 첫 번째 항목 자동 선택 (편집 내용 바로 표시)
    const entries = Object.values(window._convertedLorebook.entries);
    entries.sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    if (entries.length > 0) {
        selectEntry(entries[0].uid);
    }

    closeModal('translateConvertModal');
    delete window._convertedLorebook;
}

function applyTransfer(mode) {
    const targetFile = document.getElementById('transferTargetFile').value;
    if(!targetFile) return alert('대상 파일을 선택하세요.');
    
    const sourceData = getCurrentLoreData();
    const targetData = loadedFiles[targetFile];
    
    let targetUids = Object.keys(targetData.entries).map(Number);
    let maxTargetUid = targetUids.length > 0 ? Math.max(...targetUids) : -1;

    selectedUids.forEach(uid => {
        const item = JSON.parse(JSON.stringify(sourceData.entries[uid])); // 깊은 복사
        maxTargetUid++;
        item.uid = maxTargetUid;
        item.displayIndex = maxTargetUid; // 순서 유지용
        targetData.entries[maxTargetUid] = item;
        
        if(mode === 'move') {
            delete sourceData.entries[uid];
            if(currentUid === uid) {
                currentUid = null;
                emptyState.style.display = 'flex';
                editorContent.style.display = 'none';
            }
        }
    });
    
    if(mode === 'move') {
        selectedUids.clear();
        document.getElementById('selectAllCheck').checked = false;
    }
    
    closeModal('transferModal');
    renderList(document.getElementById('searchInput').value);
    alert(`${mode === 'copy' ? '복사' : '이동'} 완료되었습니다.`);
}

function downloadJSON() {
    if (!currentFileName) return alert('저장할 파일이 없습니다.');
    const loreData = getCurrentLoreData();
    const baseName = currentFileName.replace(/\.json$/i, '');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(loreData, null, 4));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", baseName + '.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Event Listeners for Custom Input Toggles
document.getElementById('bulkScanDepth').addEventListener('change', function() {
    document.getElementById('bulkScanDepthStr').style.display = this.value === 'custom' ? 'block' : 'none';
});

// 변환 입력 변경 시 결과 초기화
document.getElementById('convertInput').addEventListener('input', function() {
    delete window._convertedLorebook;
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = ['bulkEditModal', 'transferModal', 'translateConvertModal'];
        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal && modal.style.display === 'flex') {
                closeModal(id);
            }
        });
    }
});

// ===== 순번 변경으로 항목 순서 이동 =====
function changeEntryOrder(newSeqStr) {
    if (currentUid === null) return;
    
    const loreData = getCurrentLoreData();
    const entries = Object.values(loreData.entries);
    entries.sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    
    const currentIdx = entries.findIndex(e => e.uid === currentUid);
    if (currentIdx === -1) return;
    
    let newSeq = parseInt(newSeqStr, 10);
    if (isNaN(newSeq) || newSeq < 1) newSeq = 1;
    if (newSeq > entries.length) newSeq = entries.length;
    
    const newIdx = newSeq - 1;
    if (newIdx === currentIdx) return; // 변경 없음
    
    // 배열에서 현재 항목을 빼서 새 위치에 삽입
    const [movedEntry] = entries.splice(currentIdx, 1);
    entries.splice(newIdx, 0, movedEntry);
    
    // displayIndex 재할당
    entries.forEach((entry, i) => {
        entry.displayIndex = i;
    });
    
    renderList(document.getElementById('searchInput').value);
    selectEntry(currentUid);
}

// ===== 키워드 번역 기능 (청크 지원) =====
var kwChunkSize = 100;
var kwCurrentChunk = 0;
var kwTotalChunks = 1;
var kwTranslations = [];

function prepareKeywordTranslation() {
    const loreData = getCurrentLoreData();
    const entries = Object.values(loreData.entries);

    // 고유 키워드 수집 (중복 제거, 순서 유지)
    const seen = new Set();
    const uniqueKeywords = [];
    entries.forEach(entry => {
        let keys = [];
        if (Array.isArray(entry.key)) {
            keys = entry.key;
        } else if (typeof entry.key === 'string') {
            keys = entry.key.split(',');
        }
        
        keys.forEach(k => {
            if (typeof k !== 'string') return;
            const trimmed = k.trim();
            if (trimmed && !seen.has(trimmed)) {
                seen.add(trimmed);
                uniqueKeywords.push(trimmed);
            }
        });
    });

    window._kwUniqueKeywords = uniqueKeywords;
    kwTranslations = new Array(uniqueKeywords.length).fill('');
    document.getElementById('kwCount').textContent = uniqueKeywords.length;

    // 청크 설정
    const isChunkingEnabled = document.getElementById('kwEnableChunking')?.checked ?? true;
    kwChunkSize = isChunkingEnabled ? 100 : Math.max(1, uniqueKeywords.length);
    kwCurrentChunk = 0;
    kwTotalChunks = Math.ceil(uniqueKeywords.length / kwChunkSize) || 1;

    // 100개 초과 시 청크 컨트롤 표시 (체크된 경우만)
    const chunkControls = document.getElementById('kwChunkControls');
    if (isChunkingEnabled && uniqueKeywords.length > 100) {
        chunkControls.style.display = 'flex';
    } else {
        chunkControls.style.display = 'none';
    }

    updateKwChunkView();

    // 수동 모드 테이블 생성
    const tableBody = document.getElementById('kwManualTableBody');
    tableBody.innerHTML = uniqueKeywords.map((kw, i) => `
        <tr>
            <td class="kw-original-cell"><div class="kw-original-content">${kw}</div></td>
            <td><input type="text" class="form-input kw-translate-input" data-index="${i}" placeholder="번역 입력..." /></td>
        </tr>
    `).join('');

    switchKwMode('bulk');
}

function updateKwChunkView() {
    const keywords = window._kwUniqueKeywords || [];
    if (keywords.length === 0) {
        document.getElementById('kwOriginalList').value = '';
        document.getElementById('kwTranslatedList').value = '';
        return;
    }

    const start = kwCurrentChunk * kwChunkSize;
    const end = Math.min(start + kwChunkSize, keywords.length);
    const chunk = keywords.slice(start, end);

    document.getElementById('kwOriginalList').value = chunk.join('\n');

    // 저장된 번역 불러오기
    const savedTranslations = kwTranslations.slice(start, end);
    const hasContent = savedTranslations.some(s => s);
    document.getElementById('kwTranslatedList').value = hasContent ? savedTranslations.join('\n') : '';

    // 컨트롤 업데이트
    document.getElementById('kwChunkPage').textContent = kwCurrentChunk + 1;
    document.getElementById('kwChunkTotal').textContent = kwTotalChunks;
    document.getElementById('kwChunkRange').textContent = (start + 1) + '-' + end;
    document.getElementById('kwChunkTotalCount').textContent = keywords.length;
}

function toggleKwChunking() {
    saveCurrentChunkTranslations();

    const uniqueKeywords = window._kwUniqueKeywords || [];
    const isChunkingEnabled = document.getElementById('kwEnableChunking').checked;
    
    kwChunkSize = isChunkingEnabled ? 100 : Math.max(1, uniqueKeywords.length);
    kwCurrentChunk = 0;
    kwTotalChunks = Math.ceil(uniqueKeywords.length / kwChunkSize) || 1;

    const chunkControls = document.getElementById('kwChunkControls');
    if (isChunkingEnabled && uniqueKeywords.length > 100) {
        chunkControls.style.display = 'flex';
    } else {
        chunkControls.style.display = 'none';
    }

    updateKwChunkView();
}

function saveCurrentChunkTranslations() {
    const keywords = window._kwUniqueKeywords || [];
    const start = kwCurrentChunk * kwChunkSize;
    const end = Math.min(start + kwChunkSize, keywords.length);
    const translated = document.getElementById('kwTranslatedList').value.split('\n');

    for (let i = 0; i < end - start; i++) {
        kwTranslations[start + i] = (translated[i] || '').trim();
    }
}

function prevKwChunk() {
    if (kwCurrentChunk <= 0) return;
    saveCurrentChunkTranslations();
    kwCurrentChunk--;
    updateKwChunkView();
}

function nextKwChunk() {
    if (kwCurrentChunk >= kwTotalChunks - 1) return;
    saveCurrentChunkTranslations();
    kwCurrentChunk++;
    updateKwChunkView();
}

function switchKwMode(mode) {
    const bulkSection = document.getElementById('kwBulkSection');
    const manualSection = document.getElementById('kwManualSection');
    const bulkTab = document.getElementById('kwBulkTab');
    const manualTab = document.getElementById('kwManualTab');

    if (mode === 'bulk') {
        bulkSection.style.display = 'block';
        manualSection.style.display = 'none';
        bulkTab.classList.add('active');
        manualTab.classList.remove('active');
    } else {
        bulkSection.style.display = 'none';
        manualSection.style.display = 'block';
        bulkTab.classList.remove('active');
        manualTab.classList.add('active');
    }
}

function copyKeywordsToClipboard() {
    const text = document.getElementById('kwOriginalList').value;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('kwCopyBtn');
        const origText = btn.textContent;
        btn.textContent = '✅ 복사됨!';
        setTimeout(() => btn.textContent = origText, 1500);
    }).catch(() => {
        const ta = document.getElementById('kwOriginalList');
        ta.select();
        document.execCommand('copy');
        alert('클립보드에 복사되었습니다.');
    });
}

function applyKeywordTranslation() {
    const uniqueKeywords = window._kwUniqueKeywords;
    if (!uniqueKeywords || uniqueKeywords.length === 0) return alert('키워드가 없습니다.');

    const translationMap = {};

    const bulkSection = document.getElementById('kwBulkSection');
    if (bulkSection.style.display !== 'none') {
        // 현재 청크 저장
        saveCurrentChunkTranslations();

        if (kwTotalChunks <= 1) {
            // 단일 페이지: 텍스트에리어에서 직접 읽기
            const translatedText = document.getElementById('kwTranslatedList').value.trim();
            if (!translatedText) return alert('번역된 키워드를 붙여넣어주세요.');

            const translatedLines = translatedText.split('\n').map(s => s.trim());

            if (translatedLines.length !== uniqueKeywords.length) {
                const proceed = confirm(
                    '원본 키워드: ' + uniqueKeywords.length + '개\n번역 키워드: ' + translatedLines.length + '개\n\n개수가 다릅니다. 짧은 쪽 기준으로 적용할까요?'
                );
                if (!proceed) return;
            }

            const len = Math.min(uniqueKeywords.length, translatedLines.length);
            for (let i = 0; i < len; i++) {
                if (translatedLines[i] && translatedLines[i] !== uniqueKeywords[i]) {
                    translationMap[uniqueKeywords[i]] = translatedLines[i];
                }
            }
        } else {
            // 다중 페이지: 저장된 번역에서 읽기
            let filledCount = 0;
            for (let i = 0; i < uniqueKeywords.length; i++) {
                if (kwTranslations[i]) filledCount++;
                if (kwTranslations[i] && kwTranslations[i] !== uniqueKeywords[i]) {
                    translationMap[uniqueKeywords[i]] = kwTranslations[i];
                }
            }
            if (filledCount === 0) return alert('번역된 키워드를 각 페이지에 붙여넣어주세요.');
        }
    } else {
        // 수동 모드
        const inputs = document.querySelectorAll('.kw-translate-input');
        inputs.forEach(input => {
            const idx = Number(input.dataset.index);
            const translated = input.value.trim();
            if (translated && translated !== uniqueKeywords[idx]) {
                translationMap[uniqueKeywords[idx]] = translated;
            }
        });
    }

    const changeCount = Object.keys(translationMap).length;
    if (changeCount === 0) return alert('변경할 키워드가 없습니다.');

    if (!confirm(changeCount + '개의 키워드를 교체합니다. 진행할까요?')) return;

    // 로어북 전체 항목에 번역 적용
    const loreData = getCurrentLoreData();
    let totalReplaced = 0;

    Object.values(loreData.entries).forEach(entry => {
        let keys = [];
        let isStringKey = false;
        
        if (Array.isArray(entry.key)) {
            keys = entry.key;
        } else if (typeof entry.key === 'string') {
            keys = entry.key.split(',');
            isStringKey = true;
        }

        if (keys.length > 0) {
            const updatedKeys = keys.map(k => {
                if (typeof k !== 'string') return k;
                const trimmed = k.trim();
                if (translationMap[trimmed]) {
                    totalReplaced++;
                    return translationMap[trimmed];
                }
                return k;
            });
            
            if (isStringKey) {
                entry.key = updatedKeys.join(', ');
            } else {
                entry.key = updatedKeys;
            }
        }
    });

    closeModal('translateConvertModal');
    renderList(document.getElementById('searchInput').value);
    if (currentUid !== null) selectEntry(currentUid);

    alert('완료: ' + changeCount + '개 고유 키워드 → ' + totalReplaced + '건 교체됨');
    delete window._kwUniqueKeywords;
    kwTranslations = [];
}

function expandContent() {
    const el = document.getElementById('inputContent');
    if (el) {
        el.style.maxHeight = 'none';
        el.style.height = '800px';
    }
}

function resetContent() {
    const el = document.getElementById('inputContent');
    if (el) {
        el.style.maxHeight = '';
        el.style.height = '';
    }
}
