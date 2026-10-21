# 🤖 J.A.R.V.I.S. - AI Desktop Assistant (MARK 4.31B)

> *"안녕하세요 보스, 시스템 진단 및 음성 인터페이스가 준비되었습니다."*

**J.A.R.V.I.S.**는 영화 '아이언맨'의 인공지능 비서를 모티브로 제작된 **Windows 전용 AI 데스크톱 비서**입니다. OpenRouter API(기본 모델: `Gemma 4 31B Free`)를 기반으로 사용자의 자연어 명령을 분석하며, 단순한 챗봇을 넘어 **실제 Windows PC 제어, 앱 실행, 심층 웹 자료 조사**까지 수행하는 강력한 로컬 통합 시스템입니다.

---

## ✨ 주요 기능 (Key Features)

### 💻 1. 강력한 PC 시스템 제어 (Universal App Launcher)
*   **앱 실행:** "스팀 켜줘", "카카오톡 열어줘", "작업관리자 띄워줘" 등 내장된 별칭 데이터 및 Windows StartApps 스캔을 통해 PC에 설치된 거의 모든 앱과 게임을 1초 만에 실행합니다.
*   **시스템 제어:** 볼륨 조절(상하/음소거), 미디어 제어, 시스템 종료/재부팅/취소, 화면 잠금, 절전 모드 등 시스템의 핵심 기능을 말 한마디로 제어합니다.
*   **폴더 및 웹 탐색:** 다운로드, 바탕화면 문서 폴더 접근 및 유튜브/구글/네이버 웹 검색을 즉시 수행합니다.

### ⚡ 2. 지연 없는 오프라인 인텐트 엔진 (Offline Engine)
*   네트워크가 끊기거나 API 할당량을 초과했나요? 문제없습니다. 
*   앱 실행, 시스템 제어 등 기본적인 명령은 서버를 거치지 않고 내장된 **자연어 정규식 엔진(Offline Intent)** 을 통해 **0.1초의 지연 없이 즉각적으로 처리**됩니다.

### 🌐 3. 심층 자료 조사 연구소 (Deep Research Engine)
*   "양자 컴퓨터에 대해 조사해줘" 라고 명령하면, J.A.R.V.I.S.가 백과사전(Wikipedia 등) 데이터를 스크래핑합니다.
*   수집된 팩트 데이터를 AI 모델(Gemma 4 31B)에 주입하여, 핵심 개요, 주요 사실, 상세 분석이 포함된 **고품질 인텔리전스 브리핑 보고서**를 생성하고 음성으로 브리핑합니다.

### 🎙️ 4. 완벽한 한국어 음성 인식 & 합성 (STT / TTS)
*   **음성 명령:** Windows 11 기본 고성능 음성 받아쓰기(`Win + H`)를 프로그래매틱하게 트리거하여 매우 정확하게 한국어 명령을 인식합니다.
*   **음성 피드백:** Web Speech API를 활용하여, 상황에 맞는 톤과 속도로 진행 상황을 사용자('보스')에게 음성으로 보고합니다.

### 🖥️ 5. Sci-Fi 테마의 HUD 인터페이스
*   아크 리액터 애니메이션, 실시간 오디오 스펙트럼 시각화, 하드웨어 상태(CPU/RAM) 모니터링 기능이 포함된 몰입감 넘치는 대시보드를 제공합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

*   **Frontend UI:** HTML5, CSS3, Vanilla JavaScript (Web Audio API, Web Speech API)
*   **Desktop Framework:** [Electron](https://www.electronjs.org/) (Node.js 기반 크로스 플랫폼 앱)
*   **AI API:** [OpenRouter](https://openrouter.ai/) (기본 모델: `google/gemma-4-31b-it:free`)
*   **System Integration:** Windows PowerShell, Child Process Exec

---

## 🚀 설치 및 실행 방법 (Installation & Usage)

### 1. 사전 요구 사항 (Prerequisites)
*   **OS:** Windows 10 / 11 (Windows 11 권장, 기본 음성 인식 기능 사용 시)
*   **Node.js:** v16 이상 설치
*   **OpenRouter API Key:** [OpenRouter](https://openrouter.ai/)에서 무료 API 키 발급 필요 (옵션: 키가 없어도 오프라인 PC 제어는 작동)

### 2. 프로젝트 클론 및 설치
```bash
# 저장소 클론 (경로에 맞게 수정)
git clone https://github.com/ymellonbu/jarvis-ai.git

# 프로젝트 폴더로 이동
cd jarvis-ai

# 의존성 패키지 설치
npm install
```

### 3. API 키 설정 (선택 사항)
프로그램 실행 후, 우측 상단의 **설정(톱니바퀴) 아이콘**을 클릭하여 OpenRouter API 키를 입력하고 저장할 수 있습니다. (또는 루트 디렉토리의 `config.json` 파일을 직접 수정해도 됩니다.)

### 4. 프로그램 실행
```bash
# Electron 데스크톱 앱 실행
npm start
```

---

## 💬 명령어 예시 (Command Examples)

마이크 버튼을 누르거나 텍스트 콘솔에 아래와 같이 입력해 보세요.

**🚀 앱 및 시스템 제어**
*   *"스팀 켜줘"*
*   *"메모장 실행해"*
*   *"볼륨 좀 줄여줘"*
*   *"음소거 해제"*
*   *"화면 잠금"*
*   *"1시간 뒤에 컴퓨터 꺼줘" -> "종료 취소"*

**🌐 자료 조사 및 웹 검색**
*   *"인공지능 초거대 언어모델에 대해 조사해줘"*
*   *"상온 초전도체 자료 조사 시작해"*
*   *"유튜브에서 아이언맨 명장면 틀어줘"*

---

## 📁 프로젝트 구조 (Project Structure)

*   `main.js`: Electron 메인 프로세스, IPC 통신 및 창 관리
*   `preload.js`: 보안을 유지하며 Renderer 프로세스와 Main 프로세스 연결
*   `src/system-controller.js`: PowerShell/CMD를 통한 Windows OS 직접 제어 모듈
*   `src/ai-service.js`: OpenRouter API 통신 및 LLM 프롬프트 엔지니어링 모듈
*   `src/offline-intent.js`: API 통신 없이 작동하는 초고속 정규식 기반 명령 인식 모듈
*   `src/research-service.js`: 위키백과 데이터 수집 및 인텔리전스 보고서 작성 모듈
*   `renderer/` (`index.html`, `styles.css`, `app.js`): J.A.R.V.I.S. HUD 프론트엔드 UI

---

## 📄 라이선스 (License)

이 프로젝트는 MIT License를 따릅니다. 자세한 내용은 `LICENSE` 파일을 확인하세요.

---
*Created for the ultimate Windows PC experience. "At your service, Boss."*
