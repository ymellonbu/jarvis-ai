const { app, BrowserWindow, ipcMain, session } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const systemController = require('./src/system-controller');
const { AIService, DEFAULT_MODEL } = require('./src/ai-service');
const researchService = require('./src/research-service');

// Safe media permissions switch (no Google chunked data pipe upload error)
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');

const USER_CONFIG_PATH = path.join(app.getPath('userData'), 'jarvis-config.json');
const LOCAL_CONFIG_PATH = path.join(__dirname, 'config.json');

// Default config
let config = {
  apiKey: '',
  model: DEFAULT_MODEL,
  voiceFeedback: true,
  continuousListening: false,
  wakeWordEnabled: true
};

// Load config (prioritizes local project config.json, then userData)
try {
  if (fs.existsSync(LOCAL_CONFIG_PATH)) {
    const raw = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  } else if (fs.existsSync(USER_CONFIG_PATH)) {
    const raw = fs.readFileSync(USER_CONFIG_PATH, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  }
} catch (e) {
  console.error('Failed to load config:', e);
}

const aiService = new AIService(config.apiKey, config.model);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 1020,
    minHeight: 700,
    title: 'J.A.R.V.I.S. - AI Desktop Assistant',
    backgroundColor: '#050a12',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

// Window control IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// Settings IPC
ipcMain.handle('load-settings', async () => {
  return config;
});

ipcMain.handle('save-settings', async (event, newSettings) => {
  config = { ...config, ...newSettings };
  aiService.setApiKey(config.apiKey);
  aiService.setModel(config.model);

  try {
    fs.writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    try { fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { }
    return { success: true, config };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// System Stats IPC
ipcMain.handle('get-system-stats', async () => {
  return await systemController.getSystemStats();
});

// Get Installed Windows Applications IPC
ipcMain.handle('get-installed-apps', async () => {
  return await systemController.getInstalledApps();
});

// Direct Research Topic IPC
ipcMain.handle('research-topic', async (event, query) => {
  return await researchService.conductResearch(query, config.apiKey, config.model);
});

// Windows Voice Typing Trigger IPC (Win + H)
ipcMain.handle('trigger-voice-typing', async () => {
  if (mainWindow) {
    mainWindow.focus();
  }
  return await systemController.triggerVoiceTyping();
});

// Direct PC Action IPC (for quick buttons)
ipcMain.handle('direct-pc-action', async (event, { actionType, payload }) => {
  try {
    switch (actionType) {
      case 'launch_app':
        return await systemController.launchApp(payload);
      case 'research':
        const res = await researchService.conductResearch(payload.query || payload, config.apiKey, config.model);
        return { success: true, researchReport: res.report, message: `'${payload.query || payload}' 조사를 완료했습니다.` };
      case 'open_web':
        return await systemController.openWeb(payload.type, payload.query);
      case 'system_volume':
        return await systemController.controlVolume(payload.action, payload.amount);
      case 'system_control':
        return await systemController.systemAction(payload.action);
      case 'open_folder':
        return await systemController.openDirectory(payload.folder);
      case 'execute_command':
        return await systemController.runCommand(payload.command);
      default:
        return { success: false, message: `알 수 없는 액션: ${actionType}` };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Process JARVIS voice/text command
ipcMain.handle('process-jarvis-command', async (event, text) => {
  try {
    // 1. Send to AI Service (Gemma 4 31B Free via OpenRouter or offline intent)
    const aiResult = await aiService.processUserMessage(text);
    let executionResult = null;

    // 2. Execute PC action if specified
    if (aiResult.action && aiResult.action !== 'reply') {
      const { action, parameters } = aiResult;
      switch (action) {
        case 'launch_app':
          executionResult = await systemController.launchApp(parameters.app);
          break;
        case 'research_topic':
          // Research data is already processed in aiService.processUserMessage
          executionResult = {
            success: true,
            researchReport: aiResult.researchReport,
            message: `'${parameters.query || text}' 자료 조사를 완료했습니다.`
          };
          break;
        case 'open_web':
          executionResult = await systemController.openWeb(parameters.type || 'url', parameters.query);
          break;
        case 'system_volume':
          executionResult = await systemController.controlVolume(parameters.action, parameters.amount || 10);
          break;
        case 'system_control':
          executionResult = await systemController.systemAction(parameters.action);
          break;
        case 'open_folder':
          executionResult = await systemController.openDirectory(parameters.folder);
          break;
        case 'execute_command':
          executionResult = await systemController.runCommand(parameters.command);
          break;
        default:
          executionResult = { success: true, message: `지정된 동작 '${action}'을 완료했습니다.` };
          break;
      }
    }

    return {
      success: true,
      aiResponse: aiResult,
      executionResult
    };
  } catch (err) {
    console.error('Error in process-jarvis-command:', err);
    return {
      success: false,
      aiResponse: {
        action: 'reply',
        speech: '보스, 명령을 처리하는 중 오류가 발생했습니다.'
      },
      error: err.message
    };
  }
});

let pythonServiceProcess = null;

function startPythonService() {
  const scriptPath = path.join(__dirname, 'src', 'service.py');
  if (!fs.existsSync(scriptPath)) return;

  try {
    pythonServiceProcess = spawn('python', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    pythonServiceProcess.stdout.on('data', (data) => {
      console.log(`[Python Service]: ${data.toString().trim()}`);
    });

    pythonServiceProcess.stderr.on('data', (data) => {
      console.error(`[Python Service Error]: ${data.toString().trim()}`);
    });

    pythonServiceProcess.on('error', (err) => {
      console.warn('[Python Service] Could not launch python:', err.message);
    });

    pythonServiceProcess.on('close', (code) => {
      console.log(`[Python Service] Exited with code: ${code}`);
      pythonServiceProcess = null;
    });
  } catch (err) {
    console.error('Failed to spawn Python service:', err);
  }
}

function stopPythonService() {
  if (pythonServiceProcess) {
    try {
      pythonServiceProcess.kill();
    } catch (e) {}
    pythonServiceProcess = null;
  }
}

app.whenReady().then(() => {
  // Grant microphone, audio capture, speech recognition, and media permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'microphone' || permission === 'speech' || permission === 'notifications') {
      return callback(true);
    }
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });

  // Start background Python service if present
  startPythonService();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  stopPythonService();
});

app.on('window-all-closed', () => {
  stopPythonService();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

