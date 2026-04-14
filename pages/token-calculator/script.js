/**
 * 토큰 계산기 - Gemini 기준 토큰 수 & 비용 계산
 * 가격은 UI에서 직접 수정 가능, 모델 동적 추가/삭제, 드롭다운으로 계산 모델 선택
 * 계산 비교 히스토리 저장
 */

(function () {
    'use strict';

    /* ── 기본 데이터 모델 ── */
    const defaultModels = [
        { id: 'm1', name: '3.1 Pro', input: 2.00, output: 12.00 },
        { id: 'm2', name: '3.0 Flash', input: 0.50, output: 3.00 }
    ];

    let models = JSON.parse(localStorage.getItem('tokenCalcModels')) || defaultModels;
    let selectedMainId = localStorage.getItem('tokenCalcMain') || 'm1';
    let selectedTransId = localStorage.getItem('tokenCalcTrans') || 'm2';

    // 모델 리스트 무결성 체크
    if (!Array.isArray(models) || models.length === 0) {
        models = JSON.parse(JSON.stringify(defaultModels));
    } else {
        // 첫 번째와 두 번째 모델은 무조건 3.1 Pro, 3.0 Flash로 고정 보장
        if(models[0].id !== 'm1') models.unshift(defaultModels[0]);
        if(models[1] && models[1].id !== 'm2' && !models.find(x=>x.id==='m2')) models.splice(1, 0, defaultModels[1]);
        if(!models[1]) models.push(defaultModels[1]);
    }
    
    if (!models.find(m => m.id === selectedMainId)) selectedMainId = models[0].id;
    if (!models.find(m => m.id === selectedTransId)) selectedTransId = models[1].id || models[0].id;

    function saveModels() {
        localStorage.setItem('tokenCalcModels', JSON.stringify(models));
        localStorage.setItem('tokenCalcMain', selectedMainId);
        localStorage.setItem('tokenCalcTrans', selectedTransId);
    }

    /* ── 히스토리 데이터 ── */
    // 기존에 잘못 저장된 브라우저 데이터를 청소 (새로고침 시 초기화를 위함)
    localStorage.removeItem('tokenCalcHistories');
    
    // 메모리에만 유지 (새로고침 시 즉시 비워짐)
    let histories = [];
    
    function saveHistories() {
        // 영구 저장을 제거하여 임시 기록장으로만 작동되게 함
    }

    // 현재 계산 데이터 임시 보관용
    let currentCalcData = null;

    /* ── UI 요소 ── */
    const pricingBody = document.getElementById('pricingBody');
    const addModelBtn = document.getElementById('addModelBtn');
    const historySection = document.getElementById('historySection');
    const historyBody = document.getElementById('historyBody');
    const saveHistoryBtn = document.getElementById('saveHistoryBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    function renderTable() {
        if (!pricingBody) return;
        pricingBody.innerHTML = '';
        models.forEach(model => {
            const isFixed = model.id === 'm1' || model.id === 'm2';
            
            const nameEl = isFixed 
                ? `<span style="display:inline-block; padding: 4px; font-weight: bold; width: 90px; color: var(--text-primary);">${model.name}</span>` 
                : `<input type="text" class="price-input model-name" data-id="${model.id}" value="${model.name}" style="width: 90px; text-align: left; padding: 4px;">`;
                
            const delEl = isFixed 
                ? `` 
                : `<button class="del-model-btn" data-id="${model.id}" style="border: none; background: transparent; cursor: pointer; color: #e74c3c; font-size: 14px;" title="삭제">✕</button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 6px 10px;">${nameEl}</td>
                <td style="padding: 6px 10px;"><input type="number" class="price-input model-in" data-id="${model.id}" value="${model.input}" step="0.01" min="0" style="width: 70px; padding: 4px;"></td>
                <td style="padding: 6px 10px;"><input type="number" class="price-input model-out" data-id="${model.id}" value="${model.output}" step="0.01" min="0" style="width: 70px; padding: 4px;"></td>
                <td style="text-align: center;">${delEl}</td>
            `;
            pricingBody.appendChild(tr);
        });

        // 이벤트 바인딩
        pricingBody.querySelectorAll('.model-name').forEach(el => {
            el.addEventListener('input', (e) => {
                const m = models.find(x => x.id === e.target.getAttribute('data-id'));
                if (m) m.name = e.target.value;
                saveModels();
                dc();
            });
        });

        pricingBody.querySelectorAll('.model-in').forEach(el => {
            el.addEventListener('input', (e) => {
                const m = models.find(x => x.id === e.target.getAttribute('data-id'));
                if (m) m.input = parseFloat(e.target.value) || 0;
                saveModels();
                dc();
            });
        });

        pricingBody.querySelectorAll('.model-out').forEach(el => {
            el.addEventListener('input', (e) => {
                const m = models.find(x => x.id === e.target.getAttribute('data-id'));
                if (m) m.output = parseFloat(e.target.value) || 0;
                saveModels();
                dc();
            });
        });

        pricingBody.querySelectorAll('.del-model-btn').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                models = models.filter(x => x.id !== id);
                if (selectedMainId === id) selectedMainId = models[0].id;
                if (selectedTransId === id) selectedTransId = models[1] ? models[1].id : models[0].id;
                saveModels();
                renderTable();
                dc();
            });
        });
    }

    if (addModelBtn) {
        addModelBtn.addEventListener('click', () => {
            models.push({
                id: 'm' + Date.now(),
                name: '새 모델',
                input: 0.00,
                output: 0.00
            });
            saveModels();
            renderTable();
            const pricingDiv = addModelBtn.parentElement.nextElementSibling;
            if(pricingDiv) pricingDiv.scrollLeft = 0;
            dc();
        });
    }

    /* ── 히스토리 렌더링 ── */
    function renderHistories() {
        if (!historySection || !historyBody) return;
        if (histories.length === 0) {
            historySection.style.display = 'none';
            return;
        }
        historySection.style.display = 'block';
        historyBody.innerHTML = '';
        histories.forEach((h, index) => {
            const isDefault = index === 0;
            const tr = document.createElement('tr');
            
            let detailsHtml = '';
            h.details.forEach(d => {
                detailsHtml += `<div class="history-detail-line"><strong>${d.desc}</strong>: ${d.modelName} <span style="margin-left:8px;">${d.costStr}</span></div>`;
            });

            let compareCellHtml = '';

            if (isDefault) {
                compareCellHtml = `<div style="display:flex; justify-content:center;"><span class="badge-default" style="margin:0;">기본</span></div>`;
            } else {
                compareCellHtml = `
                    <div style="display:flex; justify-content:center; align-items:center; height:100%;">
                        <input type="checkbox" class="compare-check" data-id="${h.id}" style="cursor: pointer; width:15px; height:15px; accent-color: #42a5f5;" title="비교">
                    </div>
                `;
            }

            tr.innerHTML = `
                <td style="vertical-align: middle;">${compareCellHtml}</td>
                <td>
                    <div class="history-text-col" id="hist-text-${h.id}"></div>
                    <button class="expand-text-btn" onclick="const el=document.getElementById('hist-text-${h.id}'); el.classList.toggle('expanded'); this.textContent = el.classList.contains('expanded') ? '접기 ▲' : '자세히 보기 ▼'">자세히 보기 ▼</button>
                </td>
                <td>${detailsHtml}</td>
                <td>
                    <div class="history-total">${h.totalCostStr}</div>
                    <div class="history-krw">${h.totalKrwStr}</div>
                </td>
                <td style="text-align: center; vertical-align: middle;">
                    <button class="del-hist-btn" data-id="${h.id}" style="border: none; background: transparent; cursor: pointer; color: #e74c3c; font-size: 14px;" title="삭제">✕</button>
                </td>
            `;
            const textDiv = tr.querySelector('.history-text-col');
            textDiv.textContent = h.text;

            setTimeout(() => {
                if (textDiv.scrollHeight <= 48) {
                    tr.querySelector('.expand-text-btn').style.display = 'none';
                }
            }, 10);

            historyBody.appendChild(tr);
        });

        // Setup global diff update logic
        historyBody.querySelectorAll('.compare-check').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const checkbox = e.target;
                const globalDiffArea = document.getElementById('globalDiffArea');
                if(!globalDiffArea) return;
                
                if (!checkbox.checked) {
                    globalDiffArea.style.display = 'none';
                    return;
                }
                
                // Allow only one checked at a time for comparison against base
                document.querySelectorAll('.compare-check').forEach(other => {
                    if (other !== checkbox) other.checked = false;
                });
                
                const id = parseInt(checkbox.getAttribute('data-id'), 10);
                const h = histories.find(x => x.id === id);
                const baseH = histories[0];
                
                if (!h || !baseH) {
                    globalDiffArea.style.display = 'none';
                    return;
                }
                
                const hCost = h.total !== undefined ? h.total : parseFloat(h.totalCostStr.replace(/[^\d.]/g, ''));
                const bCost = baseH.total !== undefined ? baseH.total : parseFloat(baseH.totalCostStr.replace(/[^\d.]/g, ''));
                const hKrw = h.totalKrw !== undefined ? h.totalKrw : parseFloat(h.totalKrwStr.replace(/[^\d.]/g, ''));
                const bKrw = baseH.totalKrw !== undefined ? baseH.totalKrw : parseFloat(baseH.totalKrwStr.replace(/[^\d.]/g, ''));
                
                const diffCost = hCost - bCost;
                const diffKrw = hKrw - bKrw;

                let diffS = '';
                let diffK = '';
                let color = 'inherit';
                
                if (Math.abs(diffCost) < 0.000001) {
                    diffS = '차이 없음';
                    color = 'var(--text-secondary)';
                    document.getElementById('globalDiffKRW').style.display = 'none';
                } else {
                    diffS = fmtDiff$(diffCost);
                    diffK = fmtDiffKRW(diffKrw);
                    color = diffCost > 0 ? '#e74c3c' : '#2ecc71';
                    document.getElementById('globalDiffKRW').style.display = 'inline';
                    document.getElementById('globalDiffKRW').textContent = `(${diffK})`;
                }
                
                globalDiffArea.style.display = 'flex';
                globalDiffArea.style.color = color;
                document.getElementById('globalDiffUSD').textContent = diffS;
            });
        });

        const globalArea = document.getElementById('globalDiffArea');
        if(globalArea) globalArea.style.display = 'none';

        historyBody.querySelectorAll('.del-hist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
                histories = histories.filter(x => x.id !== id);
                saveHistories();
                renderHistories();
            });
        });
    }

    if (saveHistoryBtn) {
        saveHistoryBtn.addEventListener('click', () => {
            if (!currentCalcData || !currentCalcData.text.trim()) {
                alert('저장할 텍스트나 계산 내역이 없습니다.');
                return;
            }
            histories.push({
                id: Date.now(),
                ...currentCalcData
            });
            saveHistories();
            renderHistories();
            
            const origText = saveHistoryBtn.textContent;
            saveHistoryBtn.textContent = '✅ 저장되었습니다';
            saveHistoryBtn.style.color = 'var(--text-green)';
            setTimeout(() => {
                saveHistoryBtn.textContent = origText;
                saveHistoryBtn.style.color = '#1976d2';
            }, 1500);
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('모든 비교 목록을 삭제합니다. 계속하시겠습니까?')) {
                histories = [];
                saveHistories();
                renderHistories();
            }
        });
    }

    /* ── 유틸 ── */
    function getRate() { return parseFloat(document.getElementById('exchangeRate').value) || 1450; }

    function estimateTokens(text) {
        if (!text || text.trim().length === 0) return 0;
        let tokens = 0;
        for (let i = 0; i < text.length; i++) {
            const c = text.charCodeAt(i);
            if (c >= 0xAC00 && c <= 0xD7AF)         tokens += 0.67;
            else if (c >= 0x3000 && c <= 0x9FFF)    tokens += 0.67;
            else if (c >= 0x1100 && c <= 0x11FF)    tokens += 0.5;
            else if (c === 0x20)                    tokens += 0.15;
            else if (c === 0x0A || c === 0x0D)      tokens += 0.1;
            else if (c <= 0x007F)                   tokens += 0.25;
            else                                    tokens += 0.5;
        }
        return Math.max(1, Math.ceil(tokens));
    }

    function fmt$(n) {
        if (!n || isNaN(n) || n <= 0) return '$0';
        if (n < 0.01) return '$' + n.toFixed(6);
        return '$' + n.toFixed(4);
    }
    function fmtKRW(n) {
        if (!n || isNaN(n) || n <= 0) return '₩0';
        if (n < 10) return '₩' + n.toFixed(2);
        return '₩' + Math.round(n).toLocaleString('ko-KR');
    }
    function fmtN(n) { return n.toLocaleString('ko-KR'); }

    function fmtDiff$(val) {
        if (Math.abs(val) < 0.000001) return '$0';
        const sign = val > 0 ? '+' : '-';
        const absVal = Math.abs(val);
        if (absVal < 0.01) return sign + '$' + absVal.toFixed(6).replace(/\.?0+$/, '');
        return sign + '$' + absVal.toFixed(4).replace(/\.?0+$/, '');
    }
    function fmtDiffKRW(val) {
        if (Math.abs(val) < 0.000001) return '₩0';
        const sign = val > 0 ? '+' : '-';
        const absVal = Math.abs(val);
        if (absVal < 10) return sign + '₩' + absVal.toFixed(2);
        return sign + '₩' + Math.round(absVal).toLocaleString('ko-KR');
    }

    /* ── UI 토글 ── */
    function updateOptions() {
        const useTrans = document.getElementById('useTranslation').checked;
        document.getElementById('realTextOption').style.display = useTrans ? '' : 'none';
        if (!useTrans) {
            document.getElementById('useRealText').checked = false;
        }
        const showReal = useTrans && document.getElementById('useRealText').checked;
        document.getElementById('translatedSection').style.display = showReal ? '' : 'none';
        document.getElementById('translatedStats').style.display = useTrans ? 'contents' : 'none';
        calculate();
    }

    /* ── 비용 행 & 드롭다운 생성 ── */
    function generateModelSelect(currentModelId, role) {
        let options = '';
        models.forEach(m => {
            const isSel = m.id === currentModelId ? 'selected' : '';
            options += `<option value="${m.id}" ${isSel}>${m.name}</option>`;
        });
        return `<select class="model-dropdown" data-role="${role}">${options}</select>`;
    }

    function costLine(desc, curModel, role, tokens, rateVal, cost, exRate) {
        const krw = fmtKRW(cost * exRate);
        const rateStr = `$${rateVal.toFixed(2)}/1M`;
        const selectHtml = generateModelSelect(curModel.id, role);

        return `<div class="cost-line">
            <span class="cost-desc">${desc} ${selectHtml}</span>
            <span class="cost-detail">${fmtN(tokens)} tok × ${rateStr}</span>
            <span class="cost-amounts">
                <span class="cost-amount">${fmt$(cost)}</span>
                <span class="cost-krw">${krw}</span>
            </span>
        </div>`;
    }

    /* ── 메인 계산 ── */
    function calculate() {
        const text = document.getElementById('tokenInput').value;
        const useTrans = document.getElementById('useTranslation').checked;
        const useReal = document.getElementById('useRealText').checked;
        const transText = document.getElementById('translatedInput').value;
        const rate = getRate();

        const tokens = estimateTokens(text);
        const chars = text.length;

        document.getElementById('statChars').textContent = fmtN(chars);
        document.getElementById('statTokens').textContent = fmtN(tokens);

        let transTokens = 0;
        let isEstimate = true;

        if (useTrans) {
            if (useReal && transText.trim().length > 0) {
                transTokens = estimateTokens(transText);
                isEstimate = false;
            } else {
                transTokens = Math.ceil(tokens * 1.8);
                isEstimate = true;
            }
            document.getElementById('statTransTokens').textContent = fmtN(transTokens);
            document.getElementById('estBadge').style.display = isEstimate ? '' : 'none';
        }

        const costArea = document.getElementById('costBreakdown');
        const totalEl = document.getElementById('totalCost');
        const totalKRW = document.getElementById('totalCostKRW');

        if (chars === 0) {
            costArea.innerHTML = '<div class="cost-empty">텍스트를 입력하면 비용이 표시됩니다.</div>';
            totalEl.textContent = '$0';
            totalKRW.textContent = '₩0';
            currentCalcData = null;
            if(saveHistoryBtn) saveHistoryBtn.style.opacity = '0.5';
            return;
        }

        if(saveHistoryBtn) saveHistoryBtn.style.opacity = '1';

        let html = '';
        let total = 0;
        let calcDetails = []; 

        const selMain = models.find(m => m.id === selectedMainId) || models[0];

        // 1) 출력 비용
        const mainCost = tokens * (selMain.output / 1_000_000);
        total += mainCost;
        html += costLine(`출력 (메인)`, selMain, 'main', tokens, selMain.output, mainCost, rate);
        calcDetails.push({ desc: '출력 (메인)', modelName: selMain.name, costStr: fmt$(mainCost) });

        // 2) 번역 시 사용하는 모델
        if (useTrans) {
            const selTrans = models.find(m => m.id === selectedTransId) || models[1] || models[0];

            const tInCost = tokens * (selTrans.input / 1_000_000);
            total += tInCost;
            html += '<div class="cost-divider"></div>';
            html += costLine(`입력 (번역)`, selTrans, 'trans', tokens, selTrans.input, tInCost, rate);
            calcDetails.push({ desc: '입력 (번역)', modelName: selTrans.name, costStr: fmt$(tInCost) });

            const tOutCost = transTokens * (selTrans.output / 1_000_000);
            total += tOutCost;
            const label = isEstimate ? `출력 (번역추정)` : `출력 (번역실측)`;
            html += costLine(label, selTrans, 'trans', transTokens, selTrans.output, tOutCost, rate);
            calcDetails.push({ desc: label, modelName: selTrans.name, costStr: fmt$(tOutCost) });
        }

        costArea.innerHTML = html;
        totalEl.textContent = fmt$(total);
        totalKRW.textContent = fmtKRW(total * rate);

        // 이벤트 재바인딩 드롭다운
        costArea.querySelectorAll('.model-dropdown').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const role = e.target.getAttribute('data-role');
                const val = e.target.value;
                if (role === 'main') selectedMainId = val;
                else if (role === 'trans') selectedTransId = val;
                saveModels();
                dc();
            });
        });

        // 현재 계산 데이터 기록
        let savedText = text.trim();
        if (useTrans && useReal && transText.trim().length > 0) {
            savedText += ' / ' + transText.trim();
        }

        currentCalcData = {
            text: savedText,
            details: calcDetails,
            totalCostStr: fmt$(total),
            totalKrwStr: fmtKRW(total * rate),
            total: total,
            totalKrw: total * rate
        };
    }

    /* ── 디바운스 ── */
    function debounce(fn, ms) {
        let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    }
    const dc = debounce(calculate, 120);

    /* ── 초기화 ── */
    document.addEventListener('DOMContentLoaded', function () {
        renderTable();
        renderHistories();

        document.getElementById('tokenInput').addEventListener('input', dc);
        document.getElementById('translatedInput').addEventListener('input', dc);
        document.getElementById('useTranslation').addEventListener('change', updateOptions);
        document.getElementById('useRealText').addEventListener('change', updateOptions);
        document.getElementById('exchangeRate').addEventListener('input', dc);

        calculate();
    });
})();
