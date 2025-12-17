// 전역 변수 선언
const rawInput = document.getElementById('raw-input');
const regexInput = document.getElementById('regex-input');
const renderTarget = document.getElementById('render-target');
const regexError = document.getElementById('regex-error');
const groupList = document.getElementById('group-list');
const presetContainer = document.getElementById('preset-container');


let editor; // CodeMirror 인스턴스
let viewMode = 'content';


/**
 * 1. 에디터 및 초기화
 */
window.onload = function() {
    // 텍스트 영역을 CodeMirror로 변환
    const textArea = document.getElementById('template-input');
    if (textArea) {
        editor = CodeMirror.fromTextArea(textArea, {
            mode: 'xml', // HTML/XML 문법 강조
            lineNumbers: true,
            lineWrapping: true,
            theme: 'default'
        });


        // 에디터 내용 변경 시 실시간 렌더링
        editor.on('change', () => {
            render();
        });
    }
   
    // 프리셋 로드
    initPresets();

    setViewMode('content');
    
    // 모바일에서 초기 로드 시 편집 탭만 표시
    initMobileView();
};


/**
 * 모바일 초기 뷰 설정
 */
function initMobileView() {
    if (window.innerWidth <= 768) {
        const previewSide = document.getElementById('preview-side');
        previewSide.classList.add('hidden');
        
        // 편집 탭을 활성화
        const tabs = document.querySelectorAll('.mobile-tab');
        if (tabs.length > 0) {
            tabs[0].classList.add('active');
        }
    }
}


/**
 * 2. 텍스트 찾기 (CodeMirror 방식)
 */
function findText(direction = 'next') {
    const query = document.getElementById('find-query').value;
    if (!query) {
        alert("검색어를 입력해주세요.");
        return;
    }


    // 현재 커서 위치 기준으로 검색 시작 지점 결정
    const startPos = (direction === 'next') ? editor.getCursor('to') : editor.getCursor('from');
    let cursor = editor.getSearchCursor(query, startPos, { caseFold: true });


    // 검색 실행
    if (!cursor.find(direction === 'prev')) {
        // 끝에 도달하면 반대편 끝으로 이동 (순환 검색)
        const loopStart = (direction === 'next') ? {line: 0, ch: 0} : {line: editor.lineCount(), ch: 0};
        cursor = editor.getSearchCursor(query, loopStart, { caseFold: true });
        
        if (!cursor.find(direction === 'prev')) {
            alert("일치하는 단어가 없습니다.");
            return;
        }
    }


    editor.setSelection(cursor.from(), cursor.to());
    editor.scrollIntoView({from: cursor.from(), to: cursor.to()}, 150);
}


/**
 * 3. 클립보드 복사
 */
function copyToClipboard(id, btn) {
    let textToCopy = "";
    
    // 1. 가져올 대상이 template-input(CodeMirror)인 경우
    if (id === 'template-input') {
        if (editor) {
            textToCopy = editor.getValue(); // 에디터에서 텍스트 가져오기
        } else {
            textToCopy = document.getElementById(id).value;
        }
    } 
    // 2. 그 외 일반 입력창인 경우
    else {
        const el = document.getElementById(id);
        if (el) textToCopy = el.value;
    }


    // 실제 복사 로직
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


/**
 * 4. 프리셋 관리
 */
function initPresets() {
    if (typeof customPresets === 'undefined') return;


    customPresets.forEach((p, idx) => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.innerText = p.name;
        btn.onclick = () => {
            presetContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            rawInput.value = p.input || "";
            regexInput.value = p.regex || "";
            
            // CodeMirror는 setValue를 사용해야 함
            if (editor) {
                editor.setValue(p.template || "");
            } else {
                document.getElementById('template-input').value = p.template || "";
            }
            render();
        };
        presetContainer.appendChild(btn);
        //if (idx === 0) btn.click();
    });
}


/**
 * 5. 뷰 모드 설정
 */
function setViewMode(mode) {
    viewMode = mode;
    const btnContent = document.getElementById('btn-content');
    const btnDebug = document.getElementById('btn-debug');


    // .view-btn 클래스만 다루도록 변경
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));


    if (mode === 'content') {
        btnContent.classList.add('active');
    } else {
        btnDebug.classList.add('active');
    }
    render();
}


/**
 * 6. 핵심 렌더링 로직
 */
function render() {
    const text = rawInput.value;
    let regexStr = regexInput.value.trim();
    // CodeMirror 에디터에서 값 가져오기
    const template = editor ? editor.getValue() : document.getElementById('template-input').value;


    regexError.style.display = 'none';
    groupList.innerHTML = '';
    renderTarget.innerHTML = '';


    if (!regexStr || !text) {
        // 초기 가이드 문구를 띄우고 싶다면 여기에 추가
        renderTarget.innerHTML = "<div style='color:#adb5bd; text-align:center; padding-top:100px;'>팩트처럼 정규식을 나눈경우(박스, 내용)는 못봐요..🥺<br>정규식 1개짜리만 볼 수 있습니다.<br><br>여백 문제로 완전히 똑같이 나오지 않습니다.<br>아주 살짝 차이나는 정도..<br>출력창과 정규식창은 끌어내리면 늘어나요<br><br><br>+<br>실리에 디자인 적용할때 사소한 팁<br>&lt;/style&gt; 이후에 <b>&quot;내용&quot;(큰따옴표)</b>들어가면 오류남<br><b>/*&nbsp;내용&nbsp;*/(주석처리)</b>들어가면 오류남<br>아닐수도 있지만 제 경우는 그랬음<br>ㅠㅠ</div>";
        return;
    }


    try {
        let pattern, flags;
        
        // /pattern/flags 형식인지 체크
        const slashMatch = regexStr.match(/^\/(.*)\/([a-z]*)$/s);
        
        if (slashMatch) {
            // /pattern/flags 형식
            pattern = slashMatch[1];
            flags = slashMatch[2];
        } else {
            // 직접 패턴만 입력한 경우
            pattern = regexStr;
            flags = '';
        }
        
        // matchAll을 사용하려면 반드시 'g' 플래그가 필요함
        if (!flags.includes('g')) {
            flags += 'g';
        }
        
        const re = new RegExp(pattern, flags);
        const matches = [...text.matchAll(re)];


        if (matches.length > 0) {
            const firstMatch = matches[0];


            // 헤더에 그룹 개수 표시 (선택사항)
            const headerSpan = document.querySelector('.group-header span');
            if (headerSpan) {
                headerSpan.innerText = `매칭 그룹 정보 (${firstMatch.length - 1}개 발견)`;
            }
            
            // 그룹 리스트 업데이트 ($1, $2...)
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
            renderTarget.innerHTML = "<div style='color:#adb5bd; text-align:center; padding-top:100px;'>매칭 결과가 없습니다.</div>";
        }
    } catch (e) {
        regexError.style.display = 'block';
        regexError.innerText = e.message;
    }
}


/**
 * 7. 이벤트 리스너
 */
// 1) 일반 입력창 (1번 출력형식, 2번 정규식) 감시 - 실시간 렌더링
[rawInput, regexInput].forEach(el => el.addEventListener('input', render));


// 2) 정규식 입력창(2번)에서 엔터키 처리 - 줄바꿈 방지 및 렌더링
regexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        render();           
    }
});


// 3) 검색창(3번 위) 엔터키 처리 - 검색 실행
document.getElementById('find-query').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.shiftKey ? findText('prev') : findText('next');
    }
});


/**
 * 8. 기타 유틸리티 함수
 */
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


/**
 * 모든 입력창 초기화
 */
function resetAll() {
    // 확인 절차 없이 바로 새로고침하려면 아래 한 줄만 남기세요.
    location.reload();
}


/**
 * 모바일 탭 전환 함수
 */
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
    previewSide.classList.toggle('dark-mode');
    
});

