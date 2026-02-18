import { GoogleGenerativeAI } from "@google/generative-ai";

// API 키 및 초기화
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ==================== 타입 정의 ====================

export interface Message {
  user: string;
  name?: string;
  text: string;
  timestamp?: string;
  userId?: string;
  roomId?: string;
  messageIndex?: number;
  originalMessage?: string;
  isFinalArgument?: boolean;
  messageType?: 'evidence' | 'objection' | 'support' | 'general' | 'final_argument';
  targetMessageIndex?: number;
  replyToUser?: string;
  replyToMessage?: string;
  file?: {
    name: string;
    data: string;
    type: string;
  };
}

export type InterventionType = 'issue' | 'warning' | 'regulation' | 'evidence' | 'summary' | 'verdict' | 'evidence_request' | 'topic_deviation' | 'claim_verification' | 'logical_fallacy' | 'sexual_harassment' | 'criminal_threat';

export interface InterventionData {
  shouldIntervene: boolean;
  type?: InterventionType;
  message?: string;
  targetUser?: string;
  detectedIssues?: string[];
  confidence?: number;
  urgency?: 'low' | 'medium' | 'high';
  reasoning?: string;
}

export interface PersonalizedResponse {
  targetUser: string;
  analysis: string;
  message: string;
  style: string;
  percentage: number;
  reasoning: string[];
  punishment: string;
}

export interface VerdictData {
  responses?: PersonalizedResponse[];
  verdict: {
    summary: string;
    conflict_root_cause: string;
    recommendation: string;
  };
}

// ==================== 실시간 쟁점 분석 AI ====================

export const analyzeConversation = async (
  messages: Message[],
  previousInterventions: {
    id: string;
    type: InterventionType;
    timestamp: string;
    text: string;
    targetUser?: string;
  }[],
  detectedIssues: string[]
): Promise<InterventionData> => {
  if (!apiKey || !genAI) {
    console.error('Gemini API 키가 설정되지 않았습니다.');
    return { shouldIntervene: false };
  }
  
  try {
    const userMessages = messages.filter(msg => msg.user === 'user-general');
    
    // 메시지가 너무 적으면 개입하지 않음
    if (userMessages.length < 2) {
      //console.log('대화가 충분하지 않아 분석을 건너뜁니다.');
      return { shouldIntervene: false };
    }
    
    const latestMessages = userMessages.slice(-5); // 최근 5개 메시지 확인으로 늘림
    
    // 1단계: 성추행/성희롱 감지 (최우선 - 즉시 강력 개입)
    const sexualHarassmentPatterns = [
      '가슴', '엉덩이', '몸매', '섹스', '자위', '야동', '19금',
      '만지', '만졌', '만질', '만져', '터치', '스킨십',
      '사귀', '사랑', '좋아한', '꼬시', '꼬셔', '꼬신',
      '키스', '뽀뽀', '포옹', '안아', '안았', '안을',
      '벗어', '벗겨', '벗기', '옷', '속옷', '팬티', '브래지어'
    ];
    
    for (const msg of latestMessages) {
      const text = msg.text.toLowerCase();
      const hasSexualContent = sexualHarassmentPatterns.some(pattern => 
        text.includes(pattern.toLowerCase())
      );
      
      if (hasSexualContent) {
        //console.log(`성추행/성희롱 의심 표현 감지됨: ${msg.name} - ${msg.text}`);
        return {
          shouldIntervene: true,
          type: 'sexual_harassment',
          message: `🚨 ${msg.name}님! 성적 괴롭힘 발언 감지! 즉시 중단하세요!`,
          targetUser: msg.name,
          detectedIssues: [`${msg.name}님의 성적 괴롭힘 의심 발언`],
          confidence: 0.98,
          urgency: 'high',
          reasoning: '성추행, 성희롱 관련 발언이 감지되어 즉시 최고 수준의 개입이 필요합니다. 이는 욕설보다 훨씬 심각한 범죄 행위입니다.'
        };
      }
    }
    
    // 2단계: 심각한 욕설/위협 감지 (우선순위 2)
    const severeProfanityPatterns = [
      '씨발', '시발', 'ㅅㅂ', 'ㅆㅂ', '개새끼', '개색끼', '개색기', 'ㄱㅅㄲ',
      '병신', '븅신', 'ㅂㅅ', '자지', 'ㅈㅈ', '좆', 'ㅈ같', '좆같', 
      '니미', '니엄마', '엄마', '느금마', '개좆', '개지랄', '지랄', 'ㅈㄹ',
      '꺼져', '닥쳐', '죽어', '뒤져', '개죽음', '뒈져', '죽을래', '뒤져라',
      '미친놈', '미친년', '정신병', '장애인', '병신새끼', '또라이새끼',
      '변태', '새끼', '새기', 'ㅅㄲ'
    ];
    
    for (const msg of latestMessages) {
      const text = msg.text.toLowerCase().replace(/[\s.,!?]/g, '');
      const hasSevereProfanity = severeProfanityPatterns.some(pattern => 
        text.includes(pattern.toLowerCase())
      );
      
      if (hasSevereProfanity) {
        // console.log(`심각한 욕설 감지됨: ${msg.name} - ${msg.text}`);
        return {
          shouldIntervene: true,
          type: 'warning',
          message: `⚠️ ${msg.name}님! 욕설 그만! 진정하세요! 🛑`,
          targetUser: msg.name,
          detectedIssues: [`${msg.name}님의 심각한 욕설 사용`],
          confidence: 0.92,
          urgency: 'high',
          reasoning: '심각한 욕설이 감지되어 즉시 개입이 필요하지만, 성추행보다는 낮은 수준의 문제입니다.'
        };
      }
    }
    
    // 3단계: AI를 통한 고급 분석 (증거 요청, 주제 이탈, 논리적 오류 등)
    // console.log('고급 대화 분석 시작');
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    // 참가자 정보 추출
    const participants = Array.from(new Set(userMessages.map(msg => msg.name)));
    
    // 최근 대화 내용 (최대 20개 메시지로 줄여서 더 민감하게)
    const recentMessages = userMessages
      .slice(-20)
      .map(msg => `${msg.name}: ${msg.text}`)
      .join('\n');
    
    // 기존 개입 이력
    const recentInterventions = previousInterventions
      .slice(-3)
      .map(intervention => `[${intervention.type}] ${intervention.text}`)
      .join('\n');
    
    // 기존 쟁점 목록
    const existingIssues = detectedIssues.length > 0 
      ? `\n기존 감지된 쟁점들:\n${detectedIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}`
      : '';
    
    const prompt = `당신은 실시간으로 갈등을 감지하고 개입하는 AI 판사입니다. 더 적극적이고 민감하게 개입해야 합니다.

대화 참가자: ${participants.join(', ')}

최근 대화 내용:
${recentMessages}

최근 판사 개입 이력:
${recentInterventions || '없음'}
${existingIssues}

다음 상황들을 적극적으로 감지하고 개입하세요 (기준을 낮춰서 더 자주 개입):

**최우선 - 즉시 개입:**
- 성적 괴롭힘, 성추행 관련 발언 (이미 처리됨)
- 협박, 위협, 폭력 암시
- 개인정보 노출이나 사생활 침해

**우선순위 1 - 적극적 개입:**
- 근거 없는 강한 주장이나 단정적 발언
- 감정적 격화 징조 (아직 욕설 전 단계라도)
- 상대방 무시하거나 조롱하는 태도
- 논리적 오류나 억지 주장

**우선순위 2 - 예방적 개입:**
- 구체적 사실이나 통계 주장 시 증거 요구
- 대화 주제에서 벗어나는 경우
- 일방적인 대화 독점
- 건설적이지 않은 방향으로 흘러가는 경우

개입 기준을 낮춰서 의심스러우면 개입하세요. 갈등이 커지기 전에 미리 예방하는 것이 목표입니다.

반드시 다음 JSON 형식으로 응답하세요:
{
  "shouldIntervene": true/false,
  "type": "evidence_request" | "topic_deviation" | "claim_verification" | "logical_fallacy" | "warning" | "issue" | "criminal_threat",
  "message": "판사가 참가자들에게 전달할 구체적 메시지 (이모티콘과 친근한 말투 사용)",
  "targetUser": "특정 대상이 있는 경우 사용자명 (선택사항)",
  "detectedIssues": ["구체적으로 감지된 문제점들"],
  "confidence": 0.0-1.0,
  "urgency": "low" | "medium" | "high",
  "reasoning": "개입이 필요한 구체적 근거"
}

예시 개입 메시지들 (친근하고 효과적인 말투로):
- evidence_request: "📋 [사용자명]님, '[구체적 주장]'에 대한 근거 부탁드려요! 🤔"
- topic_deviation: "🎯 잠깐! 원래 주제로 돌아가 볼까요? 😊"
- logical_fallacy: "⚖️ 논리에 문제가 있어 보이네요. 다시 설명해 주세요! 🧐"
- warning: "⚠️ 감정 좀 가라앉히고 차분하게 해봐요! 💨"

confidence가 0.3 이상이면 개입하는 것으로 기준을 낮추세요. 너무 신중하지 말고 적극적으로 개입하세요.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      
      return {
        shouldIntervene: parsed.shouldIntervene || false,
        type: parsed.type || 'issue',
        message: parsed.message || '',
        targetUser: parsed.targetUser || undefined,
        detectedIssues: parsed.detectedIssues || [],
        confidence: parsed.confidence || 0.5,
        urgency: parsed.urgency || 'medium',
        reasoning: parsed.reasoning || ''
      };
      
    } catch (parseError) {
      console.error('응답 파싱 오류:', parseError);
      return { shouldIntervene: false };
    }
    
  } catch (error) {
    console.error('실시간 분석 오류:', error);
    return { shouldIntervene: false };
  }
};

// ==================== 최종 판결 AI ====================

export const getFinalVerdict = async (
  messages: Message[], 
  detectedIssues?: string[],
  userCurseLevels?: Record<string, number>
): Promise<VerdictData> => {
  if (!apiKey || !genAI) {
    console.error('Gemini API 키가 설정되지 않았습니다.');
    return {
      responses: [],
      verdict: {
        summary: '판결을 내릴 수 없습니다. API 키가 설정되지 않았습니다.',
        conflict_root_cause: '알 수 없음',
        recommendation: '시스템 관리자에게 문의하세요.'
      }
    };
  }
  
  try {
    // console.log('최종 판결 요청 시작');
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    // 사용자 메시지만 필터링하고 시계열 순으로 정렬
    const userMessages = messages
      .filter(msg => msg.user === 'user-general')
      .map((msg, index) => `[${index + 1}] ${msg.name}: ${msg.text}`)
      .join('\n');
    
    // 참가자별 메시지 수 및 패턴 분석
    const participants = Array.from(new Set(
      messages
        .filter(msg => msg.user === 'user-general')
        .map(msg => msg.name)
    ));
    
    const participantStats = participants.map(name => {
      const userMsgs = messages.filter(msg => msg.user === 'user-general' && msg.name === name);
      return {
        name,
        messageCount: userMsgs.length,
        averageLength: userMsgs.reduce((sum, msg) => sum + msg.text.length, 0) / userMsgs.length,
        curseLevel: (userCurseLevels && name) ? (userCurseLevels[name] || 0) : 0
      };
    });
    
    // 쟁점 목록 및 관계 맥락
    const issuesStr = detectedIssues && detectedIssues.length > 0
      ? `주요 감지된 쟁점들:\n${detectedIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}\n`
      : '';
    
    // 참가자 통계 정보
    const statsStr = `참가자별 대화 패턴 분석:
${participantStats.map(stat => 
  `${stat.name}: 메시지 ${stat.messageCount}개, 평균 길이 ${Math.round(stat.averageLength)}자, 언어 수위 ${stat.curseLevel}/30`
).join('\n')}\n`;
    
    const prompt = `당신은 관계 갈등 전문가이자 유쾌한 AI 판사입니다! 🏛️✨

전문적인 분석 능력과 재치 있는 말솜씨로 각 참가자의 성향에 맞는 개인화된 피드백을 제공하세요.
이모티콘, 드립, 비유를 적극 활용하면서도 공정하고 건설적인 판결을 내려주세요.

${statsStr}

${issuesStr}

시계열 대화 분석:
${userMessages}

## 🎯 판결 우선순위 (매우 중요!)

### 1. 🚨 최고 심각도 (85-100% 책임)
- **성추행/성희롱**: 동의 없는 신체 접촉, 성적 괴롭힘 발언
- **협박/위협**: 물리적 폭력이나 보복 위협
- **스토킹/사생활 침해**: 개인정보 노출, 지속적 괴롭힘

### 2. ⚠️ 높은 심각도 (60-84% 책임)  
- **심각한 욕설/모독**: 인격 모독, 가족 욕설
- **논리적 파괴**: 억지 주장, 사실 왜곡
- **관계 파괴적 행동**: 지속적 공격, 화해 거부

### 3. 📢 중간 심각도 (40-59% 책임)
- **감정적 대응**: 일시적 화남, 방어적 반응  
- **의사소통 미숙**: 오해 유발, 배려 부족
- **자기중심적 태도**: 상대방 입장 무시

### 4. 💡 낮은 심각도 (0-39% 책임)
- **합리적 대응**: 논리적 반박, 차분한 대화
- **건설적 제안**: 해결책 제시, 화해 시도
- **상대방 배려**: 이해하려는 노력, 공감 표현

## 🎨 개인화된 말투 가이드

각 참가자의 대화 패턴을 분석해서 그들이 공감할 수 있는 말투와 비유를 사용하세요:

- **공격적인 성향**: "야야, 진정해! 🔥 화날 만하지만..."
- **논리적인 성향**: "음... 데이터를 보면 🤓 이런 부분이..."  
- **감정적인 성향**: "마음이 많이 아프셨겠어요 😢 하지만..."
- **유머러스한 성향**: "ㅋㅋㅋ 이런 상황은 처음이네요 😂 근데..."
- **진지한 성향**: "진심으로 말씀드리면 🙏 이 부분은..."

## 🧠 심층 분석 프레임워크

### 심리적 분석
- 감정 상태, 심리적 동기, 방어기제
- 내재된 불안이나 욕구

### 관계 역학 분석  
- 권력 관계, 의사소통 스타일
- 상호 영향 관계, 반응 패턴

### 도덕적/윤리적 평가
- 상대방 배려, 공정성, 책임감
- 사회적 규범 준수 정도

### 성장 가능성 평가
- 자기성찰 능력, 변화 의지
- 관계 개선 잠재력

반드시 다음 JSON 형식으로 응답하세요:
{
  "responses": [
    {
      "targetUser": "참가자 이름",
      "analysis": "이 참가자에 대한 깊이 있는 심리적, 관계적 분석 (200자 이상, 전문적이면서도 친근하게)",
      "message": "이 참가자에게 전달할 개인 맞춤형 피드백 메시지 (150자 이상, 이모티콘과 그들의 성향에 맞는 말투 사용)",
      "style": "참가자의 의사소통 스타일과 성격적 특성에 대한 재치 있는 분석",
      "percentage": 숫자(0-100),
      "reasoning": ["심리적 동기", "행동 패턴", "의사소통 평가", "갈등 기여도", "성장 가능성"],
      "punishment": "개인 맞춤형 관계 개선 방안 (현실적이고 구체적인 조치 제시)"
    }
  ],
  "verdict": {
    "summary": "갈등의 핵심과 각 참가자 역할에 대한 유쾌하면서도 전문적인 종합 분석 (300자 이상, 드립과 이모티콘 활용)",
    "conflict_root_cause": "갈등의 심층적 근본 원인 (심리적, 관계적, 의사소통적 측면을 재치 있게 분석)",
    "recommendation": "관계 회복과 갈등 예방을 위한 구체적이고 실행 가능한 권고사항 (200자 이상, 유머러스하면서도 실용적으로)"
  }
}

🎯 핵심 포인트:
- 성추행/성희롱이 욕설보다 훨씬 심각한 범죄임을 반드시 반영하세요
- 각 참가자의 말투와 성향을 파악해서 그에 맞는 개인화된 메시지를 작성하세요  
- 이모티콘과 재치 있는 표현을 적극 활용하되, 판결의 공정성은 유지하세요
- 관계 회복 가능성과 구체적 개선 방안을 제시하세요
- 단순 욕설보다는 전체적인 관계적 성숙도와 도덕적 수준을 중시하세요

💡 현실적인 권고 조치 예시:
**연인 관계:**
- 상대방 밥 3번 해주기
- 좋아하는 음식 사서 가기  
- 데이트 비용 본인이 부담
- 소원권 3개 제공
- 마사지 쿠폰 제공

**친구 관계:**
- 치킨/피자 한 번 쏘기
- 카페 음료 일주일 사주기
- 게임 아이템 선물
- 영화표 끊어주기
- 노래방/PC방 비용 부담

**가족 관계:**
- 집안일 일주일 대신하기
- 용돈 일부 양보
- 설거지/청소 담당
- 부모님께 같이 안마 받기
- 가족 외식 비용 부담

**일반적:**
- 진심 어린 사과 편지 쓰기
- 24시간 욕설 금지 약속
- 상대방 말 끝까지 듣기 연습
- 하루 칭찬 3개씩 하기`;

    //console.log('최종 판결 API 요청 시작');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    //console.log('최종 판결 API 응답 받음');
    
    try {
      const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
      const parsedData = JSON.parse(cleanedText);
      
      //console.log('JSON 파싱 성공:', parsedData.verdict ? '판결 있음' : '판결 없음');
      return parsedData;
      
    } catch (parseError) {
      console.error('최종 판결 응답 파싱 오류:', parseError);
      //console.log('원본 응답:', text);
      
      return {
        responses: [],
        verdict: {
          summary: '판결 과정에서 오류가 발생했습니다.',
          conflict_root_cause: '알 수 없음',
          recommendation: '다시 시도해주세요.'
        }
      };
    }
    
  } catch (error) {
    console.error('최종 판결 API 호출 오류:', error);
    
    return {
      responses: [],
      verdict: {
        summary: '판결을 내리는 중 오류가 발생했습니다.',
        conflict_root_cause: '시스템 오류',
        recommendation: '잠시 후 다시 시도해주세요.'
      }
    };
  }
};