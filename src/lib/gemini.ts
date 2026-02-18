import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildFinalVerdictPrompt } from "./prompts/verdictPrompt";
import type { ExtendedVerdictData, ExtendedPersonalizedResponse, DimensionalScores } from "../types/verdict";

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

// 기존 호환용 타입 (ExtendedPersonalizedResponse로 확장)
export type PersonalizedResponse = ExtendedPersonalizedResponse;

// 기존 호환용 타입 (ExtendedVerdictData로 확장)
export type VerdictData = ExtendedVerdictData;

// dimensionalScores 기본값 생성
const DEFAULT_DIMENSIONAL_SCORES: DimensionalScores = {
  emotional: 50,
  logical: 50,
  communication: 50,
  empathy: 50,
  responsibility: 50,
};

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
        .filter(msg => msg.user === 'user-general' && msg.name)
        .map(msg => msg.name as string)
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

    const prompt = buildFinalVerdictPrompt({
      userMessages,
      participantStats,
      issuesStr,
    });

    //console.log('최종 판결 API 요청 시작');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    //console.log('최종 판결 API 응답 받음');
    
    try {
      const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
      const parsedData = JSON.parse(cleanedText);

      // 새 필드 fallback 처리 (기존 데이터 호환)
      if (parsedData.responses) {
        parsedData.responses = parsedData.responses.map((r: ExtendedPersonalizedResponse) => ({
          ...r,
          dimensionalScores: r.dimensionalScores || DEFAULT_DIMENSIONAL_SCORES,
          penaltyInfo: r.penaltyInfo && r.penaltyInfo.amount ? r.penaltyInfo : null,
        }));
      }
      if (parsedData.verdict) {
        parsedData.verdict = {
          ...parsedData.verdict,
          giftSuggestions: parsedData.verdict.giftSuggestions || [],
          overallSeverity: parsedData.verdict.overallSeverity || 'medium',
        };
      }

      return parsedData as ExtendedVerdictData;

    } catch (parseError) {
      console.error('최종 판결 응답 파싱 오류:', parseError);

      return {
        responses: [],
        verdict: {
          summary: '판결 과정에서 오류가 발생했습니다.',
          conflict_root_cause: '알 수 없음',
          recommendation: '다시 시도해주세요.',
          giftSuggestions: [],
          overallSeverity: 'medium' as const,
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