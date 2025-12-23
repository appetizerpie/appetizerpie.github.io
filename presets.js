const customPresets = [
    {
        name: "에코",
        input: `<Info_panel>\n[08.16 (2일차) | 07:15 | 세라피나의 숲속 오두막]\n[검은 선드레스 | 😊 평온함, 보살피는 기분]\n[Mission: 미션이 있다면 이런모습]\n[Love Score: 50] They look much better this morning. The color is returning to their cheeks. (오늘 아침은 훨씬 좋아 보이네. 뺨에 혈색이 돌아오고 있어.)\n[Score Change: +5 호감도가 이런이유로 오름]\n[Soundtrack: (노래추천)]\n</Info_panel>`,
        regex: `/<Info_panel>\\s*(?:___|[-*]{3,})?\\s*\\[\\s*(?:DAY\\s*)?([^|\\\]]+?)\\s*\\|\\s*([^|\\\]]+?)\\s*\\|\\s*([^\\]]+?)\\s*\\]\\s*\\[\\s*([^|\\\]]+?)\\s*\\|\\s*(?:([^|\\\]\\s]+)\\s+)?([^\\]]+?)\\s*\\]\\s*(?:\\[\\s*(?:Mission:\\s*)?([^\\]]+?)\\s*\\])?\\s*\\[\\s*(?:Love Score:\\s*)?([^\\]]+?)\\s*\\]\\s*([^\\\[]*?)(?:\\[\\s*(?:Score\\s*Change:\\s*)?([^\\]]+?)\\s*\\])?\\s*(?:\\[\\s*Soundtrack:\\s*([^\\]]+?)\\s*\\])?\\s*<\\/Info_panel>/gs`,
        template: `<style>
.simple-mission[data-mission=""] { display: none !important; }
.simple-score-change[data-change=""] { display: none !important; }
.simple-container {
  background: #ffffff;
  border-radius: 16px;
  padding: 12px;
  color: #2c3e50;
  box-shadow: 0 2px 20px rgba(81, 160, 222, 0.12);
  max-width: 100%;
  margin: 10px 0;
  border: 1px solid #e8f4fc;
  font-size: 1em;
}

.simple-header {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #51a0de;
  text-align: center;
}

.simple-title {
  font-weight: 700;
  color: #51a0de;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.simple-card {
  background: #f8fcff;
  border-radius: 12px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e1f0fa;
  margin-bottom: 6px;
  transition: all 0.2s ease;
}

.simple-card:hover {
  border-color: #51a0de;
  box-shadow: 0 2px 8px rgba(81, 160, 222, 0.15);
}

.simple-icon {
  width: 32px;
  height: 32px;
  border: 1px solid #e1f0fa;
  background: #ffffff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.simple-flex-row { 
  display: flex;
  gap: 6px; 
  margin-bottom: 8px; 
}

.simple-text-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.simple-value {
  color: #2c3e50;
  line-height: 1.3;
}

.simple-mission-card {
  background: #e8f4fc;
  border: 1px solid #51a0de;
  padding: 10px;
}

.simple-mission-label {
  color: #51a0de;
  font-weight: 600;
}

.simple-mission-text {
  color: #2c3e50;
}

.simple-love-card {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 12px;
}

.simple-love-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.simple-love-label {
  color: #FF6B6B;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.simple-love-percent {
  color: #2c3e50;
  padding: 0 4px;
}

.simple-progress-bg {
  background: #f0f0f0;
  border-radius: 10px;
  height: 12px;
  flex: 1;
  overflow: hidden;
}

.simple-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B6B, #FF8787);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.simple-score-change {
  display: inline-block;
  background: #e8f4fc;
  color: #51a0de;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid #b8dcf7;
  font-size: 11px;
}

.simple-divider {
  height: 1px;
  background: #e1f0fa;
  margin: 2px 0;
}

.simple-thought-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.simple-thought-icon {
  color: #51a0de;
  margin-top: 2px;
}

.simple-thought {
  color: #34495e;
  line-height: 1.6;
  flex: 1;
}

.simple-soundtrack-card {
  padding: 3px 10px;
  color: #51a0de;
  font-size: 0.9em;
}

.simple-soundtrack-text {
  color: #34495e;
}

.simple-card-1 { flex: 1; }
.simple-card-1-1 { flex: 1.1; }
.simple-card-1-3 { flex: 1.3; }
</style>

<div class='simple-container'>
  <div class='simple-header'>
    <div class='simple-title'>✨ &lt;{{CHAR}}&gt; STATUS INFO</div>
  </div>

  <div class='simple-flex-row'>
    <div class='simple-card simple-card-1'>
      <div class='simple-icon'>📅</div>
      <div class='simple-text-group'>
        <span class='simple-value'>$1</span>
      </div>
    </div>
    <div class='simple-card simple-card-1'>
      <div class='simple-icon'>🕒</div>
      <div class='simple-text-group'>
        <span class='simple-value'>$2</span>
      </div>
    </div>
    <div class='simple-card simple-card-1-1'>
      <div class='simple-icon'>🌏</div>
      <div class='simple-text-group'>
        <span class='simple-value'>$3</span>
      </div>
    </div>
    <div class='simple-card simple-card-1'>
      <div class='simple-icon'>🧤</div>
      <div class='simple-text-group'>
        <span class='simple-value'>$4</span>
      </div>
    </div>
    <div class='simple-card simple-card-1-3'>
      <div class='simple-icon'>$5</div>
      <div class='simple-text-group'>
        <span class='simple-value'>$6</span>
      </div>
    </div>
  </div>

  <div class='simple-mission' data-mission='$7'>
    <div class='simple-card simple-mission-card'>
      <span class='simple-mission-label'>🎯 MISSION</span>
      <span class='simple-mission-text'>$7</span>
    </div>
  </div>

  <div class='simple-card simple-love-card'>
    <div class='simple-love-row'>
      <div class='simple-love-label'>
        ♥ <span class='simple-love-percent'>$8%</span>
      </div>
      <div class='simple-progress-bg'>
        <div class='simple-progress-fill' style='width: $8%;'></div>
      </div>
    </div>

    <div class='simple-score-change' data-change='$10'>
      🔔 $10
    </div>

    <div class='simple-divider'></div>

    <div class='simple-thought-row'>
      <div class='simple-thought-icon'>💬</div>
      <div class='simple-thought'>$9</div>
    </div>
  </div>

  <div class='simple-soundtrack-card'>
    🎵 SOUNDTRACK: <span class='simple-soundtrack-text'>$11</span>
  </div>
</div>`},
{
        name: "📱COD",
        input: `<Info_panel>\n[08.16 (2일차) | 07:15 | 세라피나의 숲속 오두막]\n[검은 선드레스 | 😊 평온함, 보살피는 기분]\n[Mission: 미션이 있다면 이런모습]\n[Love Score: 50] They look much better this morning. The color is returning to their cheeks. (오늘 아침은 훨씬 좋아 보이네. 뺨에 혈색이 돌아오고 있어.)\n[Score Change: +5 호감도가 이런이유로 오름]\n[Soundtrack: (노래추천)]\n</Info_panel>`,
        regex: `/<Info_panel>\\s*(?:___|[-*]{3,})?\\s*\\[\\s*(?:DAY\\s*)?([^|\\\]]+?)\\s*\\|\\s*([^|\\\]]+?)\\s*\\|\\s*([^\\]]+?)\\s*\\]\\s*\\[\\s*([^|\\\]]+?)\\s*\\|\\s*(?:([^|\\\]\\s]+)\\s+)?([^\\]]+?)\\s*\\]\\s*(?:\\[\\s*(?:Mission:\\s*)?([^\\]]+?)\\s*\\])?\\s*\\[\\s*(?:Love Score:\\s*)?([^\\]]+?)\\s*\\]\\s*([^\\\[]*?)(?:\\[\\s*(?:Score\\s*Change:\\s*)?([^\\]]+?)\\s*\\])?\\s*(?:\\[\\s*Soundtrack:\\s*([^\\]]+?)\\s*\\])?\\s*<\\/Info_panel>/gs`,
        template: `<style>
.cod-container {
--cod-bg: #0e1116;
--cod-border: rgba(84, 193, 255, 0.3);
--cod-accent: #54c1ff;
--cod-alert: #ff4b4b;
--cod-gold: #e2b714;
--cod-text: #d1d5db;
--cod-text-dim: #6e7681;
background: var(--cod-bg);
background-image:
linear-gradient(45deg, #080a0d 25%, transparent 25%, transparent 75%, #080a0d 75%, #080a0d),
linear-gradient(45deg, #080a0d 25%, transparent 25%, transparent 75%, #080a0d 75%, #080a0d);
background-size: 20px 20px;
background-position: 0 0, 10px 10px;
border: 1px solid var(--cod-border);
color: var(--cod-text);
padding: 8px 10px;
max-width: 100%;
display: flex;
flex-direction: column; 
gap: 6px;
position: relative;
}
.cod-right-col {
display: flex;
flex-direction: column;
gap: 4px;
min-width: 0;
}
.cod-header-mini {
display: flex;
justify-content: space-between;
align-items: center;
background: rgba(84, 193, 255, 0.08);
padding: 4px 8px;
border: 1px solid rgba(255,255,255,0.05);
}
.cod-header-title {
font-weight: 700;
color: var(--cod-accent);
letter-spacing: 1px;
font-size: 0.9em;
}
.cod-data-list {
display: flex;
flex-direction: column;
gap: 2px;
background: rgba(0,0,0,0.2);
padding: 4px 6px;
}
.cod-row {
display: flex;
justify-content: space-between;
align-items: center;
padding: 3px 0;
border-bottom: 1px solid rgba(255,255,255,0.05);
font-size: 0.8em;
}
.cod-row:last-child {
border-bottom: none;
}
.cod-row-label { color: var(--cod-text-dim); }
.cod-row-val { color: #fff; text-align: right; }
.cod-info-box {
background: rgba(255,255,255,0.02);
border: 1px solid rgba(255,255,255,0.05);
padding: 6px;
margin-top: 2px;
}
.cod-box-head {
color: var(--cod-accent);
font-size: 0.75em;
font-weight: 700;
margin-bottom: 2px;
text-transform: uppercase;
display: flex;
justify-content: space-between;
}
.cod-box-body {
font-size: 0.85em;
line-height: 1.4;
color: #ddd;
white-space: pre-wrap;
}
.cod-hp-bar-bg {
height: 4px;
background: #333;
width: 100%;
margin-top: 2px;
box-sizing: border-box;
overflow: hidden;
}
.cod-hp-bar-fill {
height: 100%;
background: var(--cod-alert);
width: 0%;
max-width: 100%;
}
.cod-hide[data-check=''],
.cod-hide[data-check='undefined'],
.cod-hide[data-check='0'] {
display: none !important;
}
</style>
<div class='cod-container'>
<div class='cod-right-col'>
<div class='cod-header-mini'>
<span class='cod-header-title'>OPERATOR STATUS</span>
<span style='font-size:0.7em; color:var(--cod-text-dim); text-transform:uppercase;'>
{{CHAR}}
</span>
</div>
<div class='cod-data-list'>
<div class='cod-row'>
<span class='cod-row-label'>DATE</span>
<span class='cod-row-val'>$1</span>
</div>
<div class='cod-row'>
<span class='cod-row-label'>TIME</span>
<span class='cod-row-val'>$2</span>
</div>
<div class='cod-row'>
<span class='cod-row-label'>LOC</span>
<span class='cod-row-val'>$3</span>
</div>
<div class='cod-row'>
<span class='cod-row-label'>GEAR</span>
<span class='cod-row-val'>$4</span>
</div>
<div class='cod-row cod-hide' data-check='$5'>
<span class='cod-row-label'>STATE</span>
<span class='cod-row-val'>$5$6</span>
</div>
</div>
<div class='cod-info-box cod-hide' data-check='$7'>
<div class='cod-box-head'>🎯 OBJECTIVE</div>
<div class='cod-box-body'>$7</div>
</div>
<div class='cod-info-box'>
<div class='cod-box-head'>
<span>💖 RELATION</span>
<span style='color:#fff;'>$8%</span>
</div>
<div class='cod-hp-bar-bg'>
<div class='cod-hp-bar-fill' style='width: $8%;'></div>
</div>
<div class='cod-hide' data-check='$10'
style='font-size:0.7em; color:var(--cod-alert); margin-top:2px;'>
⚠ UPDATE: $10
</div>
</div>
<div class='cod-info-box' style='flex: 1;'>
<div class='cod-box-head' style='color:#fff;'>💬 LOG</div>
<div class='cod-box-body'>$9</div>
</div>
<div style='font-size:0.7em; color:var(--cod-text-dim); text-align:right; padding-right:4px;'>
🎵 $11
</div>
</div>
</div>`
    },
{
        name: "JARVIS",
        input: `<Info_panel>\n[08.16 (2일차) | 07:15 | 세라피나의 숲속 오두막]\n[검은 선드레스 | 😊 평온함, 보살피는 기분]\n[Mission: 미션이 있다면 이런모습]\n[Love Score: 50] They look much better this morning. The color is returning to their cheeks. (오늘 아침은 훨씬 좋아 보이네. 뺨에 혈색이 돌아오고 있어.)\n[Score Change: +5 호감도가 이런이유로 오름]\n[Soundtrack: (노래추천)]\n</Info_panel>`,
        regex: `/<Info_panel>\\s*(?:___|[-*]{3,})?\\s*\\[\\s*(?:DAY\\s*)?([^|\\\]]+?)\\s*\\|\\s*([^|\\\]]+?)\\s*\\|\\s*([^\\]]+?)\\s*\\]\\s*\\[\\s*([^|\\\]]+?)\\s*\\|\\s*(?:([^|\\\]\\s]+)\\s+)?([^\\]]+?)\\s*\\]\\s*(?:\\[\\s*(?:Mission:\\s*)?([^\\]]+?)\\s*\\])?\\s*\\[\\s*(?:Love Score:\\s*)?([^\\]]+?)\\s*\\]\\s*([^\\\[]*?)(?:\\[\\s*(?:Score\\s*Change:\\s*)?([^\\]]+?)\\s*\\])?\\s*(?:\\[\\s*Soundtrack:\\s*([^\\]]+?)\\s*\\])?\\s*<\\/Info_panel>/gs`,
        template: `<style>
.score-change-hud[data-change=""] { display: none !important; }
.hud-value-mobile[data-change=""] { display: none !important; }
.panel-decor[data-mission=""] { display: none !important; }
.stream-line[data-mission=""] { display: none !important; }
.active-line[data-mission=""] { display: none !important; }
.jarvis-wrapper {
position: relative;
background-color: #020b14;
color: #00f3ff;
overflow: hidden;
padding: 20px;
border: 1px solid rgba(0, 243, 255, 0.3);
box-shadow: 0 0 50px rgba(0,0,0,0.8) inset;
min-height: 400px;
font-size: var(--messageTextFontSize) !important;
}
.bg-hud-layer {
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
width: 100%;
height: 100%;
pointer-events: none;
z-index: 0;
opacity: 0.25;
display: flex;
justify-content: center;
align-items: center;
}
.hud-circle {
position: absolute;
border-radius: 50%;
border: 1px solid #00f3ff;
box-shadow: 0 0 15px rgba(0, 243, 255, 0.3);
}
.hud-c1 {
width: 400px; height: 400px;
border-width: 2px;
border-left-color: transparent;
border-right-color: transparent;
animation: spin 20s linear infinite;
}
.hud-c2 {
width: 300px; height: 300px;
border-width: 1px;
border-style: dashed;
animation: spin 30s linear infinite reverse;
}
.hud-c3 {
width: 500px; height: 500px;
border: 5px solid transparent;
border-top: 5px solid rgba(0, 243, 255, 0.3);
border-bottom: 5px solid rgba(0, 243, 255, 0.3);
animation: spin 15s ease-in-out infinite;
}
.hud-crosshair {
position: absolute;
width: 100%; height: 1px;
background: linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.3), transparent);
}
.hud-crosshair-v {
position: absolute;
width: 1px; height: 100%;
background: linear-gradient(180deg, transparent, rgba(0, 243, 255, 0.2), transparent);
left: 50%;
}
.bg-scanlines {
position: absolute;
top: 0; left: 0;
width: 100%; height: 100%;
background: repeating-linear-gradient(
0deg,
transparent,
transparent 2px,
rgba(0, 243, 255, 0.03) 2px,
rgba(0, 243, 255, 0.03) 4px
);
pointer-events: none;
z-index: 1;
}
.bg-grid {
position: absolute;
top: 0; left: 0;
width: 100%; height: 100%;
background-image:
linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px),
linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px);
background-size: 50px 50px;
pointer-events: none;
z-index: 0;
}
.bg-corner-frame {
position: absolute;
width: 80px;
height: 80px;
border: 2px solid rgba(0, 243, 255, 0.2);
pointer-events: none;
z-index: 1;
}
.bg-corner-tl {
top: 10px;
left: 10px;
border-right: none;
border-bottom: none;
}
.bg-corner-tr {
top: 10px;
right: 10px;
border-left: none;
border-bottom: none;
}
.bg-corner-bl {
bottom: 10px;
left: 10px;
border-right: none;
border-top: none;
}
.bg-corner-br {
bottom: 10px;
right: 10px;
border-left: none;
border-top: none;
}
.bg-radar-line {
position: absolute;
width: 200px;
height: 2px;
background: linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.4), transparent);
top: 30%;
left: 5%;
transform-origin: left center;
animation: radar-sweep 8s linear infinite;
z-index: 1;
}
@keyframes radar-sweep {
0% { transform: rotate(0deg); opacity: 0; }
10% { opacity: 0.6; }
90% { opacity: 0.6; }
100% { transform: rotate(360deg); opacity: 0; }
}
.bg-hex-pattern {
position: absolute;
top: 20%;
right: 10%;
display: grid;
grid-template-columns: repeat(3, 20px);
gap: 8px;
opacity: 0.15;
z-index: 1;
}
.bg-hex-pattern-item {
width: 20px;
height: 24px;
background: transparent;
border: 1px solid #00f3ff;
clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
animation: hex-pulse 3s ease-in-out infinite;
}
.bg-hex-pattern-item:nth-child(2) { animation-delay: 0.2s; }
.bg-hex-pattern-item:nth-child(3) { animation-delay: 0.4s; }
.bg-hex-pattern-item:nth-child(4) { animation-delay: 0.6s; }
.bg-hex-pattern-item:nth-child(5) { animation-delay: 0.8s; }
.bg-hex-pattern-item:nth-child(6) { animation-delay: 1s; }
@keyframes hex-pulse {
0%, 100% { opacity: 0.3; }
50% { opacity: 1; }
}
.bg-text-stream {
position: absolute;
font-size: 0.7em;
color: rgba(0, 243, 255, 0.2);
font-family: 'Courier New', monospace;
white-space: nowrap;
z-index: 1;
}
.bg-text-stream-1 {
top: 15%;
left: 8%;
animation: stream-scroll-1 15s linear infinite;
}
.bg-text-stream-2 {
bottom: 20%;
right: 8%;
animation: stream-scroll-2 12s linear infinite reverse;
}
@keyframes stream-scroll-1 {
0% { opacity: 0; transform: translateX(-20px); }
10% { opacity: 0.4; }
90% { opacity: 0.4; }
100% { opacity: 0; transform: translateX(20px); }
}
@keyframes stream-scroll-2 {
0% { opacity: 0; transform: translateX(20px); }
10% { opacity: 0.4; }
90% { opacity: 0.4; }
100% { opacity: 0; transform: translateX(-20px); }
}
.bg-target-box {
position: absolute;
width: 60px;
height: 60px;
border: 1px solid rgba(0, 243, 255, 0.2);
z-index: 1;
animation: target-scan 4s ease-in-out infinite;
}
.bg-target-box::before,
.bg-target-box::after {
content: '';
position: absolute;
background: rgba(0, 243, 255, 0.3);
}
.bg-target-box::before {
width: 20px;
height: 1px;
top: 50%;
left: -25px;
}
.bg-target-box::after {
width: 1px;
height: 20px;
left: 50%;
top: -25px;
}
.bg-target-1 {
top: 25%;
right: 20%;
}
.bg-target-2 {
bottom: 30%;
left: 15%;
animation-delay: 2s;
}
@keyframes target-scan {
0%, 100% { opacity: 0.2; transform: scale(1); }
50% { opacity: 0.6; transform: scale(1.1); }
}
.bg-jarvis-text {
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
font-size: 4em;
font-weight: 700;
letter-spacing: 15px;
color: #00f3ff;
text-shadow: 0 0 30px rgba(0, 243, 255, 0.6);
opacity: 0.15;
z-index: 1;
animation: pulse-glow 3s ease-in-out infinite;
}
.bg-side-deco {
position: absolute;
z-index: 2;
opacity: 0.3;
pointer-events: none;
}
.bg-left-deco {
left: 20px;
top: 50%;
transform: translateY(-50%);
display: flex;
flex-direction: column;
gap: 30px;
}
.bg-right-deco {
right: 20px;
top: 50%;
transform: translateY(-50%);
display: flex;
flex-direction: column;
gap: 30px;
align-items: flex-end;
}
.bg-data-block {
display: flex;
flex-direction: column;
align-items: center;
gap: 8px;
}
.bg-bar-title {
font-size: 0.6em;
letter-spacing: 2px;
color: #00f3ff;
writing-mode: vertical-lr;
transform: rotate(180deg);
}
.bg-bar-graph {
display: flex;
gap: 2px;
height: 50px;
align-items: flex-end;
}
.bg-bar-graph span {
width: 3px;
background: #00f3ff;
opacity: 0.5;
box-shadow: 0 0 5px #00f3ff;
animation: bar-fluctuate 2s infinite;
}
.bg-circular-mini {
width: 40px;
height: 40px;
position: relative;
}
.bg-circular-mini svg {
width: 100%;
height: 100%;
fill: none;
stroke: #00f3ff;
stroke-width: 2;
animation: spin 5s linear infinite;
}
.bg-mini-label {
font-size: 0.5em;
color: #00f3ff;
text-align: center;
margin-top: 5px;
letter-spacing: 1px;
}
.bg-status-label {
font-size: 0.6em;
color: #00f3ff;
margin-bottom: 5px;
letter-spacing: 1px;
}
.bg-progress-bar {
height: 4px;
width: 60px;
background: rgba(0,0,0,0.5);
border: 1px solid rgba(0, 243, 255, 0.3);
margin-bottom: 15px;
}
.bg-progress-fill {
height: 100%;
background: #00f3ff;
box-shadow: 0 0 8px #00f3ff;
}
.bg-hex-grid {
display: flex;
gap: 2px;
margin-bottom: 15px;
}
.bg-hex {
width: 8px;
height: 10px;
background: rgba(0, 243, 255, 0.3);
clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
@keyframes pulse-glow {
0%, 100% {
opacity: 0.1;
text-shadow: 0 0 20px rgba(0, 243, 255, 0.6);
}
50% {
opacity: 0.2;
text-shadow: 0 0 40px rgba(0, 243, 255, 0.6);
}
}
@keyframes spin {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}
@keyframes bar-fluctuate {
0%, 100% { opacity: 0.3; }
50% { opacity: 0.7; }
}
.jarvis-interface {
position: relative;
z-index: 10;
display: flex;
flex-direction: column;
gap: 20px;
max-width: 900px;
margin: 0 auto;
}
.main-display {
display: flex;
flex-direction: column;
gap: 15px;
width: 100%;
}
.glass-panel {
background: rgba(0, 20, 40, 0.6);
border: 1px solid rgba(0, 243, 255, 0.3);
padding: 15px;
position: relative;
backdrop-filter: blur(2px);
box-shadow: 0 0 6px #00f3ff;
}
.panel-header {
display: flex;
justify-content: space-between;
border-bottom: 1px solid rgba(0, 243, 255, 0.3);
padding-bottom: 5px;
margin-bottom: 10px;
font-weight: bold;
letter-spacing: 2px;
}
.info-panel-text {
padding: 12px 15px;
}
.info-text-grid {
display: flex;
flex-direction: column;
}
.info-text-row {
display: flex;
justify-content: space-between;
align-items: center;
padding: 8px 0;
position: relative;
}
.info-text-row::before {
content: "";
position: absolute;
left: 0;
right: 0;
bottom: 0;
height: 1px;
background: linear-gradient(
90deg,
rgba(0, 243, 255, 0.0) 0%,
rgba(0, 243, 255, 0.25) 10%,
rgba(0, 243, 255, 0.25) 90%,
rgba(0, 243, 255, 0.0) 100%
);
pointer-events: none;
}
.info-text-row:last-child::before {
display: none;
}
.info-text-row:last-child {
border-bottom: none;
}
.info-row-date-time {
display: grid;
grid-template-columns: 1fr auto 1fr auto;
gap: 20px;
align-items: center;
}
.info-date-group,
.info-time-group,
.info-location-group,
.info-outfit-group {
display: contents;
}
.info-date-group,
.info-location-group, {
justify-content: flex-start;
}
.info-time-group,
.info-outfit-group {
justify-content: flex-end;
}
.info-label {
color: rgba(0, 243, 255, 0.3);
text-transform: uppercase;
letter-spacing: 1px;
font-weight: 600;
}
.info-value {
color: #fff;
text-align: right;
text-shadow: 0 0 5px rgba(0, 243, 255, 0.6);
flex: 1;
}
.log-stream {
line-height: 1.6;
}
.stream-line {
opacity: 0.7;
}
.active-line {
opacity: 1;
color: #fff;
text-shadow: 0 0 5px #00f3ff;
}
.cursor {
animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }
.affection-content-horizontal {
display: flex;
gap: 20px;
align-items: center;
}
.affection-column-layout {
display: flex;
flex-direction: column;
gap: 10px;
flex: 1;
}
.circular-hud-container {
flex-shrink: 0;
}
.wobbling-element {
position: relative;
display: inline-block;
will-change: transform;
filter: drop-shadow(0 0 8px #00f3ff);
}
.percentage-counter {
position: absolute;
transform: translate(-50%, -50%);
top: 50%;
left: 50%;
color: #00f3ff;
font-size: 1.2em;
font-weight: bold;
text-align: center;
text-shadow: 0 0 10px #00f3ff;
z-index: 10;
}
.outer_circle {
fill: transparent;
stroke: #00f3ff;
stroke-width: 2;
stroke-dasharray: 7 1;
stroke-dashoffset: 0;
}
.outer_circle_bars_l {
fill: transparent;
stroke: #00f3ff;
stroke-width: 7;
stroke-dasharray: 0.4 7.6;
stroke-dashoffset: 0.1;
}
.outer_circle_bars_r {
fill: transparent;
stroke: #00f3ff;
stroke-width: 7;
stroke-dasharray: 0.4 7.6;
stroke-dashoffset: 1.4;
}
.inner_progress_circle {
fill: transparent;
stroke: #00f3ff;
stroke-width: 7;
stroke-dasharray: 100 100;
transition: stroke-dashoffset 0.5s ease;
}
.inner_half_circle {
fill: transparent;
stroke: #00f3ff;
stroke-width: 7;
stroke-dasharray: 24.5 0.5;
stroke-dashoffset: 0;
}
.center_outer_circle {
fill: transparent;
stroke: rgba(0, 243, 255, 0.3);
stroke-width: 1;
stroke-dasharray: 0;
stroke-dashoffset: 0;
}
.center_inner_circle_second {
fill: transparent;
stroke: #00f3ff;
stroke-width: 2;
stroke-dasharray: 5 95;
stroke-dashoffset: 0;
animation: centerInnerCircleSecond 20s linear infinite;
animation-timing-function: steps(4, end);
}
.center_inner_circle_3 {
fill: transparent;
stroke: rgba(0, 243, 255, 0.3);
stroke-width: 2;
stroke-dasharray: 33 66;
stroke-dashoffset: -10;
}
.center_inner_circle_3_dashed_verticle {
fill: transparent;
stroke: rgba(0, 243, 255, 0.6);
stroke-width: 7;
stroke-dasharray: 0.2 7.8;
stroke-dashoffset: 0;
}
.center_inner_circle_3_dashed {
fill: transparent;
stroke: rgba(0, 243, 255, 0.3);
stroke-width: 1;
stroke-dasharray: 1 3.5;
stroke-dashoffset: 0;
}
.center_inner_circle_2 {
fill: transparent;
stroke: rgba(0, 243, 255, 0.3);
stroke-width: 1;
stroke-dasharray: 75 25;
stroke-dashoffset: 60;
}
.center_inner_circle_1 {
fill: transparent;
stroke: rgba(0, 243, 255, 0.3);
stroke-width: 1;
stroke-dasharray: 95 5;
stroke-dashoffset: 20;
}
.center_inner_circle_0 {
fill: transparent;
stroke: rgba(0, 243, 255, 0.3);
stroke-width: 7;
stroke-dasharray: 0.3 0.7;
stroke-dashoffset: 0;
animation: centerInnerCircle0 40s linear infinite;
}
.small_rectangles {
fill: rgba(0, 243, 255, 0.6);
}
@keyframes centerInnerCircleSecond {
0% { transform: rotate(0deg); }
25% { transform: rotate(90deg); }
50% { transform: rotate(180deg); }
75% { transform: rotate(270deg); }
100% { transform: rotate(360deg); }
}
@keyframes centerInnerCircle0 {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}
.score-change-hud {
margin-bottom: 10px;
}
.hud-menu-row {
display: flex;
align-items: center;
gap: 5px;
height: 40px;
}
.root-line-svg path {
filter: drop-shadow(0 0 3px #00f3ff);
}
.root-line-svg circle {
filter: drop-shadow(0 0 5px #00f3ff);
}
.hud-value {
color: #00f3ff;
font-size: 0.8em;
font-weight: bold;
text-shadow: 0 0 8px #00f3ff;
white-space: nowrap;
}
.hud-value-mobile {
display: none;
padding: 8px 12px;
background: rgba(0, 243, 255, 0.1);
border-left: 3px solid #00f3ff;
border-radius: 2px;
color: #00f3ff;
font-weight: bold;
text-shadow: 0 0 8px #00f3ff;
}
.analysis-section {
flex: 1;
display: flex;
flex-direction: column;
gap: 10px;
}
.thought-box-compact {
padding: 10px;
background: rgba(0, 243, 255, 0.05);
border-left: 2px solid #00f3ff;
flex: 1;
}
.thought-label {
margin-bottom: 8px;
opacity: 0.8;
font-weight: bold;
}
.thought-text {
line-height: 1.6;
color: #fff;
}
.corner-bracket {
position: absolute;
width: 10px; height: 10px;
border: 2px solid #00f3ff;
}
.br-tl { top: -1px; left: -1px; border-bottom: none; border-right: none; }
.br-tr { top: -1px; right: -1px; border-bottom: none; border-left: none; }
.br-bl { bottom: -1px; left: -1px; border-top: none; border-right: none; }
.br-br { bottom: -1px; right: -1px; border-top: none; border-left: none; }
.scroll-text {
font-size: 0.8em;
opacity: 0.7;
}
@media (max-width: 768px) {
.jarvis-wrapper { padding: 15px; }
.bg-side-deco { display: none; }
.info-panel-text { padding: 10px; }
.affection-content-horizontal { flex-direction: column; align-items: stretch; gap: 0; }
.circular-hud-container { display: flex; justify-content: center; }
.affection-column-layout { width: 100%; }
.hud-menu-row { display: none; }
.hud-value-mobile { display: block; }
.bg-jarvis-text {
font-size: 2.5em;
}
.info-text-grid {
display: flex !important;
flex-direction: column !important;
gap: 6px !important;
}
.info-text-row {
border-bottom: none;
padding: 0;
}
.info-text-row.info-row-date-time:first-child {
display: flex !important;
flex-direction: column !important;
gap: 4px !important;
}
.info-text-row.info-row-date-time:first-child .info-date-group,
.info-text-row.info-row-date-time:first-child .info-time-group {
display: flex !important;
justify-content: space-between !important;
width: 100% !important;
border-bottom: 1px solid rgba(0, 243, 255, 0.15);
padding: 4px 0;
}
.info-text-row.info-row-date-time:nth-child(2) {
display: flex;
flex-direction: column;
gap: 4px;
}
.info-text-row.info-row-date-time:nth-child(2) .info-location-group,
.info-text-row.info-row-date-time:nth-child(2) .info-outfit-group {
display: inline-flex;
justify-content: space-between;
width: 100% !important;
border-bottom: 1px solid rgba(0, 243, 255, 0.15);
padding: 4px 0;
}
.info-label {
font-size: 0.8em;
text-align: left;
}
.info-value {
text-align: right;
}
}
</style>
<div class='jarvis-wrapper'>
<div class='bg-grid'></div>
<div class='bg-scanlines'></div>
<div class='bg-hud-layer'>
<div class='hud-circle hud-c1'></div>
<div class='hud-circle hud-c2'></div>
<div class='hud-circle hud-c3'></div>
<div class='hud-crosshair'></div>
<div class='hud-crosshair-v'></div>
<div class='bg-jarvis-text'>J.A.R.V.I.S.</div>
</div>
<div class='bg-corner-frame bg-corner-tl'></div>
<div class='bg-corner-frame bg-corner-tr'></div>
<div class='bg-corner-frame bg-corner-bl'></div>
<div class='bg-corner-frame bg-corner-br'></div>
<div class='bg-radar-line'></div>
<div class='bg-hex-pattern'>
<div class='bg-hex-pattern-item'></div>
<div class='bg-hex-pattern-item'></div>
<div class='bg-hex-pattern-item'></div>
<div class='bg-hex-pattern-item'></div>
<div class='bg-hex-pattern-item'></div>
<div class='bg-hex-pattern-item'></div>
</div>
<div class='bg-target-box bg-target-1'></div>
<div class='bg-target-box bg-target-2'></div>
<div class='bg-text-stream bg-text-stream-1'>>>> SYSTEM.PROTOCOL.EXECUTING...</div>
<div class='bg-text-stream bg-text-stream-2'>NEURAL.LINK.ESTABLISHED // 0x7F3A9B...</div>
<div class='bg-side-deco bg-left-deco'>
<div class='bg-data-block'>
<div class='bg-bar-title'>MAG</div>
<div class='bg-bar-graph'>
<span style='height: 60%'></span>
<span style='height: 80%'></span>
<span style='height: 40%'></span>
<span style='height: 90%'></span>
<span style='height: 20%'></span>
</div>
</div>
<div class='bg-data-block'>
<div class='bg-circular-mini'>
<svg viewBox='0 0 100 100'>
<circle cx='50' cy='50' r='45' stroke-dasharray='200' stroke-dashoffset='40' />
</svg>
</div>
<div class='bg-mini-label'>DATA</div>
</div>
</div>
<div class='bg-side-deco bg-right-deco'>
<div class='bg-data-block'>
<div class='bg-status-label'>POWER</div>
<div class='bg-progress-bar'>
<div class='bg-progress-fill' style='width: 88%'></div>
</div>
</div>
<div class='bg-data-block'>
<div class='bg-status-label'>ARMOR</div>
<div class='bg-hex-grid'>
<div class='bg-hex'></div>
<div class='bg-hex'></div>
<div class='bg-hex'></div>
</div>
</div>
</div>
<div class='jarvis-interface'>
<div class='main-display'>
<div class='glass-panel info-panel-text'>
<div class='info-text-grid'>
<div class='info-text-row info-row-date-time'>
<div class='info-date-group'>
<span class='info-label'>Date</span>
<span class='info-value'>$1</span>
</div>
<div class='info-time-group'>
<span class='info-label'>Time</span>
<span class='info-value'>$2</span>
</div>
</div>
<div class='info-text-row info-row-date-time'>
<div class='info-location-group'>
<span class='info-label'>Location</span>
<span class='info-value'>$3</span>
</div>
<div class='info-outfit-group'>
<span class='info-label'>Outfit</span>
<span class='info-value'>$4</span>
</div>
</div>
</div>
<div class='corner-bracket br-tl'></div>
<div class='corner-bracket br-tr'></div>
<div class='corner-bracket br-bl'></div>
<div class='corner-bracket br-br'></div>
</div>
<div class='glass-panel'>
<div class='panel-header'>
ACTIVE LOG
<div class='panel-decor' data-mission='$7'>// MISSION</div>
</div>
<div class='log-stream'>
<div class='stream-line'>> EMOTIONAL SYSTEM...CONNECTING...</div>
<div class='stream-line active-line'>> $5 $6<span class='cursor'>_</span></div>
<div class='stream-line' data-mission='$7'>> PRIMARY OBJECTIVE...</div>
<div class='stream-line active-line' data-mission='$7'>> $7<span class='cursor'>_</span></div>
</div>
<div class='corner-bracket br-tl'></div>
<div class='corner-bracket br-tr'></div>
<div class='corner-bracket br-bl'></div>
<div class='corner-bracket br-br'></div>
</div>
<div class='glass-panel affection-panel'>
<div class='affection-content-horizontal'>
<div class='circular-hud-container'>
<div class='wobbling-element'>
<div class='percentage-counter'>$8%</div>
<svg width='120' height='120' viewBox='-100 -100 200 200'>
<circle class='outer_circle' cx='0' cy='0' r='99' pathLength='100' />
<circle class='outer_circle_bars_l' cx='0' cy='0' r='96' pathLength='64' />
<circle class='outer_circle_bars_r' cx='0' cy='0' r='96' pathLength='64' />
<circle class='inner_progress_circle' cx='0' cy='0' r='96' pathLength='100' transform='rotate(-90 0 0)' style='stroke-dashoffset: calc(100 - $8);' />
<circle class='inner_half_circle' cx='0' cy='0' r='80' pathLength='50' />
<circle class='center_outer_circle' cx='0' cy='0' r='73' pathLength='50' />
<circle class='center_inner_circle_second' cx='0' cy='0' r='67' pathLength='100' />
<circle class='center_inner_circle_3' cx='0' cy='0' r='65' pathLength='100' />
<circle class='center_inner_circle_3_dashed_verticle' cx='0' cy='0' r='61' pathLength='64' />
<circle class='center_inner_circle_3_dashed' cx='0' cy='0' r='61' pathLength='100' />
<circle class='center_inner_circle_2' cx='0' cy='0' r='58' pathLength='100' />
<circle class='center_inner_circle_1' cx='0' cy='0' r='55' pathLength='100' />
<circle class='center_inner_circle_0' cx='0' cy='0' r='35' pathLength='40' />
<rect class='small_rectangles' x='-1.5' y='-68' width='4' height='4' rx='1' />
<rect class='small_rectangles' x='-2.5' y='64' width='4' height='4' rx='1' />
<rect class='small_rectangles' x='-68' y='-2.5' width='4' height='4' rx='1' />
<rect class='small_rectangles' x='64' y='-1.5' width='4' height='4' rx='1' />
<rect class='small_rectangles' x='-48' y='-49' width='4' height='4' rx='1' />
<rect class='small_rectangles' x='45' y='-48' width='4' height='4' rx='1' />
<rect class='small_rectangles' x='45' y='46' width='4' height='4' rx='1' />
<rect class='small_rectangles' x='-49' y='44' width='4' height='4' rx='1' />
</svg>
</div>
</div>
<div class='affection-column-layout'>
<div class='analysis-section'>
<div class='score-change-hud' data-change='$10'>
<div class='hud-menu-row'>
<svg class='root-line-svg' width='85' height='30' viewBox='0 0 85 30'>
<path d='M 0 30 L 15 30 L 25 15 L 80 15' fill='none' stroke='#00f3ff' stroke-width='2' />
<circle cx='80' cy='15' r='3' fill='#00f3ff' />
</svg>
<div class='hud-value'>$10</div>
</div>
</div>
<div class='hud-value-mobile' data-change='$10'>
▲ $10
</div>
<div class='thought-box-compact'>
<div class='thought-label'>💬 INTERNAL ANALYSIS</div>
<div class='thought-text'>$9</div>
</div>
<div class='scroll-text'>/// SOUNDTRACK: $11</div>
</div>
</div>
</div>
<div class='corner-bracket br-tl'></div>
<div class='corner-bracket br-tr'></div>
<div class='corner-bracket br-bl'></div>
<div class='corner-bracket br-br'></div>
</div>
</div>
</div>
</div>

`},
{
        name: "DP",
        input: `<Info_panel>\n[08.16 (2일차) | 07:15 | 세라피나의 숲속 오두막]\n[검은 선드레스 | 😊 평온함, 보살피는 기분]\n[Mission: 미션이 있다면 이런모습]\n[Love Score: 50] They look much better this morning. The color is returning to their cheeks. (오늘 아침은 훨씬 좋아 보이네. 뺨에 혈색이 돌아오고 있어.)\n[Score Change: +5 호감도가 이런이유로 오름]\n[Soundtrack: (노래추천)]\n</Info_panel>`,
        regex: `/<Info_panel>\\s*(?:___|[-*]{3,})?\\s*\\[\\s*(?:DAY\\s*)?([^|\\\]]+?)\\s*\\|\\s*([^|\\\]]+?)\\s*\\|\\s*([^\\]]+?)\\s*\\]\\s*\\[\\s*([^|\\\]]+?)\\s*\\|\\s*(?:([^|\\\]\\s]+)\\s+)?([^\\]]+?)\\s*\\]\\s*(?:\\[\\s*(?:Mission:\\s*)?([^\\]]+?)\\s*\\])?\\s*\\[\\s*(?:Love Score:\\s*)?([^\\]]+?)\\s*\\]\\s*([^\\\[]*?)(?:\\[\\s*(?:Score\\s*Change:\\s*)?([^\\]]+?)\\s*\\])?\\s*(?:\\[\\s*Soundtrack:\\s*([^\\]]+?)\\s*\\])?\\s*<\\/Info_panel>/gs`,
        template: `<style>
.dp-mission[data-mission=""] { display: none !important; }
.dp-score-change[data-change=""]  { display: none !important; }
.dp-container {
background: #1a1a1a;
background-image: radial-gradient(#330000 15%, transparent 16%), radial-gradient(#330000 15%, transparent 16%);
background-size: 20px 20px;
background-position: 0 0, 10px 10px;
border: 3px solid #222;
border-radius: 4px;
padding: 15px;
color: #eee;
box-shadow: 5px 5px 0px #8B0000;
max-width: 100%;
margin: 15px 0;
position: relative;
overflow: visible;
font-size: var(--messageTextFontSize) !important;
}
.dp-bullet-svg {
position: absolute;
width: 45px;
height: 45px;
z-index: 10;
pointer-events: none;
filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.5));
}
.dp-header {
background: #c41e3a;
color: #fff;
padding: 8px;
text-align: center;
font-weight: 900;
font-size: 1.4em;
text-transform: uppercase;
box-shadow: 3px 3px 0 #000;
margin-bottom: 15px;
border: 2px solid #000;
letter-spacing: 1px;
}
.dp-mask-icon {
display: inline-block;
background: #000;
color: #fff;
padding: 2px 6px;
border-radius: 50%;
vertical-align: middle;
}
.dp-grid {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 8px;
margin-bottom: 10px;
}
.dp-info-box {
background: #2a2a2a;
border-left: 4px solid #c41e3a;
padding: 6px 10px;
display: flex;
align-items: center;
gap: 8px;
}
.dp-mission {
background: #c41e3a;
color: #fff;
padding: 10px;
margin: 10px 0;
font-weight: bold;
border: 2px solid #000;
box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
position: relative;
}
.dp-mission::before {
content: '🔪 TARGET';
display: inline-block;
background: #000;
color: #fff;
width: fit-content;
padding: 2px 12px 2px 6px;
margin-right: 6px;
}
.dp-love-container {
background: #0d0d0d;
padding: 15px 12px;
border: 1px solid #444;
border-radius: 6px;
margin-bottom: 10px;
position: relative;
z-index: 3;
}
.dp-love-header {
display: flex;
justify-content: space-between;
align-items: center;
flex-wrap: wrap;
}
.dp-unicorn-label {
color: #ff69b4;
font-weight: bold;
font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif;
font-style: italic;
letter-spacing: -0.5px;
}
.dp-score-change {
text-align: right;
margin-top: 5px;
font-size: 0.85em;
color: #ff69b4;
}
.dp-slider-wrapper {
position: relative;
height: 30px;
display: flex;
align-items: center;
}
.dp-slider-track {
position: absolute;
top: 50%;
left: 0;
right: 0;
height: 4px;
background: #333;
border-radius: 2px;
transform: translateY(-50%);
border: 1px solid #555;
}
.dp-slider-fill {
position: absolute;
top: 50%;
height: 4px;
background: repeating-linear-gradient(45deg, #c41e3a, #c41e3a 10px, #ff69b4 10px, #ff69b4 20px);
transform: translateY(-50%);
}
.dp-slider-thumb {
position: absolute;
top: 50%;
transform: translate(-50%, -50%);
font-size: 24px;
line-height: 1;
filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
transition: left 0.5s ease;
z-index: 2;
}
.dp-thought-box {
background: #fff4a8;
border: 2px solid #000;
padding: 12px;
color: #000;
font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif;
line-height: 1.4;
position: relative;
margin-top: 10px;
box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
font-weight: 500;
}
.dp-thought-box::before {
content: '$5 $6';
position: absolute;
top: -10px;
left: 10px;
background: #000;
color: #fff;
font-size: 0.8em;
padding: 1px 4px;
border: 1px solid #fff4a8;
}
.dp-soundtrack {
margin-top: 12px;
border-top: 1px dashed #444;
padding-top: 8px;
font-size: 0.85em;
color: #888;
display: flex;
align-items: center;
gap: 6px;
z-index: 3;
position: relative;
}
.dp-soundtrack-title {
color: #c41e3a;
font-weight: bold;
}
</style>
<div class='dp-container'>
<svg class='dp-bullet-svg' style='top: -5px; right: 5px; transform: rotate(-30deg);' viewBox='0 0 100 100'>
<g stroke='#000' stroke-width='3' fill='none' stroke-linecap='round'>
<line x1='90' y1='50' x2='80' y2='50' />
</g>
<path d='M50 25 L60 40 L80 35 L70 50 L85 65 L65 65 L55 85 L45 65 L25 70 L35 50 L15 35 L40 40 Z' fill='#fff' stroke='#000' stroke-width='3' stroke-linejoin='round'/>
<circle cx='50' cy='50' r='12' fill='#000'/>
</svg>
<svg class='dp-bullet-svg' style='bottom: 15px; left: -5px; transform: rotate(25deg);' viewBox='0 0 100 100'>
<g stroke='#000' stroke-width='3' fill='none' stroke-linecap='round'>
<line x1='10' y1='50' x2='20' y2='50' />
</g>
<path d='M35 30 L40 40 L55 35 L45 50 L50 60 L35 55 L30 70 L25 55 L10 50 L25 45 L20 30 Z' fill='#fff' stroke='#000' stroke-width='2.5' stroke-linejoin='round'/>
<circle cx='32' cy='50' r='8' fill='#000'/>
</svg>
<svg class='dp-bullet-svg' style='top: 70px; right: -5px; transform: rotate(-15deg);' viewBox='0 0 100 100'>
<path d='M65 40 L70 50 L85 45 L75 60 L80 70 L65 65 L60 80 L55 65 L40 60 L55 55 L50 40 Z' fill='#fff' stroke='#000' stroke-width='2.5' stroke-linejoin='round'/>
<circle cx='65' cy='60' r='8' fill='#000'/>
</svg>
<svg class='dp-bullet-svg' style='bottom: -15px; right: 20px; transform: rotate(-90deg);' viewBox='0 0 100 100'>
<path d='M65 40 L70 50 L85 45 L75 60 L80 70 L65 65 L60 80 L55 65 L40 60 L55 55 L50 40 Z' fill='#fff' stroke='#000' stroke-width='2.5' stroke-linejoin='round'/>
<circle cx='65' cy='60' r='8' fill='#000'/>
</svg>
<svg class='dp-bullet-svg' style='top: 185px; right: 25px; transform: rotate(40deg);' viewBox='0 0 100 100'>
<g stroke='#000' stroke-width='3' fill='none' stroke-linecap='round'>
<line x1='10' y1='50' x2='20' y2='50' />
<line x1='50' y1='10' x2='50' y2='20' />
</g>
<path d='M50 25 L60 40 L80 35 L70 50 L85 65 L65 65 L55 85 L45 65 L25 70 L35 50 L15 35 L40 40 Z' fill='#fff' stroke='#000' stroke-width='3' stroke-linejoin='round'/>
<circle cx='50' cy='50' r='12' fill='#000'/>
</svg>
<div class='dp-header'>
<span class='dp-mask-icon'>XX</span> MAXIMUM EFFORT
</div>
<div class='dp-grid'>
<div class='dp-info-box'><span>📅</span> <span>$1</span></div>
<div class='dp-info-box'><span>🕒</span> <span>$2</span></div>
<div class='dp-info-box'><span>📍</span> <span>$3</span></div>
<div class='dp-info-box'><span>🧤</span> <span>$4</span></div>
</div>
<div class='dp-mission' data-mission='$7'>$7</div>
<div class='dp-love-container'>
<div class='dp-love-header'>
<div class='dp-unicorn-label'>UNICORN METER ❤ $8%</div>
<div class='dp-score-change' data-change='$10'>Running Hot! ($10)</div>
</div>
<div class='dp-slider-wrapper'>
<div class='dp-slider-track'></div>
<div class='dp-slider-fill' style='width: $8%;'></div>
<div class='dp-slider-thumb' style='left: $8%;'>🦄</div>
</div>
<div class='dp-thought-box'>$9</div>
</div>
<div class='dp-soundtrack'>
<span>📼 MIXTAPE:</span>
<span class='dp-soundtrack-title'>$11</span>
</div>
</div>`}
];

/*{
        name: "",
        input: ``,
        regex: ``,
        template: ``
    }*/