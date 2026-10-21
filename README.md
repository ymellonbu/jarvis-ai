# 🤖 J.A.R.V.I.S. - AI Desktop Assistant (MARK 4.31B)

> *"Hello Boss, system diagnostics and voice interface are ready."*

Inspired by Iron Man's AI, J.A.R.V.I.S. is a **Windows-exclusive AI desktop assistant**. Powered by the OpenRouter API (Default: `Gemma 4 31B Free`), it goes far beyond a simple chatbot. It understands natural language commands to **directly control your Windows PC, launch applications, and conduct in-depth web research**—acting as a true local integration system.

## ✨ Key Features

### 💻 1. Powerful PC System Control (Universal App Launcher)
* **App Execution:** Launch almost any installed application or game in a second. Uses a built-in alias dictionary and Windows StartApps scanning (e.g., "Open Steam," "Launch Chrome," "Open Task Manager").
* **System Management:** Control system volume (up/down/mute), media playback, power states (shutdown/reboot/cancel, lock screen, sleep mode) all with simple voice commands.
* **Navigation & Web:** Instantly open specific directories (Downloads, Desktop, Documents) or execute quick web searches on YouTube, Google, and Naver.

### ⚡ 2. Zero-Latency Offline Intent Engine
* Network disconnected or API quota exceeded? No problem.
* Basic commands like app launching and system controls are processed instantly (under 0.1s latency) through a built-in **Natural Language Regex Engine (Offline Intent)**, entirely bypassing the server.

### 🌐 3. Deep Research Engine
* Give a command like *"Research Quantum Computing,"* and J.A.R.V.I.S. will scrape encyclopedic data (Wikipedia, etc.).
* The gathered factual data is injected into the AI model (Gemma 4 31B) to generate a **high-quality intelligence briefing report**, including a core summary, key facts, detailed analysis, and a voice briefing.

### 🎙️ 4. Seamless Speech Recognition & Synthesis (STT / TTS)
* **Voice Commands:** Programmatically triggers the highly accurate Windows 11 native voice dictation (`Win + H`) to capture your spoken commands perfectly.
* **Voice Feedback:** Utilizes the Web Speech API to report task progress and research summaries with appropriate tone and speed, addressing you as "Boss."

### 🖥️ 5. Sci-Fi Theme HUD Interface
* Immerse yourself in a Stark Industries-style dashboard featuring an animated Arc Reactor, real-time audio spectrum visualizer, and live hardware (CPU/RAM) monitoring.

## 🛠️ Tech Stack

* **Frontend UI:** HTML5, CSS3, Vanilla JavaScript (Web Audio API, Web Speech API)
* **Desktop Framework:** [Electron](https://www.electronjs.org/) (Node.js cross-platform desktop app)
* **AI API:** [OpenRouter](https://openrouter.ai/) (Default Model: `google/gemma-4-31b-it:free`)
* **System Integration:** Windows PowerShell, Node.js `child_process` (exec/spawn)

## 🚀 Installation & Usage

### 1. Prerequisites
* **OS:** Windows 10 / 11 (Windows 11 highly recommended for native voice dictation)
* **Node.js:** v16 or higher installed
* **OpenRouter API Key:** A free API key from [OpenRouter](https://openrouter.ai/) is required for AI features. (Note: The offline PC control engine works even without an API key).

### 2. Clone and Install
```bash
# Clone the repository
git clone https://github.com/ymellonbu/jarvis-ai.git

# Navigate to the project directory
cd jarvis-ai

# Install dependencies
npm install
```

### 3. API Key Setup (Optional)
After launching the app, click the **Settings (Gear) icon** in the top right corner to enter and save your OpenRouter API key. Alternatively, you can directly edit the `config.json` file in the root directory.

### 4. Run the Application
```bash
# Launch the Electron desktop app
npm start
```

## 💬 Command Examples

Click the microphone icon or type in the console to try these commands (Currently optimized for Korean input):

**🚀 App & System Control**
* *"스팀 켜줘"* (Launch Steam)
* *"메모장 실행해"* (Open Notepad)
* *"볼륨 좀 줄여줘"* (Volume down)
* *"화면 잠금"* (Lock the screen)
* *"1시간 뒤에 컴퓨터 꺼줘"* -> *"종료 취소"* (Shutdown PC in 1 hour -> Cancel shutdown)

**🌐 Web Search & Research**
* *"인공지능 초거대 언어모델에 대해 조사해줘"* (Research Large Language Models)
* *"유튜브에서 아이언맨 명장면 틀어줘"* (Play Iron Man best scenes on YouTube)

## 📁 Project Structure

* `main.js`: Electron main process, IPC communication, and window management.
* `preload.js`: Secure bridge between the Renderer and Main processes.
* `src/system-controller.js`: Direct Windows OS control module via PowerShell/CMD.
* `src/ai-service.js`: OpenRouter API communication and LLM prompt engineering.
* `src/offline-intent.js`: High-speed regex-based command recognition module (Offline).
* `src/research-service.js`: Wikipedia data scraping and intelligence report generation.
* `renderer/` (`index.html`, `styles.css`, `app.js`): J.A.R.V.I.S. HUD frontend UI.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

*Created for the ultimate Windows PC experience. "At your service, Boss."*
