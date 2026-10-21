const { exec, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

class SystemController {
  constructor() {
    this.desktopPath = path.join(os.homedir(), 'Desktop');
    this.oneDriveDesktopPath = path.join(os.homedir(), 'OneDrive', '바탕 화면');
    this.publicDesktopPath = 'C:\\Users\\Public\\Desktop';
    this.userStartMenu = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    this.commonStartMenu = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs';

    this.installedApps = [];
    this.shortcuts = [];
    this.isIndexing = false;

    // Build extensive app alias map for natural Korean & English user commands
    this.aliasMap = {
      // Browsers
      '크롬': { type: 'cmd', name: 'Google Chrome', cmd: 'start chrome' },
      '구글 크롬': { type: 'cmd', name: 'Google Chrome', cmd: 'start chrome' },
      'chrome': { type: 'cmd', name: 'Google Chrome', cmd: 'start chrome' },
      '엣지': { type: 'cmd', name: 'Microsoft Edge', cmd: 'start msedge' },
      '마이크로소프트 엣지': { type: 'cmd', name: 'Microsoft Edge', cmd: 'start msedge' },
      'edge': { type: 'cmd', name: 'Microsoft Edge', cmd: 'start msedge' },
      '웨일': { type: 'cmd', name: '네이버 웨일', cmd: 'start whale' },
      '네이버 웨일': { type: 'cmd', name: '네이버 웨일', cmd: 'start whale' },
      '브레이브': { type: 'cmd', name: 'Brave', cmd: 'start brave' },
      '파이어폭스': { type: 'cmd', name: 'Firefox', cmd: 'start firefox' },
      '오페라': { type: 'cmd', name: 'Opera', cmd: 'start opera' },

      // Messengers & Social
      '카카오톡': { type: 'protocol', name: '카카오톡', target: 'kakaotalk:' },
      '카톡': { type: 'protocol', name: '카카오톡', target: 'kakaotalk:' },
      'kakaotalk': { type: 'protocol', name: '카카오톡', target: 'kakaotalk:' },
      '디스코드': { type: 'protocol', name: 'Discord', target: 'discord:' },
      '디코': { type: 'protocol', name: 'Discord', target: 'discord:' },
      'discord': { type: 'protocol', name: 'Discord', target: 'discord:' },
      '텔레그램': { type: 'cmd', name: 'Telegram', cmd: 'start telegram' },
      '슬랙': { type: 'cmd', name: 'Slack', cmd: 'start slack' },
      '줌': { type: 'cmd', name: 'Zoom', cmd: 'start zoom' },
      'teams': { type: 'cmd', name: 'Microsoft Teams', cmd: 'start msteams' },
      '팀즈': { type: 'cmd', name: 'Microsoft Teams', cmd: 'start msteams' },

      // Office & Productivity
      '메모장': { type: 'cmd', name: '메모장', cmd: 'notepad.exe' },
      'notepad': { type: 'cmd', name: '메모장', cmd: 'notepad.exe' },
      '계산기': { type: 'cmd', name: '계산기', cmd: 'calc.exe' },
      'calculator': { type: 'cmd', name: '계산기', cmd: 'calc.exe' },
      'calc': { type: 'cmd', name: '계산기', cmd: 'calc.exe' },
      '그림판': { type: 'cmd', name: '그림판', cmd: 'mspaint.exe' },
      'paint': { type: 'cmd', name: '그림판', cmd: 'mspaint.exe' },
      '엑셀': { type: 'cmd', name: 'Microsoft Excel', cmd: 'start excel' },
      'excel': { type: 'cmd', name: 'Microsoft Excel', cmd: 'start excel' },
      '워드': { type: 'cmd', name: 'Microsoft Word', cmd: 'start winword' },
      'word': { type: 'cmd', name: 'Microsoft Word', cmd: 'start winword' },
      '파워포인트': { type: 'cmd', name: 'Microsoft PowerPoint', cmd: 'start powerpnt' },
      '파포': { type: 'cmd', name: 'Microsoft PowerPoint', cmd: 'start powerpnt' },
      '피피티': { type: 'cmd', name: 'Microsoft PowerPoint', cmd: 'start powerpnt' },
      'ppt': { type: 'cmd', name: 'Microsoft PowerPoint', cmd: 'start powerpnt' },
      '한글': { type: 'app', name: '한글', cmd: 'hwp.exe' },
      '아래아한글': { type: 'app', name: '한글', cmd: 'hwp.exe' },
      '한컴': { type: 'app', name: '한컴오피스', cmd: 'hwp.exe' },
      '옵시디언': { type: 'app', name: 'Obsidian', cmd: 'obsidian.exe' },
      'obsidian': { type: 'app', name: 'Obsidian', cmd: 'obsidian.exe' },
      '노션': { type: 'app', name: 'Notion', cmd: 'notion.exe' },
      '투두': { type: 'app', name: 'Microsoft To Do', cmd: 'todo' },

      // Development Tools
      '코드': { type: 'cmd', name: 'Visual Studio Code', cmd: 'code' },
      'vscode': { type: 'cmd', name: 'Visual Studio Code', cmd: 'code' },
      'vs code': { type: 'cmd', name: 'Visual Studio Code', cmd: 'code' },
      '비주얼스튜디오': { type: 'cmd', name: 'Visual Studio Code', cmd: 'code' },
      '터미널': { type: 'cmd', name: 'Windows Terminal', cmd: 'start wt.exe' },
      '명령 프롬프트': { type: 'cmd', name: '명령 프롬프트', cmd: 'start cmd.exe' },
      'cmd': { type: 'cmd', name: '명령 프롬프트', cmd: 'start cmd.exe' },
      '파워쉘': { type: 'cmd', name: 'PowerShell', cmd: 'start powershell.exe' },
      'powershell': { type: 'cmd', name: 'PowerShell', cmd: 'start powershell.exe' },
      '안티그래비티': { type: 'app', name: 'Antigravity', cmd: 'antigravity' },
      '파이썬': { type: 'app', name: 'Python', cmd: 'python' },
      'idle': { type: 'app', name: 'Python IDLE', cmd: 'idle' },
      '깃허브': { type: 'app', name: 'GitHub Desktop', cmd: 'github' },
      '파일질라': { type: 'app', name: 'FileZilla', cmd: 'filezilla.exe' },
      'filezilla': { type: 'app', name: 'FileZilla', cmd: 'filezilla.exe' },

      // Games & Launchers
      '스팀': { type: 'protocol', name: 'Steam', target: 'steam:' },
      'steam': { type: 'protocol', name: 'Steam', target: 'steam:' },
      '로블록스': { type: 'protocol', name: 'Roblox', target: 'roblox:' },
      'roblox': { type: 'protocol', name: 'Roblox', target: 'roblox:' },
      '마인크래프트': { type: 'app', name: 'Minecraft', cmd: 'minecraft' },
      '마크': { type: 'app', name: 'Minecraft', cmd: 'minecraft' },
      'minecraft': { type: 'app', name: 'Minecraft', cmd: 'minecraft' },
      '롤': { type: 'app', name: 'League of Legends', cmd: 'RiotClientServices.exe' },
      '리그오브레전드': { type: 'app', name: 'League of Legends', cmd: 'RiotClientServices.exe' },
      '발로란트': { type: 'app', name: 'VALORANT', cmd: 'RiotClientServices.exe' },
      '발로': { type: 'app', name: 'VALORANT', cmd: 'RiotClientServices.exe' },
      '오버워치': { type: 'app', name: 'Overwatch', cmd: 'battle.net' },
      '옵치': { type: 'app', name: 'Overwatch', cmd: 'battle.net' },
      '배틀그라운드': { type: 'app', name: 'PUBG', cmd: 'steam://rungameid/578080' },
      '배그': { type: 'app', name: 'PUBG', cmd: 'steam://rungameid/578080' },
      '에픽게임즈': { type: 'protocol', name: 'Epic Games', target: 'com.epicgames.launcher:' },
      '넷마블': { type: 'app', name: 'Netmarble Launcher', cmd: 'netmarble' },
      '월페이퍼엔진': { type: 'app', name: 'Wallpaper Engine', cmd: 'wallpaper32.exe' },
      'wallpaper engine': { type: 'app', name: 'Wallpaper Engine', cmd: 'wallpaper32.exe' },

      // Media & Music
      '스포티파이': { type: 'protocol', name: 'Spotify', target: 'spotify:' },
      'spotify': { type: 'protocol', name: 'Spotify', target: 'spotify:' },
      '유튜브': { type: 'url', name: 'YouTube', url: 'https://www.youtube.com' },
      'youtube': { type: 'url', name: 'YouTube', url: 'https://www.youtube.com' },
      'obs': { type: 'app', name: 'OBS Studio', cmd: 'obs64.exe' },
      'obs스튜디오': { type: 'app', name: 'OBS Studio', cmd: 'obs64.exe' },
      '넷플릭스': { type: 'protocol', name: 'Netflix', target: 'netflix:' },
      '멜론': { type: 'app', name: 'Melon', cmd: 'melon.exe' },
      '클립챔프': { type: 'app', name: 'Microsoft Clipchamp', cmd: 'clipchamp' },

      // System Tools
      '작업관리자': { type: 'cmd', name: '작업 관리자', cmd: 'taskmgr.exe' },
      '작업 관리자': { type: 'cmd', name: '작업 관리자', cmd: 'taskmgr.exe' },
      'taskmgr': { type: 'cmd', name: '작업 관리자', cmd: 'taskmgr.exe' },
      '탐색기': { type: 'cmd', name: '파일 탐색기', cmd: 'explorer.exe' },
      '파일 탐색기': { type: 'cmd', name: '파일 탐색기', cmd: 'explorer.exe' },
      '내컴퓨터': { type: 'cmd', name: '파일 탐색기', cmd: 'explorer.exe' },
      '내 컴퓨터': { type: 'cmd', name: '파일 탐색기', cmd: 'explorer.exe' },
      'explorer': { type: 'cmd', name: '파일 탐색기', cmd: 'explorer.exe' },
      '캡처도구': { type: 'cmd', name: '캡처 도구', cmd: 'snippingtool.exe' },
      '캡처 도구': { type: 'cmd', name: '캡처 도구', cmd: 'snippingtool.exe' },
      '캡처': { type: 'cmd', name: '캡처 도구', cmd: 'snippingtool.exe' },
      '화면 캡처': { type: 'cmd', name: '캡처 도구', cmd: 'snippingtool.exe' },
      '설정': { type: 'protocol', name: 'Windows 설정', target: 'ms-settings:' },
      '윈도우 설정': { type: 'protocol', name: 'Windows 설정', target: 'ms-settings:' },
      'settings': { type: 'protocol', name: 'Windows 설정', target: 'ms-settings:' },
      '제어판': { type: 'cmd', name: '제어판', cmd: 'control.exe' },
      'control': { type: 'cmd', name: '제어판', cmd: 'control.exe' },
      '스토어': { type: 'protocol', name: 'Microsoft Store', target: 'ms-windows-store:' },
      '마이크로소프트 스토어': { type: 'protocol', name: 'Microsoft Store', target: 'ms-windows-store:' },
      '카메라': { type: 'protocol', name: '카메라', target: 'microsoft.windows.camera:' },
      '시계': { type: 'protocol', name: '시계', target: 'ms-clock:' },
      '알람': { type: 'protocol', name: '시계', target: 'ms-clock:' },
      '날씨': { type: 'protocol', name: '날씨', target: 'bingweather:' }
    };

    // Initial background indexing
    this.refreshInstalledApps();
    this.scanShortcuts();
  }

  // Run PowerShell command safely with UTF8 support
  runPowerShell(psCommand) {
    return new Promise((resolve) => {
      const script = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${psCommand}`;
      exec(`powershell -NoProfile -NonInteractive -Command "${script.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, output: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout ? stdout.trim() : '' });
        }
      });
    });
  }

  // Run shell command
  runCommand(command) {
    return new Promise((resolve) => {
      exec(command, { encoding: 'utf8', shell: 'cmd.exe' }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, output: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout ? stdout.trim() : '' });
        }
      });
    });
  }

  // Refresh index of all registered Windows applications using Get-StartApps
  async refreshInstalledApps() {
    if (this.isIndexing) return this.installedApps;
    this.isIndexing = true;

    try {
      const psCmd = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-StartApps | ConvertTo-Json -Compress`;
      const res = await this.runPowerShell(psCmd);
      if (res.success && res.output) {
        try {
          const list = JSON.parse(res.output);
          if (Array.isArray(list)) {
            this.installedApps = list;
          }
        } catch (e) {
          console.warn('Failed to parse Get-StartApps JSON:', e.message);
        }
      }
    } catch (e) {
      console.warn('refreshInstalledApps error:', e.message);
    } finally {
      this.isIndexing = false;
    }

    return this.installedApps;
  }

  // Recursively collect .lnk shortcuts from directory
  collectLnkFiles(dir, maxDepth = 2, currentDepth = 0) {
    let results = [];
    if (!fs.existsSync(dir) || currentDepth > maxDepth) return results;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(this.collectLnkFiles(fullPath, maxDepth, currentDepth + 1));
        } else if (entry.isFile() && (entry.name.toLowerCase().endsWith('.lnk') || entry.name.toLowerCase().endsWith('.url'))) {
          results.push({
            name: entry.name.replace(/\.(lnk|url)$/i, ''),
            fullPath
          });
        }
      }
    } catch (e) {}
    return results;
  }

  // Scan shortcut locations
  scanShortcuts() {
    const searchDirs = [
      this.desktopPath,
      this.oneDriveDesktopPath,
      this.publicDesktopPath,
      this.userStartMenu,
      this.commonStartMenu
    ];

    let allShortcuts = [];
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        allShortcuts = allShortcuts.concat(this.collectLnkFiles(dir));
      }
    }

    this.shortcuts = allShortcuts;
    return this.shortcuts;
  }

  // Get full list of installed apps for UI display
  async getInstalledApps() {
    if (!this.installedApps.length) {
      await this.refreshInstalledApps();
    }
    return this.installedApps.map(a => ({
      name: a.Name,
      appId: a.AppID
    })).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  // Universal Launch Application - Finds and starts almost ANY app on Windows
  async launchApp(appTarget) {
    if (!appTarget || typeof appTarget !== 'string') {
      return { success: false, message: '실행할 앱 이름이 지정되지 않았습니다.' };
    }

    const rawTarget = appTarget.trim();
    const cleanTarget = rawTarget.toLowerCase().replace(/[\s\-_]+/g, '');

    // ---------------------------------------------------------
    // Tier 1: Check Alias Dictionary
    // ---------------------------------------------------------
    for (const [key, item] of Object.entries(this.aliasMap)) {
      const cleanKey = key.toLowerCase().replace(/[\s\-_]+/g, '');
      if (cleanTarget === cleanKey || cleanTarget.includes(cleanKey) || cleanKey.includes(cleanTarget)) {
        if (item.type === 'protocol') {
          await this.runCommand(`start "" "${item.target}"`);
          return { success: true, app: item.name, message: `'${item.name}' 앱을 실행했습니다.` };
        }
        if (item.type === 'url') {
          await this.runCommand(`start "" "${item.url}"`);
          return { success: true, app: item.name, message: `'${item.name}' 웹페이지를 열었습니다.` };
        }
        if (item.type === 'cmd') {
          const cmdToRun = item.cmd.startsWith('start ') ? item.cmd : `start "" "${item.cmd}"`;
          await this.runCommand(cmdToRun);
          return { success: true, app: item.name, message: `'${item.name}' 앱을 실행했습니다.` };
        }
        // If type is 'app', continue with item.name as target
        if (item.name) {
          appTarget = item.name;
          break;
        }
      }
    }

    // Ensure installedApps index is available
    if (!this.installedApps.length) {
      await this.refreshInstalledApps();
    }

    // ---------------------------------------------------------
    // Tier 2: Check Windows StartApps (Get-StartApps)
    // Matches Win32 apps and UWP Store apps registered with Windows
    // ---------------------------------------------------------
    let matchedStartApp = null;

    // 2-a. Exact match
    matchedStartApp = this.installedApps.find(a =>
      a.Name.toLowerCase() === rawTarget.toLowerCase()
    );

    // 2-b. Normalized match (without spaces)
    if (!matchedStartApp) {
      matchedStartApp = this.installedApps.find(a =>
        a.Name.toLowerCase().replace(/[\s\-_]+/g, '') === cleanTarget
      );
    }

    // 2-c. Substring match
    if (!matchedStartApp) {
      matchedStartApp = this.installedApps.find(a => {
        const aClean = a.Name.toLowerCase().replace(/[\s\-_]+/g, '');
        return aClean.includes(cleanTarget) || cleanTarget.includes(aClean);
      });
    }

    if (matchedStartApp) {
      await this.runCommand(`start "" "shell:AppsFolder\\${matchedStartApp.AppID}"`);
      return {
        success: true,
        app: matchedStartApp.Name,
        appId: matchedStartApp.AppID,
        message: `'${matchedStartApp.Name}' 앱을 실행했습니다.`
      };
    }

    // ---------------------------------------------------------
    // Tier 3: Check Desktop & Start Menu Shortcuts (.lnk / .url)
    // ---------------------------------------------------------
    if (!this.shortcuts.length) {
      this.scanShortcuts();
    }

    const matchedShortcut = this.shortcuts.find(s => {
      const cleanShort = s.name.toLowerCase().replace(/[\s\-_]+/g, '');
      return cleanShort === cleanTarget || cleanShort.includes(cleanTarget) || cleanTarget.includes(cleanShort);
    });

    if (matchedShortcut) {
      await this.runCommand(`start "" "${matchedShortcut.fullPath}"`);
      return {
        success: true,
        app: matchedShortcut.name,
        message: `'${matchedShortcut.name}' 바로가기를 실행했습니다.`
      };
    }

    // ---------------------------------------------------------
    // Tier 4: Direct URI Protocol fallback
    // ---------------------------------------------------------
    if (/^[a-z0-9\-_]+$/i.test(rawTarget)) {
      try {
        await this.runCommand(`start ${rawTarget}:`);
        return { success: true, app: rawTarget, message: `'${rawTarget}' 프로토콜을 실행했습니다.` };
      } catch (e) {}
    }

    // ---------------------------------------------------------
    // Tier 5: Generic Windows Start Fallback
    // ---------------------------------------------------------
    try {
      const fallbackRes = await this.runCommand(`start "" "${rawTarget}"`);
      if (fallbackRes.success) {
        return { success: true, app: rawTarget, message: `'${rawTarget}' 명령을 실행했습니다.` };
      }
    } catch (e) {}

    // Refresh index once in case app was just installed
    this.refreshInstalledApps();
    this.scanShortcuts();

    return {
      success: false,
      message: `'${rawTarget}' 앱을 찾지 못했습니다. 앱 이름을 다시 확인해 주십시오.`
    };
  }

  // Open web or search
  async openWeb(type, queryOrUrl) {
    let targetUrl = '';
    const encoded = encodeURIComponent(queryOrUrl || '');

    switch (type) {
      case 'youtube_search':
        targetUrl = `https://www.youtube.com/results?search_query=${encoded}`;
        break;
      case 'google_search':
        targetUrl = `https://www.google.com/search?q=${encoded}`;
        break;
      case 'naver_search':
        targetUrl = `https://search.naver.com/search.naver?query=${encoded}`;
        break;
      case 'url':
      default:
        targetUrl = queryOrUrl.startsWith('http://') || queryOrUrl.startsWith('https://')
          ? queryOrUrl
          : `https://${queryOrUrl}`;
        break;
    }

    await this.runCommand(`start "" "${targetUrl}"`);
    return { success: true, url: targetUrl, message: `웹 브라우저로 열었습니다: ${targetUrl}` };
  }

  // Control volume and media
  async controlVolume(action, amount = 10) {
    let script = '';
    let msg = '';

    switch (action) {
      case 'mute':
      case 'unmute':
      case 'toggle_mute':
        script = `$w = New-Object -ComObject WScript.Shell; $w.SendKeys([char]173)`;
        msg = '음소거 상태를 전환했습니다.';
        break;
      case 'up':
      case 'volume_up':
        const upCount = Math.max(1, Math.min(25, Math.round(amount / 2)));
        script = `$w = New-Object -ComObject WScript.Shell; for($i=0; $i -lt ${upCount}; $i++){ $w.SendKeys([char]175); Start-Sleep -Milliseconds 20 }`;
        msg = '볼륨을 올렸습니다.';
        break;
      case 'down':
      case 'volume_down':
        const downCount = Math.max(1, Math.min(25, Math.round(amount / 2)));
        script = `$w = New-Object -ComObject WScript.Shell; for($i=0; $i -lt ${downCount}; $i++){ $w.SendKeys([char]174); Start-Sleep -Milliseconds 20 }`;
        msg = '볼륨을 낮췄습니다.';
        break;
      case 'play_pause':
        script = `$w = New-Object -ComObject WScript.Shell; $w.SendKeys([char]179)`;
        msg = '미디어 재생/일시정지를 실행했습니다.';
        break;
      case 'next':
        script = `$w = New-Object -ComObject WScript.Shell; $w.SendKeys([char]176)`;
        msg = '다음 곡으로 이동했습니다.';
        break;
      case 'prev':
        script = `$w = New-Object -ComObject WScript.Shell; $w.SendKeys([char]177)`;
        msg = '이전 곡으로 이동했습니다.';
        break;
      default:
        return { success: false, message: '알 수 없는 볼륨 제어 명령입니다.' };
    }

    await this.runPowerShell(script);
    return { success: true, action, message: msg };
  }

  // System actions (lock, screenshot, minimize all, empty recycle bin, power)
  async systemAction(action) {
    switch (action) {
      case 'lock':
      case '화면 잠금':
      case 'lock_screen':
        await this.runCommand('rundll32.exe user32.dll,LockWorkStation');
        return { success: true, message: '화면을 잠갔습니다.' };

      case 'minimize_all':
      case 'show_desktop':
      case '바탕화면 보기':
        await this.runPowerShell('(New-Object -ComObject Shell.Application).MinimizeAll()');
        return { success: true, message: '모든 창을 최소화하고 바탕화면을 표시했습니다.' };

      case 'screenshot':
      case '화면 캡처':
        await this.runCommand('snippingtool.exe');
        return { success: true, message: '화면 캡처 도구를 실행했습니다.' };

      case 'empty_recycle_bin':
      case '휴지통 비우기':
        await this.runPowerShell('Clear-RecycleBin -Force -ErrorAction SilentlyContinue');
        return { success: true, message: '휴지통을 깨끗이 비웠습니다.' };

      case 'shutdown':
      case '컴퓨터 끄기':
        await this.runCommand('shutdown /s /t 60 /c "JARVIS: 60초 후 시스템이 종료됩니다. 취소하려면 \'종료 취소\'라고 명령하세요."');
        return { success: true, message: '60초 후 시스템이 종료됩니다. 취소하려면 [종료 취소]를 실행하세요.' };

      case 'restart':
      case '컴퓨터 재부팅':
        await this.runCommand('shutdown /r /t 60 /c "JARVIS: 60초 후 시스템이 재시작됩니다. 취소하려면 \'종료 취소\'라고 명령하세요."');
        return { success: true, message: '60초 후 시스템이 재부팅됩니다. 취소하려면 [종료 취소]를 실행하세요.' };

      case 'cancel_shutdown':
      case '종료 취소':
        await this.runCommand('shutdown /a');
        return { success: true, message: '예약된 시스템 종료/재부팅을 취소했습니다.' };

      case 'sleep':
      case '절전 모드':
        await this.runCommand('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
        return { success: true, message: '시스템을 절전 모드로 전환했습니다.' };

      default:
        return { success: false, message: `지원되지 않는 시스템 명령입니다: ${action}` };
    }
  }

  // Open directory path
  async openDirectory(folderName) {
    let dir = '';
    const norm = (folderName || '').toLowerCase().trim();

    if (norm.includes('바탕화면') || norm.includes('desktop')) {
      dir = fs.existsSync(this.oneDriveDesktopPath) ? this.oneDriveDesktopPath : this.desktopPath;
    } else if (norm.includes('다운로드') || norm.includes('download')) {
      dir = path.join(os.homedir(), 'Downloads');
    } else if (norm.includes('문서') || norm.includes('document')) {
      dir = path.join(os.homedir(), 'Documents');
    } else if (norm.includes('사진') || norm.includes('picture')) {
      dir = path.join(os.homedir(), 'Pictures');
    } else if (fs.existsSync(folderName)) {
      dir = folderName;
    } else {
      dir = os.homedir();
    }

    await this.runCommand(`explorer.exe "${dir}"`);
    return { success: true, path: dir, message: `'${path.basename(dir)}' 폴더를 열었습니다.` };
  }

  // Terminate process
  async killProcess(processName) {
    if (!processName) return { success: false, message: '종료할 프로세스명이 없습니다.' };
    let proc = processName.trim();
    if (!proc.toLowerCase().endsWith('.exe')) proc += '.exe';

    const res = await this.runCommand(`taskkill /F /IM "${proc}"`);
    if (res.success) {
      return { success: true, process: proc, message: `'${proc}' 프로세스를 종료했습니다.` };
    } else {
      return { success: false, message: `'${proc}' 프로세스를 찾거나 종료하지 못했습니다.` };
    }
  }

  // Get live system status for HUD
  async getSystemStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    const cpus = os.cpus();
    const cpuModel = cpus && cpus[0] ? cpus[0].model.trim() : 'Unknown CPU';
    const cpuCores = cpus ? cpus.length : 1;

    const uptimeSeconds = os.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpuModel,
      cpuCores,
      totalMemMB: Math.round(totalMem / (1024 * 1024)),
      freeMemMB: Math.round(freeMem / (1024 * 1024)),
      usedMemMB: Math.round(usedMem / (1024 * 1024)),
      memPercent,
      uptimeFormatted: `${hours}시간 ${minutes}분`
    };
  }

  // Trigger Windows 11 Voice Typing (Win + H)
  async triggerVoiceTyping() {
    const scriptPath = path.join(__dirname, 'trigger-voice.ps1');
    if (fs.existsSync(scriptPath)) {
      await this.runPowerShell(`& '${scriptPath}'`);
      return { success: true, message: 'Windows 음성 인식을 활성화했습니다. (Win + H)' };
    }
    return { success: false, message: '음성 스크립트를 찾지 못했습니다.' };
  }
}

module.exports = new SystemController();

