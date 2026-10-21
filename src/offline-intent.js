// =========================================================
// High-Speed Korean Natural Language Intent Engine for JARVIS
// Matches speech and text commands to PC actions with offline resilience
// =========================================================

function matchOfflineIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const raw = text.trim();
  const lower = raw.toLowerCase().replace(/\s+/g, ' ');

  // -------------------------------------------------------
  // 1. Research & Data Collection Intents (자료 조사)
  // -------------------------------------------------------
  const researchMatch = raw.match(/(?:자료\s*조사|조사\s*해줘|조사해|알아봐줘|알아봐|정보\s*찾아줘|리서치|브리핑\s*해줘|에\s*대해\s*조사|에\s*대해\s*알려줘)/i);
  if (researchMatch) {
    let cleanTopic = raw
      .replace(/(?:에\s*대해\s*자료\s*조사해줘|에\s*대해\s*자료\s*조사|에\s*대해\s*조사해줘|에\s*대해\s*조사|에\s*대해\s*알려줘|에\s*대해\s*알아봐줘)/gi, '')
      .replace(/(?:자료\s*조사해줘|자료\s*조사|조사해줘|조사해|알아봐줘|알아봐|정보\s*찾아줘|리서치해줘|리서치|브리핑해줘)/gi, '')
      .replace(/^(자비스|jarvis)[,\s]*/i, '')
      .replace(/(좀|을|를|에\s*대해|대해)$/g, '')
      .trim();

    if (!cleanTopic) cleanTopic = raw;

    return {
      action: 'research_topic',
      parameters: { query: cleanTopic },
      speech: `네 보스, '${cleanTopic}'에 대한 심층 자료 조사를 즉시 시작합니다.`,
      thought: `오프라인 매처: 자료 조사 [${cleanTopic}]`
    };
  }

  // -------------------------------------------------------
  // 2. Web Search & Video Intents
  // -------------------------------------------------------
  // "유튜브에서 ~ 검색/틀어줘"
  const ytSearchMatch = lower.match(/유튜브(?:에서|로)?\s*(.+?)(?:\s*검색|\s*찾아|\s*틀어|\s*플레이)/i);
  if (ytSearchMatch && ytSearchMatch[1]) {
    const q = ytSearchMatch[1].trim();
    return {
      action: 'open_web',
      parameters: { type: 'youtube_search', query: q },
      speech: `유튜브에서 '${q}'을(를) 검색합니다.`,
      thought: `오프라인 매처: 유튜브 검색 [${q}]`
    };
  }

  if (/(유튜브|youtube)/i.test(lower) && /(켜|열|실행|가자)/i.test(lower)) {
    return {
      action: 'open_web',
      parameters: { type: 'url', query: 'https://www.youtube.com' },
      speech: '유튜브 메인 페이지를 엽니다.',
      thought: '오프라인 매처: 유튜브 열기'
    };
  }

  // "구글에서 ~ 검색"
  const googleSearchMatch = lower.match(/구글(?:에서|로)?\s*(.+?)(?:\s*검색|\s*찾아)/i);
  if (googleSearchMatch && googleSearchMatch[1]) {
    const q = googleSearchMatch[1].trim();
    return {
      action: 'open_web',
      parameters: { type: 'google_search', query: q },
      speech: `구글에서 '${q}'을(를) 검색합니다.`,
      thought: `오프라인 매처: 구글 검색 [${q}]`
    };
  }

  // "네이버에서 ~ 검색"
  const naverSearchMatch = lower.match(/네이버(?:에서|로)?\s*(.+?)(?:\s*검색|\s*찾아)/i);
  if (naverSearchMatch && naverSearchMatch[1]) {
    const q = naverSearchMatch[1].trim();
    return {
      action: 'open_web',
      parameters: { type: 'naver_search', query: q },
      speech: `네이버에서 '${q}'을(를) 검색합니다.`,
      thought: `오프라인 매처: 네이버 검색 [${q}]`
    };
  }

  // -------------------------------------------------------
  // 3. Volume and Media Intents
  // -------------------------------------------------------
  if (/(음소거 해제|소리 켜|음소거 풀어)/i.test(lower)) {
    return {
      action: 'system_volume',
      parameters: { action: 'toggle_mute' },
      speech: '음소거를 해제했습니다.',
      thought: '오프라인 매처: 음소거 해제'
    };
  }
  if (/(음소거|소리 꺼|mute)/i.test(lower)) {
    return {
      action: 'system_volume',
      parameters: { action: 'toggle_mute' },
      speech: '시스템 소리를 음소거했습니다.',
      thought: '오프라인 매처: 음소거'
    };
  }
  if (/(볼륨 올려|소리 키워|볼륨 업|volume up|소리 올려)/i.test(lower)) {
    return {
      action: 'system_volume',
      parameters: { action: 'up', amount: 10 },
      speech: '볼륨을 올렸습니다, 보스.',
      thought: '오프라인 매처: 볼륨 상승'
    };
  }
  if (/(볼륨 내려|소리 줄여|볼륨 다운|volume down|소리 낮춰)/i.test(lower)) {
    return {
      action: 'system_volume',
      parameters: { action: 'down', amount: 10 },
      speech: '볼륨을 낮췄습니다.',
      thought: '오프라인 매처: 볼륨 감소'
    };
  }
  if (/(다음 곡|다음 노래|다음 트랙|next track)/i.test(lower)) {
    return {
      action: 'system_volume',
      parameters: { action: 'next' },
      speech: '다음 곡으로 이동합니다.',
      thought: '오프라인 매처: 미디어 다음 곡'
    };
  }
  if (/(이전 곡|이전 노래|이전 트랙|prev track)/i.test(lower)) {
    return {
      action: 'system_volume',
      parameters: { action: 'prev' },
      speech: '이전 곡으로 이동합니다.',
      thought: '오프라인 매처: 미디어 이전 곡'
    };
  }
  if (/(음악 멈춰|음악 정지|재생 멈춰|일시정지|pause|play)/i.test(lower)) {
    return {
      action: 'system_volume',
      parameters: { action: 'play_pause' },
      speech: '미디어 재생을 토글했습니다.',
      thought: '오프라인 매처: 미디어 재생/일시정지'
    };
  }

  // -------------------------------------------------------
  // 4. System Control Intents
  // -------------------------------------------------------
  if (/(화면 잠금|pc 잠금|컴퓨터 잠궈|잠금|lock)/i.test(lower)) {
    return {
      action: 'system_control',
      parameters: { action: 'lock' },
      speech: '보안을 위해 화면을 잠급니다.',
      thought: '오프라인 매처: 화면 잠금'
    };
  }
  if (/(바탕화면 보기|바탕 화면|창 다 닫아|창 최소화|모든 창 최소화)/i.test(lower)) {
    return {
      action: 'system_control',
      parameters: { action: 'minimize_all' },
      speech: '모든 창을 최소화하고 바탕화면을 표시합니다.',
      thought: '오프라인 매처: 바탕화면 보기'
    };
  }
  if (/(휴지통 비워|휴지통 청소|휴지통 비우기)/i.test(lower)) {
    return {
      action: 'system_control',
      parameters: { action: 'empty_recycle_bin' },
      speech: '휴지통을 깨끗이 비웠습니다.',
      thought: '오프라인 매처: 휴지통 비우기'
    };
  }
  if (/(절전 모드|컴퓨터 재워|재워줘)/i.test(lower)) {
    return {
      action: 'system_control',
      parameters: { action: 'sleep' },
      speech: '절전 모드로 전환합니다.',
      thought: '오프라인 매처: 절전 모드'
    };
  }
  if (/(종료 취소|끄지 마|취소해|취소)/i.test(lower)) {
    return {
      action: 'system_control',
      parameters: { action: 'cancel_shutdown' },
      speech: '시스템 종료 예약을 취소했습니다.',
      thought: '오프라인 매처: 종료 취소'
    };
  }
  if (/(컴퓨터 꺼|컴퓨터 종료|시스템 종료|pc 꺼)/i.test(lower)) {
    return {
      action: 'system_control',
      parameters: { action: 'shutdown' },
      speech: '60초 후 컴퓨터가 종료됩니다. 취소하시려면 [종료 취소]라고 말씀해 주세요.',
      thought: '오프라인 매처: 컴퓨터 종료'
    };
  }
  if (/(컴퓨터 재부팅|다시 시작|재부팅|reboot)/i.test(lower)) {
    return {
      action: 'system_control',
      parameters: { action: 'restart' },
      speech: '60초 후 컴퓨터가 재부팅됩니다.',
      thought: '오프라인 매처: 컴퓨터 재부팅'
    };
  }

  // -------------------------------------------------------
  // 5. Folders
  // -------------------------------------------------------
  if (/(다운로드 폴더|다운로드 열어)/i.test(lower)) {
    return {
      action: 'open_folder',
      parameters: { folder: '다운로드' },
      speech: '다운로드 폴더를 엽니다.',
      thought: '오프라인 매처: 다운로드 폴더'
    };
  }
  if (/(바탕화면 폴더|바탕화면 열어)/i.test(lower)) {
    return {
      action: 'open_folder',
      parameters: { folder: '바탕화면' },
      speech: '바탕화면 폴더를 엽니다.',
      thought: '오프라인 매처: 바탕화면 폴더'
    };
  }

  // -------------------------------------------------------
  // 6. Universal App Launching (거의 모든 앱 실행 지원)
  // -------------------------------------------------------
  // Pattern A: "~ 켜줘", "~ 열어줘", "~ 실행해줘", "~ 띄워줘", "~ 시작해줘"
  const universalLaunchMatch = raw.match(/^(.+?)(?:좀|을|를|이|가)?\s*(?:켜줘|열어줘|실행해줘|틀어줘|띄워줘|시작해줘|켜봐|열어봐|실행|열어|켜|open|start|launch)\s*$/i);
  if (universalLaunchMatch && universalLaunchMatch[1]) {
    let appCandidate = universalLaunchMatch[1]
      .replace(/^(자비스|jarvis)[,\s]*/i, '')
      .replace(/(앱|프로그램|소프트웨어)$/g, '')
      .trim();

    if (appCandidate && appCandidate.length >= 1) {
      return {
        action: 'launch_app',
        parameters: { app: appCandidate },
        speech: `네 보스, '${appCandidate}' 앱을 실행합니다.`,
        thought: `오프라인 매처: 범용 앱 실행 [${appCandidate}]`
      };
    }
  }

  // Pattern B: Direct App Names (계산기, 메모장, 크롬 등 단독 입력)
  const commonApps = [
    '메모장', '계산기', '크롬', '엣지', '웨일', '브레이브', '그림판',
    '작업관리자', '작업 관리자', '탐색기', '파일 탐색기', 'vscode', 'vs code',
    '디스코드', '카카오톡', '카톡', '스포티파이', '로블록스', '마인크래프트',
    '스팀', '엑셀', '워드', '파워포인트', '한글', '옵시디언', '파일질라',
    'obs', 'obs 스튜디오', '캡처도구', '캡처 도구', '설정', '제어판'
  ];

  for (const app of commonApps) {
    if (lower === app.toLowerCase()) {
      return {
        action: 'launch_app',
        parameters: { app },
        speech: `네 보스, ${app} 앱을 실행합니다.`,
        thought: `오프라인 매처: 단독 앱 키워드 [${app}]`
      };
    }
  }

  // -------------------------------------------------------
  // 7. Generic Greetings / Status
  // -------------------------------------------------------
  if (/(안녕|하이|반가워|자비스|누구니|자기소개)/i.test(lower)) {
    return {
      action: 'reply',
      parameters: {},
      speech: '안녕하세요 보스, 자비스입니다. PC의 모든 앱 실행, 심층 자료 조사, 볼륨 및 시스템 제어 등 무엇이든 말씀하십시오.',
      thought: '오프라인 매처: 기본 인사말'
    };
  }

  return null;
}

module.exports = { matchOfflineIntent };
