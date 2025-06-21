import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  user: 'user-a' | 'user-b' | 'judge' | 'system';
  name: string;
  text: string;
  timestamp: string;
  roomId?: string;
}

export async function POST(request: Request) {
  try {
    // //console.log('Judge API called');
    
    const { messages } = await request.json();
    // //console.log('Messages:', messages);
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    // //console.log('API Key exists:', !!apiKey);
    
    if (!apiKey) {
      throw new Error('API key not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Analyze conversation for context
    // Analyze conversation for context
    const emotionalTone = analyzeEmotionalTone(messages);
    const conversationContext = buildConversationContext(messages);
    const judgmentLevel = determineJudgmentLevel(emotionalTone, conversationContext);
    
    // Build context-aware prompt based on conflict severity
    const judgePersona = getJudgePersona(judgmentLevel);
    const conversationAnalysis = performConversationAnalysis(messages);
    
    const conversationHistory = messages
      .map((msg: any) => `${msg.name}: ${msg.text}`)
      .join('\n');
    
    const prompt = `
    역할: ${judgePersona.title}
    전문분야: ${judgePersona.expertise}
    
    현재 상황 분석:
    - 갈등 레벨: ${judgmentLevel} (1-5)
    - 감정 온도: ${emotionalTone.temperature}도
    - 논리 결함 탐지: ${conversationAnalysis.logicalFallacies.join(', ') || '없음'}
    - 주요 쟁점: ${conversationContext.mainIssue || '미파악'}
    - 감정 상태: ${emotionalTone.dominantEmotion}
    
    판사의 전략적 접근:
    
    1. 갈등의 근본 원인 파악:
       - 감정적 요인 VS 논리적 요인
       - 숨겨진 진짜 문제 찾기
    
    2. 논리적 허점 지적:
       - 억측과 사실의 구분
       - 감정적 호소 vs 근거 있는 주장
       - 순환논법, 거짓 딜레마 등 논리적 오류 적발
    
    3. 공정한 중재 전략:
       - 양쪽 주장의 타당성 평가
       - 상황에 따른 맞춤형 해결책 제시
       - 감정이 아닌 증거 기반 판단
    
    4. 실용적 조언:
       - 당장 해야 할 일
       - 장기적 관계 개선 방법
       - 재발 방지 가이드
    
    대화 내용:
    ${conversationHistory}
    
    [판결 형식]
    "야 판사야! 여러분 진정 좀 하시구요."
    
    상황 요약: [1줄 요약]
    
    분석 결과:
    • 논리성 평가: ${emotionalTone.score}점/100점
    • 증거 강도: ${conversationAnalysis.evidenceStrength}%
    • 감정 컨트롤: ${100-emotionalTone.score}%
    
    판결:
    ${judgePersona.style}으로 개입하여 팩트폭격식으로 정리해줘
    
    조언: 구체적이고 실행 가능한 솔루션 제시
    
    [마무리 멘트 - 상황에 맞는 유머러스한 표현 추가]
    `;
    
    // Gemini API 호출
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error in judge API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}

function buildConversationContext(messages: Message[]) {
  let mainIssue = '';
  let complexity = '단순';
  
  // 메시지 길이에 따른 복잡성 판단
  if (messages.length > 10) complexity = '복잡';
  
  // 주요 쟁점 파악 (처음 주고받은 메시지에서 주로 나타남)
  if (messages.length >= 2) {
    const firstUserMsg = messages.find(m => m.user === 'user-a')?.text || '';
    const firstWords = firstUserMsg.split(' ').slice(0, 5).join(' ');
    mainIssue = firstWords.length > 0 ? `${firstWords}...` : '대화 초기 단계';
  }
  
  return {
    mainIssue,
    complexity,
    messageCount: messages.length
  };
}


function determineJudgmentLevel(emotionalTone: any, context: any): number {
  let level = 1;
  
  // 감정 강도에 따른 레벨 증가
  if (emotionalTone.score > 10) level += 2;
  else if (emotionalTone.score > 5) level += 1;
  
  // 갈등의 복잡성에 따른 레벨 증가
  if (context.complexity === '복잡') level += 1;
  
  // 주요 쟁점이 있는 경우 레벨 증가
  if (context.mainIssue) level += 1;
  
  return Math.min(level, 5); // 최대 레벨 5
}

function getJudgePersona(level: number) {
  const personas = [
    {
      title: '신입 판사 훈련생', 
      expertise: '일상적 갈등 중재', 
      style: '친근한 디시인사이드 말투'
    },
    {
      title: '지방법원 판사', 
      expertise: '가벼운 부부갈등', 
      style: '중간 톤의 방송 말투'
    },
    {
      title: '베테랑 판사', 
      expertise: '복합적 관계 갈등', 
      style: '전문적이면서 재치있는 방송 스타일'
    },
    {
      title: '고등법원 판사', 
      expertise: '심각한 관계 위기', 
      style: '카리스마 있는 디시 식당 말투'
    },
    {
      title: '대법원장급 갈등 전문가', 
      expertise: '위기 상황 전문 중재', 
      style: '사이다 발언 메이커'
    }
  ];
  
  return personas[level - 1] || personas[4];
}

function performConversationAnalysis(messages: Message[]) {
  const logicalFallacies: string[] = [];
  let evidenceCount = 0;
  let emotionCount = 0;
  let totalMessages = messages.length;
  
  messages.forEach(msg => {
    // 논리적 오류 탐지
    if (msg.text.match(/무조건|항상|절대/)) logicalFallacies.push('일반화의 오류');
    if (msg.text.match(/너[만만]|난 안 그래/)) logicalFallacies.push('인신공격');
    if (msg.text.match(/그럼 니가|너도/)) logicalFallacies.push('상대 비하');
    
    // 증거 vs 감정 카운트
    if (msg.text.match(/보니까|했었어|증거는/)) evidenceCount++;
    if (msg.text.match(/화나|짜증|속상|억울/)) emotionCount++;
  });
  
  const evidenceStrength = totalMessages ? (evidenceCount / totalMessages) * 100 : 0;
  
  return {
    logicalFallacies: Array.from(new Set(logicalFallacies)),
    evidenceStrength,
    emotionRatio: totalMessages ? (emotionCount / totalMessages) * 100 : 0
  };
}

// 개선된 emotionalTone 함수
function analyzeEmotionalTone(messages: Message[]) {
  let intensity = 0;
  let level = '평화로운';
  const emotions = {
    '화남': 0,
    '슬픔': 0,
    '짜증': 0,
    '분노': 0,
    '좌절': 0
  };
  
  messages.forEach(msg => {
    if (msg.text.includes('!') || msg.text.includes('?')) intensity += 1;
    if (msg.text.match(/[까지암말이새]/)) intensity += 2;
    if (msg.text.match(/[진짜에진쌩]/)) intensity += 3;
    
    // 감정 분석
    if (msg.text.match(/화[나나]/)) emotions['화남']++;
    if (msg.text.match(/짜증/)) emotions['짜증']++;
    if (msg.text.match(/슬[프퍼]/)) emotions['슬픔']++; 
    if (msg.text.match(/분[노하]/)) emotions['분노']++;
    if (msg.text.match(/좌절/)) emotions['좌절']++;
  });
  
  // 레벨 설정
  if (intensity > 10) level = '감정 폭발';
  else if (intensity > 5) level = '긴장 상태';
  else if (intensity > 2) level = '약간 개입 필요';
  
  // 주요 감정 찾기
  const dominantEmotion = Object.entries(emotions)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  return {
    intensity: level,
    score: intensity,
    level: level,
    temperature: intensity * 10,
    dominantEmotion,
    emotions
  };
}
