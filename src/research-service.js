// =========================================================
// J.A.R.V.I.S. Deep Research & Intelligence Gathering Engine
// =========================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemma-4-31b-it:free';

class ResearchService {
  /**
   * Fetch Wikipedia summary and related pages for a query
   */
  async fetchWikipediaData(query) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return null;

    try {
      // 1. Search Wikipedia (Korean first)
      const searchUrl = `https://ko.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=4&namespace=0&format=json`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'JarvisAssistant/1.0 (Windows PC Assistant)' }
      });

      if (!searchRes.ok) return null;
      const searchData = await searchRes.json();
      const titles = searchData[1] || [];
      const links = searchData[3] || [];

      if (!titles.length) {
        // Fallback to English Wikipedia if no Korean result
        const enSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=3&namespace=0&format=json`;
        const enRes = await fetch(enSearchUrl, {
          headers: { 'User-Agent': 'JarvisAssistant/1.0 (Windows PC Assistant)' }
        });
        if (!enRes.ok) return null;
        const enData = await enRes.json();
        const enTitles = enData[1] || [];
        const enLinks = enData[3] || [];
        if (!enTitles.length) return null;

        const mainTitle = enTitles[0];
        const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(mainTitle)}`;
        const sumRes = await fetch(sumUrl);
        if (!sumRes.ok) return null;
        const sumData = await sumRes.json();

        return {
          lang: 'en',
          title: sumData.title,
          description: sumData.description || '',
          extract: sumData.extract || '',
          url: sumData.content_urls?.desktop?.page || enLinks[0] || `https://en.wikipedia.org/wiki/${encodeURIComponent(mainTitle)}`,
          related: enTitles.slice(1).map((t, i) => ({ title: t, url: enLinks[i + 1] }))
        };
      }

      // Fetch summary for top Korean result
      const mainTitle = titles[0];
      const sumUrl = `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(mainTitle)}`;
      const sumRes = await fetch(sumUrl);

      if (!sumRes.ok) {
        return {
          lang: 'ko',
          title: mainTitle,
          description: '',
          extract: '',
          url: links[0] || `https://ko.wikipedia.org/wiki/${encodeURIComponent(mainTitle)}`,
          related: titles.slice(1).map((t, i) => ({ title: t, url: links[i + 1] }))
        };
      }

      const sumData = await sumRes.json();
      return {
        lang: 'ko',
        title: sumData.title,
        description: sumData.description || '',
        extract: sumData.extract || '',
        url: sumData.content_urls?.desktop?.page || links[0] || `https://ko.wikipedia.org/wiki/${encodeURIComponent(mainTitle)}`,
        related: titles.slice(1).map((t, i) => ({ title: t, url: links[i + 1] }))
      };
    } catch (e) {
      console.warn('Wikipedia fetch warning:', e.message);
      return null;
    }
  }

  /**
   * Main Research Function
   * Gathers data and synthesizes an intelligence report using Gemma 4 31B
   */
  async conductResearch(topicQuery, apiKey = '', model = DEFAULT_MODEL) {
    const query = (topicQuery || '').trim();
    if (!query) {
      return {
        success: false,
        message: '조사할 주제가 입력되지 않았습니다.'
      };
    }

    // 1. Gather factual knowledge from Wikipedia
    const wikiData = await this.fetchWikipediaData(query);

    // 2. Prepare Context for Gemma 4 31B AI Synthesis
    const factContext = wikiData && wikiData.extract
      ? `[백과사전/위키 지식 데이터베이스]
제목: ${wikiData.title}
설명: ${wikiData.description || '없음'}
주요 내용:
${wikiData.extract}`
      : `[참고: 검색 주제 '${query}'에 대한 위키 요약이 없으므로 모델의 자체 지식베이스를 바탕으로 정확하고 상세한 브리핑을 작성하십시오.]`;

    // 3. If API Key is present, call Gemma 4 31B for professional synthesis
    if (apiKey) {
      try {
        const systemPrompt = `당신은 아이언맨 토니 스타크의 최첨단 AI 비서 J.A.R.V.I.S. (자비스)의 데이터 리서치 & 브리핑 전담 분석 모듈입니다.
사용자('보스')가 요청한 주제에 대해 수집된 자료와 전문 지식을 종합하여, 정밀하고 품격 있는 최고급 인텔리전스 보고서를 작성하십시오.

반드시 아래의 단일 유효한 JSON 객체로만 응답하십시오. (마크다운 백틱 포함 가능하나 JSON 구조 준수)
{
  "topic": "${query}",
  "speech": "보스에게 음성으로 브리핑할 1~2문장의 핵심 요약 (예: '보스, 요청하신 인공지능에 대한 조사를 마쳤습니다. 현재 초거대 언어모델과 생성형 AI 기술을 중심으로 전 산업에서 급격한 혁신이 진행 중입니다.')",
  "summary": "주제에 대한 핵심 정의 및 개요 (3~4줄)",
  "keyPoints": [
    "핵심 주요 사실 또는 특징 1",
    "핵심 주요 사실 또는 특징 2",
    "핵심 주요 사실 또는 특징 3",
    "핵심 주요 사실 또는 특징 4"
  ],
  "details": "배경 역사, 발전 현황, 기술적/사회적 영향 등 상세 분석 내용 (단락별 명확히 서술)",
  "sources": [
    { "title": "출처명", "url": "관련 웹 URL" }
  ]
}`;

        const userPrompt = `다음 주제에 대해 정밀 자료 조사를 수행하고 인텔리전스 보고서 JSON을 작성하십시오:
조사 요청 주제: "${query}"

수집된 원천 자료:
${factContext}`;

        const res = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://jarvis-desktop.local',
            'X-Title': 'JARVIS Desktop Research Engine',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model || DEFAULT_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.25,
            max_tokens: 1200
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message.content
            : '';

          const parsed = this.parseJsonReport(content);
          if (parsed) {
            // Attach web search links if not present
            if (!parsed.sources || !parsed.sources.length) {
              parsed.sources = [];
              if (wikiData && wikiData.url) {
                parsed.sources.push({ title: `위키백과: ${wikiData.title}`, url: wikiData.url });
              }
              parsed.sources.push({
                title: '네이버 검색 결과',
                url: `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`
              });
              parsed.sources.push({
                title: '구글 검색 결과',
                url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
              });
            }

            return {
              success: true,
              source: 'ai_synthesis',
              model: model || DEFAULT_MODEL,
              report: parsed
            };
          }
        }
      } catch (err) {
        console.warn('AI research call failed, falling back to local compilation:', err.message);
      }
    }

    // 4. Fallback: Local Structured Report from gathered facts
    const fallbackReport = {
      topic: query,
      speech: wikiData && wikiData.extract
        ? `보스, '${wikiData.title}'에 대한 자료 조사를 마쳤습니다. ${wikiData.description || '상세 브리핑 보고서를 화면에 표시합니다.'}`
        : `보스, '${query}'에 관한 자료 조사를 완료했습니다. 웹 검색 결과와 브리핑을 준비했습니다.`,
      summary: wikiData && wikiData.extract
        ? wikiData.extract
        : `'${query}'에 관한 검색 및 관련 지식 데이터입니다. 상세 웹 검색과 연동하여 확인하실 수 있습니다.`,
      keyPoints: [
        wikiData && wikiData.description ? `개요: ${wikiData.description}` : `주제: ${query}`,
        `검색 키워드: ${query}`,
        wikiData && wikiData.related && wikiData.related.length
          ? `관련 항목: ${wikiData.related.map(r => r.title).join(', ')}`
          : '다양한 포털 및 백과사전 지식베이스 연동',
        '상세 웹 문서 및 백과사전 원문 조회가 가능합니다.'
      ],
      details: wikiData && wikiData.extract
        ? `${wikiData.extract}\n\n추가적인 최신 정보 및 심층 분석은 아래 제공된 출처 링크를 통해 브라우저에서 바로 확인하실 수 있습니다.`
        : `'${query}'에 대한 포괄적인 자료 조사를 위해 구글 및 네이버 검색 바로가기를 함께 제공합니다.`,
      sources: [
        ...(wikiData && wikiData.url ? [{ title: `위키백과 (${wikiData.title})`, url: wikiData.url }] : []),
        { title: `구글에서 '${query}' 상세 검색`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}` },
        { title: `네이버에서 '${query}' 통합 검색`, url: `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}` }
      ]
    };

    return {
      success: true,
      source: 'wiki_local',
      report: fallbackReport
    };
  }

  parseJsonReport(content) {
    if (!content) return null;
    try {
      return JSON.parse(content.trim());
    } catch (e) {}

    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {}
    }

    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(content.substring(firstBrace, lastBrace + 1));
      } catch (e) {}
    }

    return null;
  }
}

module.exports = new ResearchService();
