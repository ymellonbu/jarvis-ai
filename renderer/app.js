// =========================================================
// J.A.R.V.I.S. Core Application Logic (Mark 4.31B)
// Speech Recognition, Universal App Launcher, Deep Research
// =========================================================

// State Management
const state = {
  isListening: false,
  isSpeaking: false,
  isProcessing: false,
  voiceFeedback: true,
  currentModel: 'google/gemma-4-31b-it:free',
  apiKey: '',
  voicePitch: 0.9,
  voiceRate: 1.05,
  selectedVoiceURI: ''
};

// DOM Element References
const elements = {
  reactorBtn: document.getElementById('reactor-core-btn'),
  toggleVoiceBtn: document.getElementById('toggle-voice-btn'),
  voiceBtnText: document.getElementById('voice-btn-text'),
  btnWinVoice: document.getElementById('btn-win-voice'),
  toggleTtsBtn: document.getElementById('toggle-tts-btn'),
  ttsIcon: document.getElementById('tts-icon'),
  ttsText: document.getElementById('tts-text'),
  statusBadge: document.getElementById('jarvis-status-badge'),
  statusText: document.getElementById('jarvis-status-text'),
  transcriptDisplay: document.getElementById('transcript-display'),
  commandInput: document.getElementById('command-input'),
  btnSendCommand: document.getElementById('btn-send-command'),
  chatStream: document.getElementById('chat-stream'),
  btnClearLog: document.getElementById('btn-clear-log'),
  audioCanvas: document.getElementById('audio-wave-canvas'),
  micIndicatorDot: document.getElementById('mic-indicator-dot'),
  micStatusLabel: document.getElementById('mic-status-label'),

  // Header quick buttons
  btnHeaderResearch: document.getElementById('btn-header-research'),
  btnHeaderApps: document.getElementById('btn-header-apps'),
  btnQuickResearch: document.getElementById('btn-quick-research'),
  btnQuickApps: document.getElementById('btn-quick-apps'),

  // Hardware Gauges
  cpuVal: document.getElementById('cpu-val'),
  ramVal: document.getElementById('ram-val'),
  ramFill: document.getElementById('ram-fill'),
  activeModelName: document.getElementById('active-model-name'),
  uptimeVal: document.getElementById('uptime-val'),

  // Research Modal
  researchModal: document.getElementById('research-modal'),
  researchModalClose: document.getElementById('research-modal-close'),
  researchTopicInput: document.getElementById('research-topic-input'),
  btnRunResearch: document.getElementById('btn-run-research'),

  // Apps Modal
  appsModal: document.getElementById('apps-modal'),
  appsModalClose: document.getElementById('apps-modal-close'),
  appsSearchInput: document.getElementById('apps-search-input'),
  appsGridContainer: document.getElementById('apps-grid-container'),
  appsCountBadge: document.getElementById('apps-count-badge'),
  btnRefreshApps: document.getElementById('btn-refresh-apps'),

  // Settings Modal
  btnSettings: document.getElementById('btn-settings'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  settingsModal: document.getElementById('settings-modal'),
  inputApiKey: document.getElementById('input-api-key'),
  toggleKeyVisibility: document.getElementById('toggle-key-visibility'),
  selectModel: document.getElementById('select-model'),
  selectVoice: document.getElementById('select-voice'),
  voicePitch: document.getElementById('voice-pitch'),
  pitchVal: document.getElementById('pitch-val'),
  voiceRate: document.getElementById('voice-rate'),
  rateVal: document.getElementById('rate-val'),
  btnTestVoice: document.getElementById('btn-test-voice'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  settingsSaveStatus: document.getElementById('settings-save-status')
};

// Utility to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =========================================================
// Web Audio API Synthesizer (Sci-Fi Sound FX)
// =========================================================
let audioCtx = null;
let micStream = null;
let micAnalyser = null;
let micDataArray = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play high-tech chirp when listening starts
function playChirp() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

// Play harmonic chime when command completes
function playConfirmChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.22);
    });
  } catch (e) {}
}

// =========================================================
// Real-time Audio Spectrum & Microphone Hardware Monitor
// =========================================================
const canvas = elements.audioCanvas;
const canvasCtx = canvas.getContext('2d');
const barCount = 36;
let visualizerPhase = 0;

async function initMicrophoneHardware() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStream = stream;
    const ctx = getAudioContext();
    if (ctx) {
      const source = ctx.createMediaStreamSource(stream);
      micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 128;
      micAnalyser.smoothingTimeConstant = 0.8;
      source.connect(micAnalyser);
      micDataArray = new Uint8Array(micAnalyser.frequencyBinCount);

      if (elements.micIndicatorDot) elements.micIndicatorDot.classList.add('active');
      if (elements.micStatusLabel) {
        elements.micStatusLabel.innerText = '마이크: 정상 연결됨 (실시간 음파 감지 중)';
      }
    }
  } catch (err) {
    console.warn('Microphone stream access notice:', err.message);
    if (elements.micStatusLabel) {
      elements.micStatusLabel.innerText = '마이크: Web Speech API 및 [Win+H] 사용 가능';
    }
  }
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  const width = canvas.width;
  const height = canvas.height;
  canvasCtx.clearRect(0, 0, width, height);

  visualizerPhase += 0.08;
  const barWidth = (width / barCount) - 3;

  // Query actual microphone frequency data if available
  let micLevel = 0;
  if (micAnalyser && micDataArray) {
    micAnalyser.getByteFrequencyData(micDataArray);
    for (let k = 0; k < micDataArray.length; k++) {
      micLevel += micDataArray[k];
    }
    micLevel = micLevel / (micDataArray.length * 255); // 0.0 to 1.0
  }

  for (let i = 0; i < barCount; i++) {
    let barHeight = 4;

    if (state.isSpeaking) {
      // Dynamic pulsing audio wave when JARVIS speaks
      barHeight = 10 + Math.sin(visualizerPhase * 2 + i * 0.4) * 18 + Math.cos(visualizerPhase * 1.5 + i * 0.2) * 12;
    } else if (state.isListening) {
      // If actual mic has signal, reflect actual frequency; otherwise pleasant responsive wave
      if (micDataArray && micDataArray[i % micDataArray.length] > 5) {
        const freqVal = micDataArray[i % micDataArray.length] / 255;
        barHeight = 6 + freqVal * (height - 8);
      } else {
        barHeight = 8 + Math.sin(visualizerPhase + i * 0.5) * 14;
      }
    } else if (state.isProcessing) {
      // Gold marching wave while AI / research is analyzing
      barHeight = 6 + Math.abs(Math.sin((visualizerPhase * 1.5) + (i / barCount) * Math.PI)) * 22;
    } else {
      // Idle ambient baseline with subtle mic vibration
      const micInfluence = micLevel * 14;
      barHeight = 4 + Math.sin(visualizerPhase * 0.5 + i * 0.3) * 3 + micInfluence;
    }

    barHeight = Math.max(3, Math.min(height - 4, barHeight));

    // Choose gradient color based on state
    let strokeColor = '#00f0ff';
    if (state.isProcessing) strokeColor = '#f59e0b';
    else if (state.isListening) strokeColor = '#10b981';

    const x = i * (barWidth + 3) + 2;
    const y = (height - barHeight) / 2;

    const grad = canvasCtx.createLinearGradient(0, y, 0, y + barHeight);
    grad.addColorStop(0, strokeColor);
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.15)');

    canvasCtx.fillStyle = grad;
    canvasCtx.fillRect(x, y, barWidth, barHeight);
  }
}
drawVisualizer();

// =========================================================
// Speech-to-Text (STT) - Windows Native Voice Engine
// =========================================================
let voiceTypingDebounceTimer = null;

function triggerWindowsVoiceTyping() {
  playChirp();
  state.isListening = true;
  updateUIState('listening');

  if (elements.micIndicatorDot) elements.micIndicatorDot.classList.add('active', 'recording');
  if (elements.micStatusLabel) elements.micStatusLabel.innerText = '🎙️ 음성 듣는 중... 말씀해 주세요.';
  if (elements.transcriptDisplay) elements.transcriptDisplay.innerText = '🎙️ 음성 듣는 중... 말씀해 주세요 (예: "스팀 켜줘", "인공지능 자료 조사해줘").';

  elements.commandInput.focus();
  elements.commandInput.select();

  // Call main process to activate Windows 11 Voice Typing (Win + H)
  window.jarvisAPI.triggerVoiceTyping();

  // Debounce speech input: when dictation pauses for 1.4s, auto-execute command
  const onInputHandler = () => {
    if (voiceTypingDebounceTimer) clearTimeout(voiceTypingDebounceTimer);
    const val = elements.commandInput.value.trim();
    if (val.length > 0) {
      elements.transcriptDisplay.innerText = `"${val}"`;
      voiceTypingDebounceTimer = setTimeout(() => {
        elements.commandInput.removeEventListener('input', onInputHandler);
        stopListening();
        executeJarvisCommand(val);
      }, 1400);
    }
  };

  elements.commandInput.removeEventListener('input', onInputHandler);
  elements.commandInput.addEventListener('input', onInputHandler);
}

function stopListening() {
  state.isListening = false;
  if (voiceTypingDebounceTimer) clearTimeout(voiceTypingDebounceTimer);
  updateUIState('idle');
  if (elements.micIndicatorDot) elements.micIndicatorDot.classList.remove('recording');
  if (elements.micStatusLabel) elements.micStatusLabel.innerText = '마이크: 대기 중 (실시간 음파 감지 활성화)';
}

function toggleListening() {
  if (state.isListening) {
    stopListening();
  } else {
    triggerWindowsVoiceTyping();
  }
}

// =========================================================
// Text-to-Speech (TTS) - Voice Reply
// =========================================================
function populateVoiceList() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  elements.selectVoice.innerHTML = '<option value="">시스템 기본 음성</option>';

  voices.forEach(voice => {
    const opt = document.createElement('option');
    opt.value = voice.voiceURI;
    opt.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [기본]' : ''}`;
    if (voice.lang.includes('ko') || voice.lang.includes('KO')) {
      opt.textContent = `★ [한국어] ${opt.textContent}`;
    }
    if (state.selectedVoiceURI === voice.voiceURI) {
      opt.selected = true;
    }
    elements.selectVoice.appendChild(opt);
  });
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = populateVoiceList;
}

function speakText(text) {
  if (!state.voiceFeedback || !window.speechSynthesis || !text) return;

  window.speechSynthesis.cancel();

  const cleanText = text.replace(/[*#`_\[\]]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);

  const voices = window.speechSynthesis.getVoices();
  let voiceToUse = null;

  if (state.selectedVoiceURI) {
    voiceToUse = voices.find(v => v.voiceURI === state.selectedVoiceURI);
  }
  if (!voiceToUse) {
    voiceToUse = voices.find(v => v.lang.includes('ko') || v.lang.includes('KO')) || voices[0];
  }

  if (voiceToUse) utterance.voice = voiceToUse;
  utterance.pitch = parseFloat(state.voicePitch) || 0.9;
  utterance.rate = parseFloat(state.voiceRate) || 1.05;

  utterance.onstart = () => {
    state.isSpeaking = true;
  };

  utterance.onend = () => {
    state.isSpeaking = false;
  };

  utterance.onerror = () => {
    state.isSpeaking = false;
  };

  window.speechSynthesis.speak(utterance);
}

// =========================================================
// UI State Updates
// =========================================================
function updateUIState(status) {
  elements.reactorBtn.classList.remove('listening', 'thinking');
  elements.statusBadge.classList.remove('listening', 'thinking');

  switch (status) {
    case 'listening':
      elements.reactorBtn.classList.add('listening');
      elements.statusBadge.classList.add('listening');
      elements.statusText.innerText = 'LISTENING... (음성 듣는 중)';
      elements.voiceBtnText.innerText = '음성 듣기 중지';
      elements.toggleVoiceBtn.classList.add('glow');
      break;

    case 'thinking':
      elements.reactorBtn.classList.add('thinking');
      elements.statusBadge.classList.add('thinking');
      elements.statusText.innerText = 'ANALYZING & RESEARCHING... (자료 분석 중)';
      break;

    case 'executing':
      elements.reactorBtn.classList.add('thinking');
      elements.statusText.innerText = 'EXECUTING PC COMMAND... (조종 중)';
      break;

    case 'idle':
    default:
      elements.statusText.innerText = 'SYSTEM READY (명령 대기 중)';
      elements.voiceBtnText.innerText = '음성 듣기 시작';
      break;
  }
}

// Add message to terminal feed
function appendMessage(role, text, meta = {}) {
  const item = document.createElement('div');
  item.className = `feed-item ${role}`;

  const badge = document.createElement('div');
  badge.className = 'feed-badge';
  badge.innerText = role === 'user' ? 'USER (VOICE / TEXT)' : 'J.A.R.V.I.S.';
  item.appendChild(badge);

  if (meta.thought) {
    const thought = document.createElement('div');
    thought.className = 'feed-thought';
    thought.innerText = `💡 ${meta.thought}`;
    item.appendChild(thought);
  }

  const content = document.createElement('div');
  content.className = 'feed-content';
  content.innerHTML = text;
  item.appendChild(content);

  if (meta.actionTag) {
    const tag = document.createElement('div');
    tag.className = 'action-chip-tag';
    tag.innerText = meta.actionTag;
    item.appendChild(tag);
  }

  elements.chatStream.appendChild(item);
  elements.chatStream.scrollTop = elements.chatStream.scrollHeight;
}

// =========================================================
// Research Dossier Card Rendering (자료 조사 결과 표시)
// =========================================================
function appendResearchCard(report) {
  if (!report) return;

  const item = document.createElement('div');
  item.className = 'feed-item jarvis';

  const badge = document.createElement('div');
  badge.className = 'feed-badge';
  badge.innerText = 'J.A.R.V.I.S. INTELLIGENCE REPORT';
  item.appendChild(badge);

  const card = document.createElement('div');
  card.className = 'research-dossier-card';

  // Header
  const header = document.createElement('div');
  header.className = 'dossier-header';
  header.innerHTML = `
    <div class="dossier-title-group">
      <span class="dossier-badge">DOSSIER</span>
      <span class="dossier-topic">${escapeHtml(report.topic || '심층 조사 보고서')}</span>
    </div>
    <span class="version-tag">MARK 4.31B</span>
  `;
  card.appendChild(header);

  // Executive Summary Box
  if (report.summary) {
    const sumBox = document.createElement('div');
    sumBox.className = 'dossier-summary-box';
    sumBox.innerHTML = `<strong>📌 핵심 개요:</strong> ${escapeHtml(report.summary)}`;
    card.appendChild(sumBox);
  }

  // Key Points
  if (report.keyPoints && report.keyPoints.length) {
    const kpSection = document.createElement('div');
    kpSection.innerHTML = `<div class="dossier-section-title">KEY FINDINGS & FACTS</div>`;
    const kpList = document.createElement('ul');
    kpList.className = 'dossier-keypoints-list';
    report.keyPoints.forEach(kp => {
      const li = document.createElement('li');
      li.className = 'dossier-keypoint-item';
      li.innerText = kp;
      kpList.appendChild(li);
    });
    kpSection.appendChild(kpList);
    card.appendChild(kpSection);
  }

  // Detailed Analysis
  if (report.details) {
    const detailsSection = document.createElement('div');
    detailsSection.innerHTML = `<div class="dossier-section-title">IN-DEPTH ANALYSIS & BACKGROUND</div>`;
    const detailsBox = document.createElement('div');
    detailsBox.className = 'dossier-details-text';
    detailsBox.innerText = report.details;
    detailsSection.appendChild(detailsBox);
    card.appendChild(detailsSection);
  }

  // Reference Sources
  if (report.sources && report.sources.length) {
    const srcSection = document.createElement('div');
    srcSection.innerHTML = `<div class="dossier-section-title">REFERENCE SOURCES & LINKS</div>`;
    const srcFlex = document.createElement('div');
    srcFlex.className = 'dossier-sources-flex';
    report.sources.forEach(src => {
      const pill = document.createElement('a');
      pill.className = 'dossier-source-pill';
      pill.href = '#';
      pill.innerHTML = `🔗 ${escapeHtml(src.title || '출처')}`;
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        window.jarvisAPI.directAction('open_web', { type: 'url', query: src.url });
      });
      srcFlex.appendChild(pill);
    });
    srcSection.appendChild(srcFlex);
    card.appendChild(srcSection);
  }

  // Action Buttons
  const actionsRow = document.createElement('div');
  actionsRow.className = 'dossier-actions-row';

  const btnCopy = document.createElement('button');
  btnCopy.className = 'dossier-btn';
  btnCopy.innerText = '📋 보고서 복사';
  btnCopy.onclick = () => {
    const fullText = `[J.A.R.V.I.S. 자료 조사 보고서: ${report.topic}]\n\n■ 핵심 개요:\n${report.summary || ''}\n\n■ 주요 내용:\n${(report.keyPoints || []).map(k => '• ' + k).join('\n')}\n\n■ 상세 분석:\n${report.details || ''}`;
    navigator.clipboard.writeText(fullText);
    btnCopy.innerText = '✓ 복사 완료!';
    setTimeout(() => { btnCopy.innerText = '📋 보고서 복사'; }, 1500);
  };
  actionsRow.appendChild(btnCopy);

  const btnSpeak = document.createElement('button');
  btnSpeak.className = 'dossier-btn';
  btnSpeak.innerText = '🔊 음성 브리핑 듣기';
  btnSpeak.onclick = () => {
    speakText(report.speech || report.summary || '조사 결과를 브리핑합니다.');
  };
  actionsRow.appendChild(btnSpeak);

  const btnSearchWeb = document.createElement('button');
  btnSearchWeb.className = 'dossier-btn';
  btnSearchWeb.innerText = '🌐 웹 브라우저에서 검색';
  btnSearchWeb.onclick = () => {
    window.jarvisAPI.directAction('open_web', { type: 'naver_search', query: report.topic });
  };
  actionsRow.appendChild(btnSearchWeb);

  card.appendChild(actionsRow);
  item.appendChild(card);

  elements.chatStream.appendChild(item);
  elements.chatStream.scrollTop = elements.chatStream.scrollHeight;
}

// Execute direct research
async function executeResearchTopic(topicQuery) {
  const query = (topicQuery || '').trim();
  if (!query) return;

  if (elements.researchModal) elements.researchModal.classList.add('hidden');
  if (elements.researchTopicInput) elements.researchTopicInput.value = '';

  appendMessage('user', `[자료 조사 요청] "${query}"`);
  elements.transcriptDisplay.innerText = `"${query}에 대해 자료 조사 중..."`;
  updateUIState('thinking');
  state.isProcessing = true;

  try {
    const res = await window.jarvisAPI.researchTopic(query);
    state.isProcessing = false;

    if (res && res.success && res.report) {
      appendResearchCard(res.report);
      playConfirmChime();
      speakText(res.report.speech || `보스, ${query}에 대한 조사를 완료했습니다.`);
    } else {
      appendMessage('jarvis', `조사 중 오류가 발생했습니다: ${(res && res.message) || '자료를 찾지 못했습니다.'}`);
      speakText('죄송합니다 보스, 자료를 충분히 수집하지 못했습니다.');
    }
  } catch (err) {
    state.isProcessing = false;
    appendMessage('jarvis', `자료 조사 시스템 오류: ${err.message}`);
  } finally {
    updateUIState(state.isListening ? 'listening' : 'idle');
  }
}

// =========================================================
// Installed Applications Browser & 1-Click Launcher
// =========================================================
let allInstalledApps = [];

async function loadAndRenderApps() {
  elements.appsGridContainer.innerHTML = '<div class="loading-apps">설치된 애플리케이션 목록을 색인 중입니다...</div>';
  try {
    const apps = await window.jarvisAPI.getInstalledApps();
    allInstalledApps = apps || [];
    elements.appsCountBadge.innerText = `${allInstalledApps.length}개 앱 감지됨`;
    renderAppsGrid(allInstalledApps);
  } catch (e) {
    elements.appsGridContainer.innerHTML = `<div class="loading-apps">앱 목록 로드 오류: ${e.message}</div>`;
  }
}

function renderAppsGrid(appsList) {
  elements.appsGridContainer.innerHTML = '';
  if (!appsList.length) {
    elements.appsGridContainer.innerHTML = '<div class="loading-apps">검색 조건에 맞는 앱이 없습니다.</div>';
    return;
  }

  appsList.forEach(app => {
    const card = document.createElement('div');
    card.className = 'app-card-item';
    card.title = `클릭하여 '${app.name}' 실행`;

    const initial = (app.name.charAt(0) || 'A').toUpperCase();

    card.innerHTML = `
      <div class="app-card-left">
        <div class="app-icon-badge">${initial}</div>
        <div class="app-card-name">${escapeHtml(app.name)}</div>
      </div>
      <span class="app-launch-icon">▶</span>
    `;

    card.addEventListener('click', async () => {
      elements.appsModal.classList.add('hidden');
      playChirp();
      appendMessage('user', `[앱 브라우저] '${app.name}' 실행`);
      updateUIState('executing');

      const res = await window.jarvisAPI.directAction('launch_app', app.name);
      playConfirmChime();
      const speakMsg = `'${app.name}' 앱을 실행했습니다.`;
      appendMessage('jarvis', (res && res.message) || speakMsg, {
        actionTag: `⚡ [LAUNCH] ${app.name}`
      });
      speakText(speakMsg);
      updateUIState('idle');
    });

    elements.appsGridContainer.appendChild(card);
  });
}

// =========================================================
// Main Command Execution Workflow
// =========================================================
async function executeJarvisCommand(commandText) {
  if (!commandText || !commandText.trim()) return;
  const userText = commandText.trim();

  // 1. Display user input
  appendMessage('user', userText);
  elements.transcriptDisplay.innerText = `"${userText}"`;
  elements.commandInput.value = '';

  // 2. Set thinking UI
  state.isProcessing = true;
  updateUIState('thinking');

  try {
    // 3. Send command to Electron main process
    const result = await window.jarvisAPI.processCommand(userText);
    state.isProcessing = false;

    if (result && result.success) {
      const ai = result.aiResponse || {};
      const exec = result.executionResult;

      // Check if research report is included
      const researchReport = (exec && exec.researchReport) || ai.researchReport;
      if (researchReport) {
        appendResearchCard(researchReport);
        playConfirmChime();
        speakText(researchReport.speech || ai.speech || '조사를 완료했습니다, 보스.');
        return;
      }

      let replySpeech = ai.speech || '명령을 수행했습니다, 보스.';
      let actionTag = '';

      if (ai.action && ai.action !== 'reply') {
        const actionName = ai.action.replace('_', ' ').toUpperCase();
        const paramStr = JSON.stringify(ai.parameters || {});
        actionTag = `⚡ [ACTION: ${actionName}] ${paramStr}`;
      }

      if (exec && exec.message) {
        actionTag += ` → ${exec.message}`;
      }

      // Append assistant reply to stream
      appendMessage('jarvis', replySpeech, {
        thought: ai.thought,
        actionTag
      });

      // Play success chime
      playConfirmChime();

      // Verbal speech response (TTS)
      speakText(replySpeech);
    } else {
      const errMsg = (result && result.error) || '명령을 처리하지 못했습니다.';
      appendMessage('jarvis', `오류가 발생했습니다: ${errMsg}`);
      speakText('죄송합니다 보스, 처리 중 오류가 발생했습니다.');
    }
  } catch (err) {
    state.isProcessing = false;
    console.error('Command execution failed:', err);
    appendMessage('jarvis', `시스템 통신 오류: ${err.message}`);
  } finally {
    updateUIState(state.isListening ? 'listening' : 'idle');
  }
}

// =========================================================
// Direct Quick Buttons Trigger
// =========================================================
async function triggerQuickAction(actionType, target) {
  playChirp();
  appendMessage('user', `[단축 버튼 클릭] ${actionType} → ${target}`);
  updateUIState('executing');

  try {
    let result = null;
    let speakMsg = '';

    if (actionType === 'app') {
      result = await window.jarvisAPI.directAction('launch_app', target);
      speakMsg = (result && result.message) || `${target} 앱을 실행했습니다.`;
    } else if (actionType === 'volume') {
      result = await window.jarvisAPI.directAction('system_volume', { action: target, amount: 10 });
      speakMsg = `볼륨을 ${target === 'up' ? '올렸습니다' : '내렸습니다'}.`;
    } else if (actionType === 'system') {
      result = await window.jarvisAPI.directAction('system_control', { action: target });
      speakMsg = result.message || '시스템 명령을 수행했습니다.';
    }

    playConfirmChime();
    appendMessage('jarvis', (result && result.message) || speakMsg, {
      actionTag: `⚡ [QUICK: ${actionType.toUpperCase()}] ${target}`
    });
    speakText(speakMsg);
  } catch (e) {
    appendMessage('jarvis', `단축 실행 오류: ${e.message}`);
  } finally {
    updateUIState(state.isListening ? 'listening' : 'idle');
  }
}

// =========================================================
// Real-time Hardware System Polling
// =========================================================
async function updateHardwareStats() {
  try {
    const stats = await window.jarvisAPI.getSystemStats();
    if (stats) {
      elements.ramVal.innerText = `${stats.memPercent}% (${stats.usedMemMB}/${stats.totalMemMB}MB)`;
      elements.ramFill.style.width = `${stats.memPercent}%`;
      elements.uptimeVal.innerText = stats.uptimeFormatted;
      elements.cpuVal.innerText = `${stats.cpuCores} Cores`;
    }
  } catch (e) {}
}
setInterval(updateHardwareStats, 3500);
updateHardwareStats();

// =========================================================
// Settings Load & Save
// =========================================================
async function loadAppSettings() {
  try {
    const config = await window.jarvisAPI.loadSettings();
    if (config) {
      state.apiKey = config.apiKey || '';
      state.currentModel = config.model || 'google/gemma-4-31b-it:free';
      state.voiceFeedback = config.voiceFeedback !== false;
      state.voicePitch = config.voicePitch || 0.9;
      state.voiceRate = config.voiceRate || 1.05;
      state.selectedVoiceURI = config.voiceURI || '';

      elements.inputApiKey.value = state.apiKey;
      elements.selectModel.value = state.currentModel;
      elements.activeModelName.innerText = state.currentModel.split('/')[1] || state.currentModel;
      elements.voicePitch.value = state.voicePitch;
      elements.pitchVal.innerText = state.voicePitch;
      elements.voiceRate.value = state.voiceRate;
      elements.rateVal.innerText = state.voiceRate;

      updateTtsToggleUI();
    }
  } catch (e) {
    console.error('Settings load error:', e);
  }
}

async function saveAppSettings() {
  const newSettings = {
    apiKey: elements.inputApiKey.value.trim(),
    model: elements.selectModel.value,
    voiceFeedback: state.voiceFeedback,
    voicePitch: parseFloat(elements.voicePitch.value) || 0.9,
    voiceRate: parseFloat(elements.voiceRate.value) || 1.05,
    voiceURI: elements.selectVoice.value
  };

  const res = await window.jarvisAPI.saveSettings(newSettings);
  if (res && res.success) {
    state.apiKey = newSettings.apiKey;
    state.currentModel = newSettings.model;
    state.voicePitch = newSettings.voicePitch;
    state.voiceRate = newSettings.voiceRate;
    state.selectedVoiceURI = newSettings.voiceURI;

    elements.activeModelName.innerText = state.currentModel.split('/')[1] || state.currentModel;
    elements.settingsSaveStatus.innerText = '✓ 설정이 안전하게 저장되었습니다.';
    setTimeout(() => {
      elements.settingsSaveStatus.innerText = '';
      elements.settingsModal.classList.add('hidden');
    }, 1200);

    appendMessage('system', `⚙️ 시스템 설정이 업데이트되었습니다. [모델: ${state.currentModel}]`);
  } else {
    elements.settingsSaveStatus.innerText = '저장 실패: ' + (res.error || '');
  }
}

function updateTtsToggleUI() {
  if (state.voiceFeedback) {
    elements.ttsIcon.innerText = '🔊';
    elements.ttsText.innerText = '음성: ON';
  } else {
    elements.ttsIcon.innerText = '🔇';
    elements.ttsText.innerText = '음성: OFF';
  }
}

// =========================================================
// Event Listeners Wire-up
// =========================================================
function initEventListeners() {
  // 1. Arc Reactor Click to Toggle Listening
  elements.reactorBtn.addEventListener('click', () => {
    toggleListening();
  });

  // 2. Toggle Voice Button
  elements.toggleVoiceBtn.addEventListener('click', () => {
    toggleListening();
  });

  // 3. Windows Native Voice Typing Button (Win + H)
  if (elements.btnWinVoice) {
    elements.btnWinVoice.addEventListener('click', () => {
      triggerWindowsVoiceTyping();
    });
  }

  // 4. Toggle TTS Voice Feedback
  elements.toggleTtsBtn.addEventListener('click', () => {
    state.voiceFeedback = !state.voiceFeedback;
    updateTtsToggleUI();
    window.jarvisAPI.saveSettings({ voiceFeedback: state.voiceFeedback });
  });

  // 5. Send Command Input
  elements.btnSendCommand.addEventListener('click', () => {
    executeJarvisCommand(elements.commandInput.value);
  });

  elements.commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeJarvisCommand(elements.commandInput.value);
    }
  });

  // 6. Clear Log
  elements.btnClearLog.addEventListener('click', () => {
    elements.chatStream.innerHTML = '';
  });

  // 7. Quick Action Buttons
  document.querySelectorAll('.quick-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const target = btn.dataset.target;
      triggerQuickAction(action, target);
    });
  });

  // 8. Research Buttons & Modal
  const openResearch = () => {
    elements.researchModal.classList.remove('hidden');
    setTimeout(() => {
      elements.researchTopicInput.focus();
    }, 100);
  };

  if (elements.btnHeaderResearch) elements.btnHeaderResearch.addEventListener('click', openResearch);
  if (elements.btnQuickResearch) elements.btnQuickResearch.addEventListener('click', openResearch);

  if (elements.researchModalClose) {
    elements.researchModalClose.addEventListener('click', () => {
      elements.researchModal.classList.add('hidden');
    });
  }

  if (elements.btnRunResearch) {
    elements.btnRunResearch.addEventListener('click', () => {
      executeResearchTopic(elements.researchTopicInput.value);
    });
  }

  if (elements.researchTopicInput) {
    elements.researchTopicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeResearchTopic(elements.researchTopicInput.value);
      }
    });
  }

  // Suggest chips
  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const topic = chip.dataset.topic;
      executeResearchTopic(topic);
    });
  });

  // 9. All Apps Browser Modal
  const openAppsBrowser = () => {
    elements.appsModal.classList.remove('hidden');
    loadAndRenderApps();
    setTimeout(() => {
      elements.appsSearchInput.focus();
    }, 100);
  };

  if (elements.btnHeaderApps) elements.btnHeaderApps.addEventListener('click', openAppsBrowser);
  if (elements.btnQuickApps) elements.btnQuickApps.addEventListener('click', openAppsBrowser);

  if (elements.appsModalClose) {
    elements.appsModalClose.addEventListener('click', () => {
      elements.appsModal.classList.add('hidden');
    });
  }

  if (elements.btnRefreshApps) {
    elements.btnRefreshApps.addEventListener('click', () => {
      loadAndRenderApps();
    });
  }

  if (elements.appsSearchInput) {
    elements.appsSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderAppsGrid(allInstalledApps);
        return;
      }
      const filtered = allInstalledApps.filter(a =>
        a.name.toLowerCase().includes(query)
      );
      renderAppsGrid(filtered);
    });
  }

  // 10. Settings Modal
  elements.btnSettings.addEventListener('click', () => {
    elements.settingsModal.classList.remove('hidden');
    populateVoiceList();
  });

  elements.modalCloseBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });

  // Close modals on overlay backdrop click
  [elements.settingsModal, elements.researchModal, elements.appsModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    }
  });

  elements.toggleKeyVisibility.addEventListener('click', () => {
    if (elements.inputApiKey.type === 'password') {
      elements.inputApiKey.type = 'text';
      elements.toggleKeyVisibility.innerText = '숨김';
    } else {
      elements.inputApiKey.type = 'password';
      elements.toggleKeyVisibility.innerText = '표시';
    }
  });

  elements.voicePitch.addEventListener('input', () => {
    elements.pitchVal.innerText = elements.voicePitch.value;
  });

  elements.voiceRate.addEventListener('input', () => {
    elements.rateVal.innerText = elements.voiceRate.value;
  });

  elements.btnTestVoice.addEventListener('click', () => {
    state.voicePitch = parseFloat(elements.voicePitch.value);
    state.voiceRate = parseFloat(elements.voiceRate.value);
    state.selectedVoiceURI = elements.selectVoice.value;
    speakText('안녕하세요 보스, 자비스의 새로운 음성 출력 상태를 테스트 중입니다.');
  });

  elements.btnSaveSettings.addEventListener('click', saveAppSettings);
}

// Initial Boot Sequence
document.addEventListener('DOMContentLoaded', () => {
  initMicrophoneHardware();
  loadAppSettings();
  initEventListeners();
});
