const { matchOfflineIntent } = require('./offline-intent');
const researchService = require('./research-service');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemma-4-31b-it:free';

class AIService {
  constructor(apiKey = '', model = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
    this.conversationHistory = [];
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
  }

  setModel(model) {
    this.model = (model || DEFAULT_MODEL).trim();
  }

  getSystemPrompt() {
    return `당신은 아이언맨 토니 스타크의 최첨단 개인 인공지능 비서 J.A.R.V.I.S. (자비스)입니다.
사용자를 '보스'라고 부르며 정중하고 품격 있으며 지적인 어조로 답변합니다.

당신은 Windows 11 PC에 설치된 '거의 모든 앱'을 직접 실행하고, 웹 자료 조사 및 시스템을 총괄 제어할 수 있는 권한을 가지고 있습니다.
사용자의 명령을 분석한 후, 반드시 아래의 유효한 단일 JSON 객체 하나만 출력하십시오. 설명 문장이나 인사말을 JSON 바깥에 붙이지 마십시오.

JSON 구조:
{
  "thought": "사용자의 요청 분석 및 PC 제어/자료조사 계획",
  "action": "launch_app | research_topic | open_web | system_volume | system_control | open_folder | execute_command | reply",
  "parameters": { ... },
  "speech": "사용자에게 음성(TTS)으로 말할 짧고 품격 있는 한국어 문장 (예: '네 보스, 스팀을 실행하겠습니다.', '인공지능에 대한 조사를 시작합니다.')"
}

사용 가능한 액션 및 파라미터 규격:
1. launch_app:
   - PC에 설치된 거의 모든 앱(Win32, Store 앱, 게임, 브라우저, 메신저 등)을 실행할 수 있습니다.
   - parameters: { "app": "앱이름 (예: 메모장, 계산기, 크롬, 엣지, 웨일, 브레이브, 그림판, 작업관리자, 탐색기, vscode, 디스코드, 카카오톡, 스포티파이, 로블록스, 마인크래프트, 스팀, 엑셀, 워드, 파워포인트, 한글, 옵시디언, obs, 파일질라, 설정 등)" }
2. research_topic:
   - 자료 조사, 인물/기술/정보 분석, 웹 리서치 요청 시 사용합니다.
   - parameters: { "query": "조사할 주제 또는 질문 내용" }
   - speech: "보스, [주제]에 대한 심층 조사를 수행하겠습니다."
3. open_web:
   - parameters: { "type": "url" | "youtube_search" | "google_search" | "naver_search", "query": "검색어 또는 URL" }
4. system_volume:
   - parameters: { "action": "up" | "down" | "mute" | "toggle_mute" | "play_pause" | "next" | "prev", "amount": 10 }
5. system_control:
   - parameters: { "action": "lock" | "minimize_all" | "screenshot" | "empty_recycle_bin" | "shutdown" | "restart" | "cancel_shutdown" | "sleep" }
6. open_folder:
   - parameters: { "folder": "바탕화면" | "다운로드" | "문서" | "사진" | "경로" }
7. execute_command:
   - parameters: { "command": "Windows 실행 명령" }
8. reply:
   - 일반 대화, 인사 등 PC 조작이나 심층 조사가 불필요한 경우. parameters는 {}. speech에 친절하고 품격 있는 답변 작성.

반드시 유효한 JSON 형식으로만 응답해야 합니다.`;
  }

  // Parse JSON response safely from LLM output
  parseResponse(content) {
    if (!content) return null;

    // 1. Try direct JSON parse
    try {
      return JSON.parse(content.trim());
    } catch (e) {}

    // 2. Extract from markdown code blocks
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {}
    }

    // 3. Search for first { and last }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(content.substring(firstBrace, lastBrace + 1));
      } catch (e) {}
    }

    // Fallback: treat entire string as conversational reply
    return {
      thought: '비구조화된 텍스트 응답',
      action: 'reply',
      parameters: {},
      speech: content.replace(/```[a-z]*\n?/g, '').trim()
    };
  }

  async processUserMessage(userText) {
    const text = (userText || '').trim();
    if (!text) {
      return {
        success: false,
        source: 'local',
        action: 'reply',
        parameters: {},
        speech: '보스, 무엇을 도와드릴까요?'
      };
    }

    // 1. Check local offline intent first for instant zero-latency response
    const offline = matchOfflineIntent(text);
    if (offline) {
      // If it's a research topic in offline intent, run the research service!
      if (offline.action === 'research_topic') {
        const researchData = await researchService.conductResearch(
          offline.parameters.query,
          this.apiKey,
          this.model
        );
        return {
          success: true,
          source: 'offline_intent_research',
          action: 'research_topic',
          parameters: offline.parameters,
          researchReport: researchData.report,
          thought: offline.thought,
          speech: (researchData.report && researchData.report.speech) || offline.speech
        };
      }

      // For app launching, volume, system control, folders, return immediate action
      return {
        success: true,
        source: 'offline_intent',
        ...offline
      };
    }

    // 2. If no API key provided and no offline match, prompt user
    if (!this.apiKey) {
      return {
        success: true,
        source: 'offline_notice',
        action: 'reply',
        parameters: {},
        thought: 'OpenRouter API 키 미등록 상태',
        speech: '보스, OpenRouter API 키가 설정되지 않아 기본 PC 제어 명령어만 작동 중입니다. 설정에서 API 키를 입력하시면 Gemma 4 31B AI와 자유로운 대화 및 복합 명령이 가능합니다.'
      };
    }

    // 3. Call OpenRouter API with Gemma 4 31B Free
    try {
      const messages = [
        { role: 'system', content: this.getSystemPrompt() },
        ...this.conversationHistory.slice(-6),
        { role: 'user', content: text }
      ];

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://jarvis-desktop.local',
          'X-Title': 'JARVIS Desktop AI Assistant',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model || DEFAULT_MODEL,
          messages,
          temperature: 0.25,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenRouter API Error:', response.status, errorData);

        // Fallback to offline matcher on API error
        const offlineFallback = matchOfflineIntent(text);
        if (offlineFallback) {
          if (offlineFallback.action === 'research_topic') {
            const researchData = await researchService.conductResearch(offlineFallback.parameters.query, '', this.model);
            return {
              success: true,
              source: 'offline_fallback_research',
              action: 'research_topic',
              parameters: offlineFallback.parameters,
              researchReport: researchData.report,
              speech: (researchData.report && researchData.report.speech) || offlineFallback.speech
            };
          }
          return {
            success: true,
            source: 'offline_fallback',
            ...offlineFallback,
            note: `AI 통신 지연으로 오프라인 제어 엔진으로 즉시 실행했습니다.`
          };
        }

        return {
          success: false,
          source: 'api_error',
          action: 'reply',
          parameters: {},
          thought: `OpenRouter API 응답 코드: ${response.status}`,
          speech: `죄송합니다 보스. AI 서버 통신 중 오류(${response.status})가 발생했습니다. 잠시 후 다시 시도해 주세요.`
        };
      }

      const data = await response.json();
      const content = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '';

      const parsed = this.parseResponse(content);

      // If AI determined research_topic action, conduct research!
      if (parsed.action === 'research_topic') {
        const queryTopic = parsed.parameters?.query || text;
        const researchData = await researchService.conductResearch(
          queryTopic,
          this.apiKey,
          this.model
        );
        parsed.researchReport = researchData.report;
        if (researchData.report && researchData.report.speech) {
          parsed.speech = researchData.report.speech;
        }
      }

      // Keep recent context in history
      this.conversationHistory.push({ role: 'user', content: text });
      this.conversationHistory.push({ role: 'assistant', content: JSON.stringify(parsed) });
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return {
        success: true,
        source: 'openrouter',
        model: this.model,
        ...parsed
      };
    } catch (err) {
      console.error('Fetch exception:', err);
      // Fallback on network failure
      const offline = matchOfflineIntent(text);
      if (offline) {
        if (offline.action === 'research_topic') {
          const researchData = await researchService.conductResearch(offline.parameters.query, '', this.model);
          return {
            success: true,
            source: 'offline_fallback_research',
            action: 'research_topic',
            parameters: offline.parameters,
            researchReport: researchData.report,
            speech: (researchData.report && researchData.report.speech) || offline.speech
          };
        }
        return {
          success: true,
          source: 'offline_fallback',
          ...offline,
          note: '네트워크 연결 불안정으로 오프라인 엔진으로 실행했습니다.'
        };
      }

      return {
        success: false,
        source: 'network_error',
        action: 'reply',
        parameters: {},
        speech: '보스, 네트워크 연결을 확인해 주십시오.'
      };
    }
  }
}

module.exports = { AIService, DEFAULT_MODEL };
