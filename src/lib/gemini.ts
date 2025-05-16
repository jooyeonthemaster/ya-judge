import { GoogleGenerativeAI } from '@google/generative-ai';

// API 키 확인
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
console.log('Gemini API 키 존재 여부:', !!apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

// 모든 프롬프트에 적용할 시스템 지시사항
const SYSTEM_INSTRUCTION = `당신은 항상 한국어로만 응답해야 합니다. 절대 영어로 응답하지 마세요. JSON 응답을 포함한 모든 출력은 반드시 한국어로만 작성하세요.`;

export interface Message {
  id: string;
  user: 'user-general' | 'judge' | 'system';
  name: string;
  text: string;
  timestamp: string;
  sender?: {
    id: string;
    username: string;
  };
  messageType?: 'normal' | 'evidence' | 'objection' | 'question' | 'closing';
  relatedIssue?: string;
  stage?: string;
}

// 개입 유형 정의
export type InterventionType = 'issue' | 'warning' | 'regulation' | 'evidence' | 'summary' | 'verdict';

// 개입 데이터 인터페이스
export interface InterventionData {
  shouldIntervene: boolean;
  interventionType?: InterventionType;
  interventionMessage?: string;
  detectedIssues?: string[];
  userToneAnalysis?: Record<string, string>;
  evidenceRequest?: {
    targetUser: string;
    claim: string;
    requestReason: string;
  };
  targetUser?: string; // 특정 사용자 대상 메시지
}

// 실시간 대화 분석 함수
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
  if (!apiKey) {
    console.error('Gemini API 키가 설정되지 않았습니다.');
    return { shouldIntervene: false };
  }
  
  try {
    // 메시지가 너무 적으면 개입하지 않음
    if (messages.filter(m => m.user === 'user-general').length < 3) {
      console.log('대화가 충분하지 않아 분석을 건너뜁니다.');
      return { shouldIntervene: false };
    }
    
    console.log('실시간 대화 분석 시작');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // 참가자 정보 추출
    const participants = Array.from(new Set(
      messages
        .filter(msg => msg.user === 'user-general')
        .map(msg => msg.name)
    ));
    
    // 대화 이력 구성 (발화자 정보와 발화 시간도 포함)
    const conversationHistory = messages
      .filter(msg => msg.user !== 'system' || msg.text.includes('판사가 상황을 분석'))
      .map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        let prefix = '';
        
        // Role-based prefixes
        if (msg.user === 'judge') {
          prefix = '판사: ';
        } else if (msg.user === 'system') {
          prefix = '시스템: ';
        } else {
          prefix = `${msg.name}: `;
        }
        
        // 메시지 유형 및 관련 쟁점 표시
        let messagePrefix = '';
        if (msg.messageType === 'evidence') {
          messagePrefix = '[증거] ';
        } else if (msg.messageType === 'objection') {
          messagePrefix = '[반론] ';
        } else if (msg.messageType === 'closing') {
          messagePrefix = '[최종변론] ';
        }
        
        if (msg.relatedIssue) {
          messagePrefix += `[쟁점: ${msg.relatedIssue}] `;
        }
        
        return `${prefix}${messagePrefix}${msg.text}`;
      })
      .join('\n');
    
    // 이전 개입 기록
    const interventionHistory = previousInterventions
      .map(intervention => {
        const timestamp = new Date(intervention.timestamp).toLocaleTimeString();
        return `[${intervention.type}] 판사(${timestamp}): ${intervention.text}`;
      })
      .join('\n');
    
    // 기존 감지된 쟁점들
    const issuesStr = detectedIssues.length > 0 
      ? `이미 감지된 쟁점들:\n${detectedIssues.join('\n')}`
      : '아직 감지된 쟁점이 없습니다.';

    let prompt = '';
    let stage = 'interview';

    // 참여자가 충분한지 확인
    const uniqueParticipants = new Set(
      messages
        .filter(m => m.user === 'user-general')
        .map(m => m.name)
    );

    // 초기 시스템 메시지 추가
    prompt = `
      당신은 항상 한국어로만 응답해야 합니다. 절대 영어로 응답하지 마세요.
      
      당신은 대화를 모니터링하는 AI 판사입니다. 
      사용자들의 대화를 분석하여 필요할 때만 개입합니다.
      당신은 직접 대화 참여자가 아니며, 메시지는 사용자들 간의 대화입니다.
      당신에게 직접 말하는 것이 아닙니다.
      
      당신은 아래 두 가지 상황에서만 개입해야 합니다:
      1. 사용자가 욕설이나 공격적 언어를 사용할 때
      2. 타이머가 종료되어 최종 판결을 내려야 할 때
      
      평범한 대화에는 절대 개입하지 않습니다.
      
      대화 내용:
      ${conversationHistory}
      
      이전 개입 내역:
      ${interventionHistory || '이전 개입 없음'}
      
      감지된 쟁점:
      ${issuesStr}
      
      현재 대화를 분석하여 욕설이나 공격적인 표현이 있는지만 확인하세요.
      공격적 표현이 감지되면 개입하고, 그렇지 않으면 개입하지 마세요.
      
      욕설이 감지되면 반드시 엄격하게 대응해야 합니다. 욕설 사용자에게 직접적으로 경고하고, 
      해당 언어가 왜 부적절한지 분명하게 설명하세요. 판사로서 권위있는 톤으로 말하세요.
      공격적인 언어는 즉시 제재해야 합니다. 이것은 레벨이 아니라 절대적인 규칙입니다.
      
      응답 형식:
      {
        "shouldIntervene": true/false,
        "interventionType": "warning", 
        "interventionMessage": "개입 메시지 (욕설이 감지된 경우 판사로서 엄격하고 단호한 경고 메시지)",
        "targetUser": "문제가 있는 사용자 이름",
        "detectedIssues": ["쟁점1", "쟁점2"]
      }
      
      참고: 공격적 언어가 발견되지 않으면 반드시 shouldIntervene을 false로 설정하세요.
      공격적 언어는 다음과 같은 단어를 포함합니다: 씨발, 개새끼, 병신, 미친놈, 등
    `;
    
    console.log('Gemini 프롬포트 생성 완료, API 요청 시작');
    
    const result = await model.generateContent(prompt);
    console.log('Gemini API 응답 받음');

    // API 응답 처리
    const responseText = result.response.text();
    console.log('응답 길이:', responseText.length);
    
    // 'undefined' 문자열 제거
    const cleanedResponse = responseText.replace(/undefined/g, '');
    
    // 응답 정제 시도
    try {
      // 응답에서 실제 JSON 부분 추출
      let cleanedText = cleanedResponse;
      
      // 텍스트 응답 처리 (JSON 형식이 아닌 경우)
      if (!cleanedText.trim().startsWith("{")) {
        const jsonMatch = cleanedText.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedText = jsonMatch[1];
        } else {
          // 기본적으로 개입하지 않도록 함
          return {
            shouldIntervene: false
          };
        }
      }
      
      // 마크다운 코드 블록 제거
      cleanedText = cleanedText.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');
      cleanedText = cleanedText.replace(/```\s*([\s\S]*?)\s*```/g, '$1');
      
      // JSON 파싱
      const parsedResponse: InterventionData = JSON.parse(cleanedText);
      console.log('파싱된 응답:', JSON.stringify(parsedResponse).substring(0, 200) + '...');
      
      return parsedResponse;
    } catch (parseError) {
      console.error('응답 파싱 오류:', parseError);
      console.log('원본 응답:', cleanedResponse);
      
      // 응답이 JSON 형식이 아니면 개입하지 않음
      return {
        shouldIntervene: false
      };
    }
  } catch (error) {
    console.error('Gemini API 요청 중 오류 발생:', error);
    return { shouldIntervene: false };
  }
};

export interface PersonalizedResponse {
  targetUser: string;
  analysis: string;
  message: string;
  style: string;
  percentage: number;
  reasoning: string[];
  punishment: string;
}

export interface IssueJudgement {
  issue: string;
  judgement: string;
  reasoning: string;
}

export interface VerdictData {
  responses: PersonalizedResponse[];
  issueJudgements?: IssueJudgement[];
  verdict: {
    summary: string;
    conflict_root_cause: string;
    recommendation: string;
  };
}

export interface IssuesData {
  issues: string[];
  needMoreInfo?: boolean;
  guidanceMessage?: string;
  summary: string;
  judgeMessage: string;
}

export interface DiscussionData {
  analysis: Record<string, string>;
  evidenceRequired: boolean;
  evidenceRequests?: Array<{
    targetUser: string;
    claim: string;
    requestReason: string;
  }>;
  summary: string;
  judgeMessage: string;
}

export interface QuestionsData {
  questions: Array<{
    targetUser: string;
    question: string;
    purpose: string;
  }>;
  summary: string;
  judgeMessage: string;
}

export interface ClosingData {
  summary: string;
  closingInstructions: string;
  judgeMessage: string;
}

export interface JudgeMessageData {
  analysis: Record<string, string>;
  judgeMessage: string;
  nextStep: string;
}

// 단계별 특화된 판사 요청 함수들
export const generateIssues = async (messages: Message[]): Promise<IssuesData> => {
  const response = await getJudgeResponse(messages, 'issues');
  try {
    const data = JSON.parse(response) as IssuesData;
    
    // 쟁점 개수를 최대 5개로 제한
    if (data.issues && data.issues.length > 5) {
      console.log(`쟁점 선별 필요: ${data.issues.length}개 쟁점 발견`);
      
      // 주요 쟁점 선별 로직
      const selectedIssues = selectImportantIssues(data.issues, messages);
      data.issues = selectedIssues;
      
      console.log(`선별된 주요 쟁점 ${selectedIssues.length}개`);
    }
    
    // 유효하지 않은 쟁점 필터링
    if (data.issues && data.issues.length > 0) {
      // 유효하지 않은 패턴 정의
      const invalidPatterns = [
        /쟁점을 찾기/i,
        /정보가 부족/i,
        /쟁점에 동의/i,
        /다음 단계/i,
        /확인 필요/i,
        /서로 대화가 필요해요/i,
        /서로 존중해야 해요/i,
        /안\s*됩니다/i,   // 해석이 포함된 문장 제외
        /후릉하지만/i,
        /아닙니다/i,
        /모릅니다/i,
        /되었습니다/i
      ];
      
      // 해당 패턴이 포함된 쟁점 제거
      data.issues = data.issues.filter(issue => {
        return !invalidPatterns.some(pattern => pattern.test(issue));
      });
      
      // 문장 단위로 분리된 경우 처리 추가
      if (data.issues.length === 1 && data.issues[0].includes('.')) {
        // 문장 단위로 분리하여 쟁점 추출
        const sentences = data.issues[0].split(/(?<=\.)\s+/);
        
        // 실제 쟁점만 추출 (객관적인 내용만)
        const validIssues = sentences.filter(sentence => {
          // 판단이나 해석이 포함된 문장 제외
          if (/안\s*됩니다|후릉하지만|아닙니다|모릅니다|되었습니다/.test(sentence)) {
            return false;
          }
          // 지시사항이나 안내 문장 제외
          if (/해야\s*합니다|필요합니다|중요합니다/.test(sentence)) {
            return false;
          }
          return true;
        });
        
        data.issues = validIssues.length > 0 ? validIssues : ["**관계 갈등**의 핵심 쟁점"];
      }
      
      // 필터링 후 쟁점이 없으면 기본 쟁점 추가
      if (data.issues.length === 0) {
        data.issues = ["**관계에서의 의사소통 방식**에 대한 견해 차이"];
      }
    }
    
    // 쟁점 정제를 위한 추가 호출
    data.issues = await refineIssues(data.issues);
    
    return data;
  } catch (error) {
    console.error('Issues 데이터 파싱 오류:', error);
    throw new Error('쟁점 정리 응답을 처리하는 중 오류가 발생했습니다.');
  }
};

export const refineIssues = async (issues: string[]): Promise<string[]> => {
  if (!apiKey || issues.length === 0) {
    return issues;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      당신은 관계 문제에서 객관적인 쟁점만 추출하는 전문가입니다.
      
      아래 목록에서 진짜 관계 쟁점만 객관적으로 다시 작성해주세요. 다음과 같은 항목은 제외하세요:
      - 해석이나 판단이 포함된 항목 (예: "~일까요?", "~아닐까요?", "~이 정당하지 않습니다")
      - 지시사항이나 안내 (예: "다음 단계로 진행하세요")
      - 진부한 조언 (예: "서로 대화가 필요함", "서로 존중해야 함")
      
      각 쟁점은 다음과 같은 형식으로 객관적으로 다시 작성해주세요:
      - "**핵심 주제나 행동** 관련 갈등" (예: "**소통 방식**에 대한 견해 차이")
      
      검토할 목록:
      ${issues.join('\n')}
      
      응답 형식:
      ["객관적 쟁점1", "객관적 쟁점2", "객관적 쟁점3"]
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // JSON 파싱 시도
    try {
      // 응답에서 실제 JSON 부분 추출
      const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        const refinedIssues = JSON.parse(jsonMatch[1]);
        return refinedIssues.filter(Boolean);
      }
    } catch (parseError) {
      console.error('쟁점 정제 JSON 파싱 실패:', parseError);
    }
    
    return issues; // 파싱 실패 시 원본 반환
  } catch (error) {
    console.error('쟁점 정제 오류:', error);
    return issues; // 오류 시 원본 반환
  }
};

// 주요 쟁점 선별 함수
function selectImportantIssues(issues: string[], messages: Message[]): string[] {
  // 1. 쟁점 중요도 평가
  const scoredIssues = issues.map(issue => {
    let score = 0;
    
    // 길이가 적당한 쟁점 우선 (너무 짧거나 너무 긴 쟁점은 낮은 점수)
    if (issue.length > 10 && issue.length < 100) score += 2;
    
    // 강조 표시(볼드)가 있는 쟁점 우선
    if (issue.includes('**')) score += 3;
    
    // 메시지에서 언급된 핵심 키워드를 포함하는 쟁점 우선
    const keywords = extractKeywords(messages);
    keywords.forEach(keyword => {
      if (issue.toLowerCase().includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    
    // 해석이나 판단이 포함된 쟁점은 낮은 점수
    if (/안\s*됩니다|후릉하지만|아닙니다|모릅니다|되었습니다/.test(issue)) {
      score -= 5;
    }
    
    return { issue, score };
  });
  
  // 2. 점수 기준으로 정렬
  const sortedIssues = scoredIssues.sort((a: {issue: string, score: number}, b: {issue: string, score: number}) => b.score - a.score);
  
  // 3. 상위 5개 쟁점 선택
  return sortedIssues.slice(0, 5).map(item => item.issue);
}

// 메시지에서 핵심 키워드 추출 함수
function extractKeywords(messages: Message[]): string[] {
  // 사용자 메시지만 추출
  const userMessages = messages.filter(msg => 
    msg.user === 'user-general'
  );
  
  // 메시지 텍스트 결합
  const allText = userMessages.map(msg => msg.text).join(' ');
  
  // 불필요한 단어 및 특수문자 제거
  const cleanedText = allText
    .replace(/[^\w\s가-힣]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  
  // 단어 빈도수 계산
  const wordCounts: Record<string, number> = {};
  cleanedText.split(' ').forEach(word => {
    if (word.length > 1) { // 2글자 이상 단어만 카운트
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // 빈도수 기준 상위 10개 키워드 추출
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
}

export const generateDiscussion = async (messages: Message[], currentIssue: string): Promise<DiscussionData> => {
  const response = await getJudgeResponse(messages, 'discussion', currentIssue);
  return JSON.parse(response) as DiscussionData;
};

export const generateQuestions = async (messages: Message[]): Promise<QuestionsData> => {
  const response = await getJudgeResponse(messages, 'questions');
  return JSON.parse(response) as QuestionsData;
};

export const generateClosing = async (messages: Message[]): Promise<ClosingData> => {
  const response = await getJudgeResponse(messages, 'closing');
  return JSON.parse(response) as ClosingData;
};

export const generateVerdict = async (messages: Message[]): Promise<VerdictData> => {
  const response = await getJudgeResponse(messages, 'verdict');
  return JSON.parse(response) as VerdictData;
};

export const generateJudgeMessage = async (messages: Message[], stage: string): Promise<JudgeMessageData> => {
  try {
    const response = await getJudgeResponse(messages, stage);
    console.log('API 응답 결과:', response.substring(0, 100) + '...');
    
    // 모든 undefined 문자열 제거를 여러 패턴으로 수행
    let cleanedResponse = response;
    
    // 첫 번째 정제: 기본 undefined 제거
    cleanedResponse = cleanedResponse.replace(/undefined/g, '');
    
    // 두 번째 정제: 문장 끝의 undefined
    cleanedResponse = cleanedResponse.replace(/\. undefined/g, '.');
    cleanedResponse = cleanedResponse.replace(/\.\s*undefined/g, '.');
    
    // 세 번째 정제: 공백과 함께 있는 undefined
    cleanedResponse = cleanedResponse.replace(/ undefined[.,]?/g, '');
    cleanedResponse = cleanedResponse.replace(/\s+undefined\s*/g, ' ');
    
    // 네 번째 정제: 텍스트 끝의 undefined
    cleanedResponse = cleanedResponse.replace(/undefined$/g, '');
    cleanedResponse = cleanedResponse.replace(/undefined\s*$/g, '');
    
    // 다섯 번째 정제: 줄 시작의 undefined
    cleanedResponse = cleanedResponse.replace(/^undefined\s*/gm, '');
    
    // 여섯 번째 정제: 문자 사이의 undefined
    cleanedResponse = cleanedResponse.replace(/([^\s])undefined([^\s])/g, '$1$2');
    
    // 일곱 번째 정제: 추가 정제 (중복 공백도 정리)
    cleanedResponse = cleanedResponse.replace(/\s{2,}/g, ' ').trim();
    
    // 여덟 번째 정제: JSON에 영향을 주지 않도록 추가 패턴 적용
    cleanedResponse = cleanedResponse.replace(/"([^"]*?)undefined([^"]*?)"/g, '"$1$2"'); // JSON 문자열 내부의 undefined
    cleanedResponse = cleanedResponse.replace(/:\s*undefined\s*([,}])/g, ':null$1'); // JSON 값으로서의 undefined
    
    console.log('undefined 제거 후 응답:', cleanedResponse.substring(0, 100) + '...');
    
    // JSON 파싱 시도
    const parsed = JSON.parse(cleanedResponse) as JudgeMessageData;
    
    // undefined 값을 필터링하는 함수 정의
    const removeUndefined = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
      }
      
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
          result[key] = removeUndefined(obj[key]);
        }
      }
      return result;
    };
    
    // undefined 값 필터링 적용
    const cleanedParsed = removeUndefined(parsed);
    
    // 필수 필드가 없는 경우 기본값 설정
    if (!cleanedParsed.judgeMessage || typeof cleanedParsed.judgeMessage !== 'string') {
      console.error('judgeMessage 누락 또는 잘못된 형식:', cleanedParsed);
      cleanedParsed.judgeMessage = '현재 단계에서 각 참여자는 자신의 입장을 명확히 설명해주시기 바랍니다.';
    } else {
      // judgeMessage 내부의 undefined 문자열도 제거
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/undefined/g, '');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/\. undefined/g, '.');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/\.\s*undefined/g, '.');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/ undefined[.,]?/g, '');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/\s+undefined\s*/g, ' ');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/undefined$/g, '');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/undefined\s*$/g, '');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/^undefined\s*/gm, '');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/([^\s])undefined([^\s])/g, '$1$2');
      cleanedParsed.judgeMessage = cleanedParsed.judgeMessage.replace(/\s{2,}/g, ' ').trim();
    }
    
    if (!cleanedParsed.nextStep || typeof cleanedParsed.nextStep !== 'string') {
      console.error('nextStep 누락 또는 잘못된 형식:', cleanedParsed);
      cleanedParsed.nextStep = '다음 단계로 진행';
    } else {
      // nextStep도 undefined 문자열 제거
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/undefined/g, '');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/\. undefined/g, '.');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/\.\s*undefined/g, '.');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/ undefined[.,]?/g, '');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/\s+undefined\s*/g, ' ');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/undefined$/g, '');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/undefined\s*$/g, '');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/^undefined\s*/gm, '');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/([^\s])undefined([^\s])/g, '$1$2');
      cleanedParsed.nextStep = cleanedParsed.nextStep.replace(/\s{2,}/g, ' ').trim();
    }
    
    if (!cleanedParsed.analysis || typeof cleanedParsed.analysis !== 'object') {
      console.error('analysis 누락 또는 잘못된 형식:', cleanedParsed);
      cleanedParsed.analysis = { '참가자들': '특성 분석이 필요합니다' };
    }
    
    return cleanedParsed;
  } catch (error) {
    console.error('판사 메시지 생성 오류:', error);
    // 기본 응답 값 제공
    return {
      analysis: { '참가자들': '분석할 수 없습니다' },
      judgeMessage: '각 참여자는 자신의 입장을 설명해주시기 바랍니다. "저는 이 사건에서 ~한 입장입니다"라고 구체적으로 말씀해주세요.',
      nextStep: '다음 단계로 진행'
    };
  }
};

export const getJudgeResponse = async (messages: Message[], stage?: string, context?: string) => {
  if (!apiKey) {
    console.error('Gemini API 키가 설정되지 않았습니다.');
    return '판사를 부를 수 없습니다. API 키가 설정되지 않았습니다.';
  }
  
  try {
    console.log('Gemini API 호출 시작');
    // 모델 인스턴스 생성
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // 참가자 정보 추출
    const participants = Array.from(new Set(
      messages
        .filter(msg => msg.user === 'user-general')
        .map(msg => msg.name)
    ));
    
    console.log('대화 참가자:', participants);
    
    // 대화 이력 구성 (발화자 정보와 발화 시간도 포함)
    const conversationHistory = messages
      .map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        let messagePrefix = '';
        
        // 메시지 유형 및 관련 쟁점 표시
        if (msg.messageType === 'evidence') {
          messagePrefix = '[증거] ';
        } else if (msg.messageType === 'objection') {
          messagePrefix = '[반론] ';
        } else if (msg.messageType === 'closing') {
          messagePrefix = '[최종변론] ';
        }
        
        if (msg.relatedIssue) {
          messagePrefix += `[쟁점: ${msg.relatedIssue}] `;
        }
        
        return `${msg.name}(${timestamp}): ${messagePrefix}${msg.text}`;
      })
      .join('\n');
    
    // 현재 단계에 맞는 프롬프트 생성
    let prompt = '항상 반드시 한국어로만 응답하세요. 영어로 응답하면 안 됩니다. 답변의 모든 부분(JSON 포함)은 한국어로만 작성하세요.\n\n';
    
    if (stage === 'verdict') {
      // 판결 단계에서는 종합적인 판결 프롬프트 사용
      prompt += `
        당신은 개성 있고 예측불가능한 판사입니다. 각 당사자의 말투와 성향을 완벽히 파악해 그들의 스타일을 흉내내며 판결합니다.

        ### 말투 모방 가이드라인:
        
        1. 인터넷 커뮤니티 스타일 흉내내기:
           - 디시인사이드: "ㅇㅇ 인정 박제 ㄱㄱ", "ㅋㅋㅋ 레전드네", "답정너냐?", "팩트폭행 당했네"
           - 먼데이: "너 그거 알아?", "음... 그래?", "아 맞다!", "절레절레"
           - 여초: "인정~", "ㅇㅈ", "킹왕짱!", "헐... 가관이다", "ㅠㅠㅠ", "ㅇㅎ"
           - 레딧: "맞는 말", "underrated comment", "팩트", "이해하기 쉽게 ELI5하자면..."
        
        2. 그 외 다양한 말투 요소 활용:
           - 짧은 단위에서 말투 급변: 때로는 논리적, 때로는 감성적, 때로는 유머러스하게 변화
           - 이모티콘과 특수문자 과감하게 활용: 😂, 🔥, 💯, 🤔, ㅋㅋ, ㄷㄷ, ㅎㄷㄷ, ㅇㅇ
           - 유행어와 밈 적극 활용: "아니 이거 실화냐", "이게 드럽게", "팩폭할게요", "캡쳐 가능해요?"
           - 은어 및 신조어 사용: "갑분싸", "꿀팁", "레게노", "오졌다", "현타", "띵작", "우엘시", "ㄹㅇ", "ㅈㄴ", "ㄹㅇㅋㅋ"
           - 반말과 존댓말 불규칙하게 섞기: "~했냐?", "~인데요", "~하세요", "~입니다만?"
        
        3. 적극적인 판결 스타일:
           - 논쟁의 본질 파고들기: "아니 도대체 진짜 쟁점은 뭐냐면"
           - 참가자들 말에 직접 태클: "ㅋㅋㅋ 그런 소리는 집에서나 하지"
           - 예상치 못한 관점 제시: "갑자기 왜 그렇게 생각하냐면..."
           - 독설 섞기: "그쪽 주장 진심임? ㄹㅇ?"
           - 판사의 위엄과 개성 넘나들기: "오늘 판사 갬성 폭발해서 일단 들어봐"
        
        ### 감지된 쟁점:
        ${issuesStr}
        
        대화 내용:
        ${conversationHistory}
        
        이전 개입 내역:
        ${interventionHistory || '이전 개입 없음'}
        
        위 대화를 분석하여 다음을 결정하세요:
        1. 지금 개입해야 하는지 여부 (쟁점을 명확히 하거나, 오해를 풀거나, 감정 조절이 필요하거나, 대화가 정체된 경우)
        2. 개입한다면 어떤 유형의 개입을 할지 (질문, 요약, 중재, 쟁점 제시 등)
        3. 개입한다면 어떤 메시지를 전달할지 (인터넷 커뮤니티 스타일을 활용한 흥미로운 말투로)
        4. 새롭게 감지된 쟁점이 있는지
        
        응답 형식:
        {
          "shouldIntervene": true/false,
          "interventionType": "question", "summary", "mediation", "issue", "advice", "closing",
          "interventionMessage": "개입 메시지 (인터넷 커뮤니티 스타일을 활용한 재밌는 말투로)",
          "targetUser": "특정 사용자에게 말하는 경우 그 사용자 이름",
          "detectedIssues": ["쟁점1", "쟁점2"]
        }
        
        참고:
        - 판사는 단순히 기계적인 중재자가 아니라 강한 개성을 가진 캐릭터로 행동하세요
        - 약 20%의 확률로 전혀 예상치 못한 방향의 개입을 하거나 의외의 질문을 던지세요
        - 대화가 20초 이상 정체되었으면 반드시 개입하세요
        - 인터넷 커뮤니티 스타일의 말투를 활용해 독특하고 재미있게 대화하세요
      `;
    } else if (stage === 'issues') {
      // 쟁점 정리 단계에서는 핵심 쟁점 추출 프롬프트 사용
      prompt += `
        당신은 대화에서 객관적인 쟁점만을 추출하는 중립적인 분석가입니다. 이 역할에서는 판단을 내리거나 시시비비를 가리지 않고, 오직 사실관계에 기반한 쟁점만 정리합니다.
        
        ### 핵심 지침:
        1. 쟁점은 반드시 3-5개로 제한하세요. 너무 많으면 핵심이 흐려집니다.
        2. issues 배열에는 오직 객관적인 쟁점만 포함해야 합니다.
        3. judgeMessage에도 객관적인 내용만 포함하세요. 판단, 조언, 시시비비는 포함하지 마세요.
        4. 쟁점은 **핵심 키워드**를 포함한 짧고 객관적인 문장으로 작성하세요.
        5. 판단이나 해석이 들어간 어구("~해서는 안됩니다", "~이 문제입니다" 등)는 사용하지 마세요.
        
        대화 내용:
        ${conversationHistory}
        
        ### 응답 형식:
        {
          "issues": [
            "**의사소통 방식**에 대한 의견 차이",
            "**책임 분담**에 관한 기대 불일치",
            "**감정 표현** 방식의 차이"
          ],
          "needMoreInfo": true/false,
          "guidanceMessage": "더 알아야 할 관계 패턴이나 상황에 대한 안내",
          "summary": "대화 내용의 객관적 요약",
          "judgeMessage": "판사로서 쟁점을 객관적으로 나열하고 설명하는 메시지 (판단이나 조언 없이)"
        }
        
        ### 쟁점 작성 가이드라인:
        - 반드시 "**핵심 키워드**에 관한 상황/차이/불일치" 형식으로 작성하세요.
        - 예시: 
          - "**일정 계획**에 대한 선호도 차이" 
          - "**재정 관리**에 관한 기대 불일치"
          - "**감정 표현**에 대한 의사소통 방식 차이"
          - "**책임 분담**에 관한 인식 차이"
          - "**경계 설정**에 대한 의견 불일치"
        - 핵심 키워드는 반드시 볼드 처리하세요 (**키워드**)
        - 양측의 입장을 암시하는 단어(예: ~를 원함, ~를 거부함)는 사용하지 마세요.
        - 행동이나 상황을 객관적으로 표현하세요.
        
        ### issues 배열과 judgeMessage 모두에 절대 넣으면 안 되는 것들:
        - 주관적 판단이 들어간 문장 ("~가 문제입니다", "~해야 합니다")
        - 한쪽 편을 드는 표현 ("A가 B를 무시함", "A의 태도가 거칠음")
        - 권고나 조언 ("대화가 필요함", "서로 존중해야 함")
        - 판사로서의 주관적 분석이나 시시비비 판단
        
        issues 배열과 judgeMessage 모두 철저히 객관적으로 작성하세요. 판단이나 의견은 어디에도 포함하지 마세요.
      `;
    } else if (stage === 'intro') {
      // 재판 소개 단계에서는 구체적인 진행 방식과 명확한 지시사항을 제공
      prompt += `
        당신은 전문적이고 카리스마 있는 판사입니다. 재판이 시작되었으니 참가자들에게 재판 진행 방식을 구체적으로 안내하고 적절한 지시사항을 제공해야 합니다.
        
        최우선 지시사항: 참가자들에게 "판사의 안내에 따라주세요"와 같은 추상적인 메시지가 아닌, "지금 즉시 각자 자신의 주장을 말씀해주세요"와 같은 구체적인 행동 지시를 제공해야 합니다. 모호하지 않고 명확한 행동 지침이 필요합니다.
        
        참가자들에게 다음 내용을 포함한 명확하고 구체적인 안내를 해주세요:
        1. 재판의 목적과 전체 진행 단계(모두진술 → 쟁점정리 → 토론 → 판사질문 → 최종변론 → 판결)
        2. 현재 참가자들이 지금 즉시 해야 할 행동을 매우 명확하게 안내 (예: "지금 각자의 입장을 한 번씩 말씀해주세요.")
        3. 첫 발언을 어떻게 시작해야 하는지 구체적인 예시 제공 (예: "저는 OO에 대해 이런 입장입니다...")
        
        중요: 특수 메시지 기능(증거 제출, 반론 등)에 대한 설명은 제공하지 마세요. 이는 시스템에서 자동으로 안내됩니다.
        
        대화 내용:
        ${conversationHistory}
        
        다음 JSON 형식으로 응답하세요:
        {
          "analysis": {
            ${participants && participants.length > 0 ? `${participants.map(p => `"${p}": "이 참여자의 특성 파악"`).join(',\n            ')}` : '"참가자들": "참가자들의 특성"'}
          },
          "judgeMessage": "판사가 참여자들에게 전달할 메시지",
          "nextStep": "다음으로 진행해야 할 단계에 대한 제안"
        }
        
        중요:
        - "판사의 안내에 따라주세요"와 같은 추상적인 메시지는 절대 사용하지 마세요.
        - 참가자들이 지금 즉시 무엇을 해야 하는지 명확한 행동 지시를 제공하세요.
        - 명확한 첫 발언 예시를 제공하여 참가자들이 즉시 대화를 시작할 수 있게 해주세요.
        - "저는 이런 입장입니다..."와 같은 애매한 표현이 아닌, 실제로 참가자가 따라할 수 있는 구체적인 발언 방식을 안내해야 합니다.
        - 실행 가능한 명확한 지시를 주는 적극적인 재판장의 역할을 보여주세요.
        - 길고 복잡한 내용보다는 핵심적이고 따라하기 쉬운 지시사항을 제공하세요.
        - "말씀하실 때 증거가 있다면 화면 아래 특수 메시지 기능을 사용해 제출해주시고, 상대방 의견에 반박이 있으시면 반론 기능을 이용해주세요."와 같은 문구는 사용하지 마세요.
      `;
    } else if (stage === 'discussion') {
      // 쟁점별 토론 단계에서는 현재 쟁점에 대한 분석 프롬프트 사용
      prompt += `
        당신은 법정에서 논쟁을 효과적으로 중재하는 판사입니다. 현재 '쟁점별 토론' 단계에서 특정 쟁점에 대한 양측의 주장을 분석하고 중재해야 합니다.
        
        대화 내용:
        ${conversationHistory}
        
        ${context ? `현재 논의 중인 쟁점: ${context}` : ''}
        
        각 참여자(${participants && participants.length > 0 ? participants.join(', ') : '아직 확인되지 않음'})의 말투를 분석하고, 현 쟁점에 대한 그들의 주장을 정리해보세요. 필요하다면 증거를 요청할 수 있습니다.
        
        다음 JSON 형식으로 응답하세요:
        {
          "analysis": {
            ${participants && participants.length > 0 ? `${participants.map(p => `"${p}": "이 참여자의 주장과 말투 분석"`).join(',\n            ')}` : '"참가자들": "참가자들의 주장 분석"'}
          },
          "evidenceRequired": false, // 증거가 필요하면 true로 설정
          "evidenceRequests": [
            // evidenceRequired가 true일 때만 사용
            {
              "targetUser": "증거를 제출해야 할 참여자",
              "claim": "증거가 필요한 주장",
              "requestReason": "증거가 필요한 이유"
            }
          ],
          "summary": "현재까지의 토론 정리",
          "judgeMessage": "판사가 참여자들에게 전달할 메시지"
        }
      `;
    } else if (stage === 'questions') {
      // 판사 질문 단계에서는 추가 질문 생성 프롬프트 사용
      prompt += `
        당신은 사건의 진실을 파악하기 위해 날카로운 질문을 던지는 판사입니다. 현재 '판사 질문' 단계에서 불명확한 부분이나 추가 정보가 필요한 부분에 대해 질문해야 합니다.
        
        대화 내용:
        ${conversationHistory}
        
        각 참여자(${participants.join(', ')})의 주장을 분석하고, 아직 명확하지 않거나 모순되는 부분, 또는 추가 설명이 필요한 부분을 찾아 질문을 준비하세요.
        
        다음 JSON 형식으로 응답하세요:
        {
          "questions": [
            {
              "targetUser": "질문할 참여자",
              "question": "구체적인 질문 내용",
              "purpose": "이 질문을 하는 목적 (내부 참고용)"
            },
            // 2-3개의 추가 질문
          ],
          "summary": "현재까지의 쟁점과 주장에 대한 요약",
          "judgeMessage": "판사가 질문을 시작하며 참여자들에게 전달할 메시지"
        }
        
        질문은 사실 확인, 모순점 지적, 의도 파악 등 다양한 목적을 가질 수 있으며, 판결에 중요한 영향을 미칠 수 있는 내용을 중심으로 해야 합니다.
      `;
    } else if (stage === 'closing') {
      // 최종 변론 단계에서는 변론 안내 프롬프트 사용
      prompt += `
        당신은 최종 변론을 진행하는 판사입니다. 현재 '최종 변론' 단계에서 각 참여자에게 마지막 의견을 말할 기회를 주어야 합니다.
        
        대화 내용:
        ${conversationHistory}
        
        각 참여자(${participants.join(', ')})에게 최종 변론 기회를 주고, 어떻게 효과적인 최종 변론을 할 수 있는지 안내해주세요.
        
        다음 JSON 형식으로 응답하세요:
        {
          "summary": "지금까지의 토론 요약",
          "closingInstructions": "효과적인 최종 변론을 위한 안내",
          "judgeMessage": "판사가 최종 변론을 시작하며 참여자들에게 전달할 메시지"
        }
        
        판사로서 중립적인 입장을 유지하되, 각 참여자가 자신의 핵심 주장을 효과적으로 정리할 수 있도록 도와주세요.
      `;
    } else {
      // 기본 프롬프트 (모두 진술, 판사 진행 등)
      prompt += `
        당신은 재판을 진행하는 전문적인 판사입니다. 각 참여자의 말투와 성향을 분석하고, 재판을 효과적으로 진행해야 합니다.
        
        ${
          stage === 'intro' 
            ? '재판의 진행 방식과 규칙을 설명하고, 공정한 토론을 당부하세요.' 
            : stage === 'opening' 
              ? '각 참여자가 자신의 입장에서 상황을 설명할 수 있도록 안내하세요.' 
              : '현재 상황을 분석하고, 재판을 효과적으로 진행하기 위한 메시지를 작성하세요.'
        }
        
        각 참여자(${participants.join(', ')})의 말투를 분석하고, 그들의 성향에 맞게 소통하세요.
        
        다음 JSON 형식으로 응답하세요:
        {
          "analysis": {
            ${participants.length > 0 ? participants.map(p => `"${p}": "이 참여자의 말투와 성향 분석"`).join(',\n            ') : '"참가자들": "참가자들의 특성"'}
          },
          "judgeMessage": "판사가 참여자들에게 전달할 메시지",
          "nextStep": "다음으로 진행해야 할 단계에 대한 제안"
        }
      `;
    }
    
    console.log('Gemini 프롬포트 생성 완료, API 요청 시작');
    console.log('프롬프트 일부:', prompt.substring(0, 200) + '...');
    
    const result = await model.generateContent(prompt);
    console.log('Gemini API 응답 받음');

    // API 응답 처리
    const responseText = result.response.text();
    console.log('API 응답 받음, 응답 길이:', responseText.length);
    
    // JSON 부분 추출 시도
    try {
      // 응답에서 실제 JSON 부분 추출
      let cleanedText = responseText;
      
      // 마크다운 코드 블록 제거
      cleanedText = cleanedText.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');
      cleanedText = cleanedText.replace(/```\s*([\s\S]*?)\s*```/g, '$1');
      console.log('코드 블록 제거 후 응답 길이:', cleanedText.length);
      
      // 유효한 JSON이 아닌 경우
      if (!cleanedText.trim().startsWith("{")) {
        console.log('유효한 JSON 형식이 아님, JSON 추출 시도 중');
        const jsonMatch = cleanedText.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedText = jsonMatch[1];
          console.log('JSON 추출 성공, 길이:', cleanedText.length);
        } else {
          console.error('JSON 추출 실패');
          throw new Error('유효한 JSON 형식이 아닙니다.');
        }
      }
      
      // JSON 파싱 후 반환
      console.log('JSON 파싱 시도 중');
      const parsedData = JSON.parse(cleanedText) as VerdictData;
      console.log('JSON 파싱 성공:', parsedData.verdict ? '판결 있음' : '판결 없음');
      return parsedData;
    } catch (error) {
      console.error('최종 판결 응답 파싱 오류:', error);
      // 오류 시 기본 응답 반환
      return {
        responses: participants.map(name => ({
          targetUser: name,
          analysis: '분석 실패',
          message: '오류로 인해 개인별 피드백을 생성할 수 없습니다.',
          style: '알 수 없음',
          percentage: 50,
          reasoning: ['분석 오류'],
          punishment: '없음'
        })),
        verdict: {
          summary: '판결 과정에서 오류가 발생했습니다.',
          conflict_root_cause: '분석 실패',
          recommendation: '다시 시도해보세요.'
        }
      };
    }
  } catch (error) {
    console.error('최종 판결 API 호출 오류:', error);
    return {
      responses: [],
      verdict: {
        summary: '판결을 내리는 중 오류가 발생했습니다.',
        conflict_root_cause: '알 수 없음',
        recommendation: '나중에 다시 시도해보세요.'
      }
    };
  }
};

export const getFinalVerdict = async (
  messages: Message[], 
  detectedIssues?: string[],
  userCurseLevels?: Record<string, number>
): Promise<VerdictData> => {
  if (!apiKey) {
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
    console.log('최종 판결 요청 시작');
    console.log('메시지 수:', messages.length);
    console.log('감지된 쟁점 수:', detectedIssues?.length || 0);
    console.log('사용자 욕설 레벨 정보:', userCurseLevels);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // 시스템 메시지 제외한 사용자와 판사 메시지만 필터링
    const filteredMessages = messages.filter(msg => msg.user !== 'system');
    console.log('필터링된 메시지 수:', filteredMessages.length);
    
    // 쟁점 목록 문자열화
    const issuesStr = detectedIssues && detectedIssues.length > 0
      ? `감지된 쟁점들:\n${detectedIssues.join('\n')}`
      : '특별히 감지된 쟁점이 없습니다.';
    
    // 욕설 레벨 정보 문자열화
    let curseLevelsStr = '';
    if (userCurseLevels && Object.keys(userCurseLevels).length > 0) {
      curseLevelsStr = '참가자 욕설 레벨 정보 (0-30 척도):\n';
      
      // 참가자와 UserId 매핑 생성
      const userIdMap: Record<string, string> = {};
      messages.forEach(msg => {
        if (msg.user === 'user-general' && msg.sender?.id) {
          userIdMap[msg.sender.id] = msg.name;
        }
      });
      
      // 각 사용자별 욕설 레벨 정보 추가
      Object.entries(userCurseLevels).forEach(([userId, level]) => {
        const username = userIdMap[userId] || '알 수 없는 사용자';
        let severityLabel = '';
        if (level >= 25) {
          severityLabel = '(극도로 심각한 수준)';
        } else if (level >= 20) {
          severityLabel = '(매우 심각한 수준)';
        } else if (level >= 15) {
          severityLabel = '(심각한 수준)';
        } else if (level >= 10) {
          severityLabel = '(중대한 수준)';
        } else if (level >= 5) {
          severityLabel = '(중간 수준)';
        } else if (level > 0) {
          severityLabel = '(경미한 수준)';
        }
        curseLevelsStr += `${username}: ${level}/30 ${severityLabel}\n`;
      });
    } else {
      curseLevelsStr = '모든 참가자가 정중한 언어를 사용했습니다.';
    }
    
    // 대화 이력 구성
    const conversationHistory = filteredMessages
      .map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        let messagePrefix = '';
        
        // 메시지 유형 및 관련 쟁점 표시
        if (msg.messageType === 'evidence') {
          messagePrefix = '[증거] ';
        } else if (msg.messageType === 'objection') {
          messagePrefix = '[반론] ';
        } else if (msg.messageType === 'closing') {
          messagePrefix = '[최종변론] ';
        }
        
        if (msg.relatedIssue) {
          messagePrefix += `[쟁점: ${msg.relatedIssue}] `;
        }
        
        return `${msg.name}(${timestamp}): ${messagePrefix}${msg.text}`;
      })
      .join('\n');
    
    // 참가자 정보 추출
    const participants = Array.from(new Set(
      filteredMessages
        .filter(msg => msg.user === 'user-general')
        .map(msg => msg.name)
    ));
    console.log('대화 참가자:', participants);
    
    const prompt = `항상 반드시 한국어로만 응답하세요. 영어로 응답하면 안 됩니다. 답변의 모든 부분(JSON 포함)은 한국어로만 작성하세요.
    
      당신은 관계 갈등의 최종 판결을 내리는 유쾌하고 개성 있는 판사입니다. 재미있는 인터넷 커뮤니티 말투로 참가자들의 말투와 성향을 반영한 유쾌한 판결을 내리세요.
      
      ${issuesStr}
      
      대화 내용:
      ${conversationHistory}
      
      대화에 참여한 사람들: ${participants.join(', ')}
      
      ${curseLevelsStr}
      
      참가자들의 욕설 레벨은 위에 표시된 내용을 기반으로 평가해주세요. 욕설 레벨이 높은 참가자는 이에 대한 언급을 포함해주세요. 
      욕설 레벨은 0-30 척도로, 욕설이 많거나 심할수록 높은 점수가 매겨집니다.
      욕설 레벨이 10 이상인 경우 특별히 언급하고, 20 이상인 경우 강력한 주의를 주세요. 
      그러나 판결 자체에는 직접적인 욕설 언급은 피하고, 대신 "불쾌한 언어 사용", "공격적 표현", "부적절한 어휘 선택"과 같은 완곡한 표현을 사용하세요.
      
      이제 최종 판결을 내려주세요. 다음 정보를 포함해야 합니다:
      
      1. 각 참가자별 개별 피드백 (타겟 사용자, 분석, 메시지, 스타일, 점수 포함)
      2. 쟁점별 판결 (각 쟁점에 대한 판단과 이유 제시)
      3. 종합 판결 (갈등의 요약, 근본 원인, 앞으로의 권고사항)
      
      인터넷 커뮤니티 스타일의 유머러스하고 강렬한 말투를 사용하되, 판결은 공정하고 건설적이어야 합니다.
      다른 채팅 앱/SNS 사이트의 재미있는 말투와 밈을 최대한 활용하세요.
      
      다음 JSON 형식으로 응답하세요:
      {
        "responses": [
          {
            "targetUser": "참가자1 이름",
            "analysis": "참가자의 대화 스타일과 행동 패턴 분석",
            "message": "이 참가자에게 전달할 유쾌하고 특별한 메시지",
            "style": "이 참가자의 스타일을 한 문장으로 요약",
            "percentage": 75, // 0-100 점수 (관계에서의 기여도/태도 점수)
            "reasoning": ["점수의 이유1", "점수의 이유2"],
            "punishment": "재미있는 형벌이나 과제 (예: '1주일 동안 매일 아침 칭찬 3개 하기')"
          },
          // 다른 참가자들에 대한 응답도 포함
        ],
        "issueJudgements": [
          {
            "issue": "쟁점1",
            "judgement": "이 쟁점에 대한 판결",
            "reasoning": "판결의 근거와 이유"
          }
          // 다른 쟁점들에 대한 판결도 포함
        ],
        "verdict": {
          "summary": "전체 갈등에 대한 판결 요약 (유쾌한 인터넷 커뮤니티 스타일로)",
          "conflict_root_cause": "갈등의 근본 원인",
          "recommendation": "앞으로의 관계 개선을 위한 권고사항"
        }
      }
    `;
    
    console.log('최종 판결 프롬프트 생성 완료, API 요청 시작');
    const result = await model.generateContent(prompt);
    console.log('최종 판결 API 응답 받음');
    
    // API 응답 처리
    const responseText = result.response.text();
    console.log('API 응답 받음, 응답 길이:', responseText.length);
    
    // JSON 부분 추출 시도
    try {
      // 응답에서 실제 JSON 부분 추출
      let cleanedText = responseText;
      
      // 마크다운 코드 블록 제거
      cleanedText = cleanedText.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');
      cleanedText = cleanedText.replace(/```\s*([\s\S]*?)\s*```/g, '$1');
      console.log('코드 블록 제거 후 응답 길이:', cleanedText.length);
      
      // 유효한 JSON이 아닌 경우
      if (!cleanedText.trim().startsWith("{")) {
        console.log('유효한 JSON 형식이 아님, JSON 추출 시도 중');
        const jsonMatch = cleanedText.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedText = jsonMatch[1];
          console.log('JSON 추출 성공, 길이:', cleanedText.length);
        } else {
          console.error('JSON 추출 실패');
          throw new Error('유효한 JSON 형식이 아닙니다.');
        }
      }
      
      // JSON 파싱 후 반환
      console.log('JSON 파싱 시도 중');
      const parsedData = JSON.parse(cleanedText) as VerdictData;
      console.log('JSON 파싱 성공:', parsedData.verdict ? '판결 있음' : '판결 없음');
      return parsedData;
    } catch (error) {
      console.error('최종 판결 응답 파싱 오류:', error);
      // 오류 시 기본 응답 반환
      return {
        responses: participants.map(name => ({
          targetUser: name,
          analysis: '분석 실패',
          message: '오류로 인해 개인별 피드백을 생성할 수 없습니다.',
          style: '알 수 없음',
          percentage: 50,
          reasoning: ['분석 오류'],
          punishment: '없음'
        })),
        verdict: {
          summary: '판결 과정에서 오류가 발생했습니다.',
          conflict_root_cause: '분석 실패',
          recommendation: '다시 시도해보세요.'
        }
      };
    }
  } catch (error) {
    console.error('최종 판결 API 호출 오류:', error);
    return {
      responses: [],
      verdict: {
        summary: '판결을 내리는 중 오류가 발생했습니다.',
        conflict_root_cause: '알 수 없음',
        recommendation: '나중에 다시 시도해보세요.'
      }
    };
  }
};