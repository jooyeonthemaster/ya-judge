import { GoogleGenerativeAI } from '@google/generative-ai';

// API 키 확인
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
console.log('Gemini API 키 존재 여부:', !!apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

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
}

export const getJudgeResponse = async (messages: Message[], context?: string) => {
  if (!apiKey) {
    console.error('Gemini API 키가 설정되지 않았습니다.');
    return '판사를 부를 수 없습니다. API 키가 설정되지 않았습니다.';
  }
  
  try {
    console.log('Gemini API 호출 시작');
    // 원래 모델명으로 다시 변경 (gemini-2.0-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const conversationHistory = messages
      .map(msg => `${msg.name}: ${msg.text}`)
      .join('\n');
    
    const prompt = `
      당신은 철저하고 전문적인 판사입니다. 각 당사자의 말투와 성향을 분석하고, 그들의 언어로 자세하고 구체적인 판결을 내립니다.

      대화 분석 및 개인맞춤 응답 가이드라인:
      
      1. 철저한 말투 분석:
        - 각 참여자의 말투 특징 파악 (반말/존댓말, 욕설, 이모티콘, 신조어 등)
        - 디시스러운 싸가지 없는 말투인지, 감성적인 말투인지 구분
        - 참여자 별로 카테고리화: '디시 감성', '감성적', '정중', '논리적' 등
      
      2. 당사자별 맞춤 응답:
        - 싸가지 없는 사람한테는 "ㅋㅋ 개X씨X아"같은 디시 감성으로 
        - 감성적인 사람한테는 "진짜 속상했겠다ㅠㅠ 울 [이름]이가 많이 힘들었지?"
        - 정중한 사람한테는 존댓말과 논리적 설명
        - 논리왕한테는 팩트와 근거로 빡빡하게
      
      3. 상세한 분석과 판결:
        - 당사자의 행동과 의도에 대한 심층 분석
        - 갈등의 핵심 원인 설명
        - 각자의 잘못된 점과 잘한 점 명확히 구분
        - 심리적 동기와 내면의 감정 파악
        - 구체적이고 현실적인 해결방안 제시
      
      4. 개인별 별도 판결:
        각 사람에게 그들의 언어로 따로 판결을 내리기
        
        예시:
        - 싸가지없는 참여자1한테: 
          "===참여자1===
          어이ㅋㅋㅋ [참여자1]아 개빡치네 진짜^^
          니가 80% 잘못이야 ㅅㅂ
          
          1. 소개팅 당일날 취소한 건 진짜 개또라이짓ㅋㅋㅋ
          2. 그래서 소개해주는 친구한테도 싸가지 없는 행동임
          3. 최소한 하루 전에는 알려줘야지 상식적으로
          
          처벌: 옵치마니 20판 돌려라 ㅋㅋㅋ
          그리고 친구한테 술값 쏴라 갓빠아니야?^^"
        
        - 감성적 참여자2한테:
          "===참여자2===
          아이고ㅠㅠ [참여자2]야.. 많이 실망했지?
          솔직히 너는 20% 정도 잘못한 것 같아..
          
          1. 소개팅 성사되기 전부터 너무 기대했더라ㅠㅠ
          2. 상대방도 갑자기 생긴 일일 수 있어
          3. 그래도 네가 충분히 실망할 만한 상황이었어
          
          보상: 친구랑 맛있는 거 먹으면서 풀어
          그리고 다음 소개팅에선 기대를 좀 낮추고 편하게 가자♥"
      
      5. 응답 형식:
        반드시 다음 JSON 형식으로만 응답하세요:
        {
          "responses": [
            {
              "targetUser": "참여자1",
              "analysis": "참여자1의 행동과 동기에 대한 상세한 분석",
              "message": "참여자1에게 하는 상세한 맞춤 메시지", 
              "style": "디시 감성",
              "percentage": 80,
              "reasoning": ["상세한 잘못 1", "상세한 잘못 2", "상세한 잘못 3"],
              "punishment": "구체적인 처벌 내용"
            },
            {
              "targetUser": "참여자2",
              "analysis": "참여자2의 행동과 동기에 대한 상세한 분석",
              "message": "참여자2에게 하는 상세한 맞춤 메시지",
              "style": "감성적",
              "percentage": 20,
              "reasoning": ["상세한 잘못 1", "어쩔 수 없었던 점 1"],
              "punishment": "구체적인 보상/위로 내용"
            }
          ],
          "verdict": {
            "summary": "상황에 대한 상세한 전체 요약",
            "conflict_root_cause": "갈등의 근본 원인 분석",
            "recommendation": "장기적 관계 개선 방안"
          }
        }

      위 형식을 그대로 사용해서 반환해주세요. 다른 텍스트를 추가하거나 마크다운 코드 블록(\`\`\`)을 사용하지 마세요.
      
      대화 내용:
      ${conversationHistory}
      
      ${context ? `추가 컨텍스트: ${context}` : ''}
      
      반드시 각 당사자에게 그들의 말투와 성향에 맞는 완전히 다른 응답을 해주며, 매우 상세하고 구체적인 분석과 해결방안을 제시하세요.
      
      중요: 응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운 코드 블록(\`\`\`)이나 "알겠습니다"와 같은 추가 텍스트 없이 JSON 객체만 반환하세요.
    `;
    
    console.log('Gemini 프롬포트 생성 완료, API 요청 시작');
    const result = await model.generateContent(prompt);
    console.log('Gemini API 응답 받음');

    // API 응답 처리 개선 - JSON 직접 파싱 시도
    const responseText = result.response.text();
    
    try {
      // 응답에서 실제 JSON 부분 추출
      let cleanedText = responseText;
      console.log('원본 응답:', responseText.substring(0, 100) + '...');
      
      // "알겠습니다"와 같은 일반 텍스트 응답 처리
      if (cleanedText.startsWith("알겠습니다") || 
          cleanedText.startsWith("네,") || 
          cleanedText.startsWith("이해했습니다")) {
        // 응답에서 JSON 형식을 찾아봅니다
        const jsonMatch = cleanedText.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedText = jsonMatch[1];
        }
      }
      
      // 마크다운 코드 블록 제거
      cleanedText = cleanedText.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');
      cleanedText = cleanedText.replace(/```\s*([\s\S]*?)\s*```/g, '$1');
      
      // 앞뒤 공백과 따옴표 제거
      cleanedText = cleanedText.trim();
      if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
        cleanedText = cleanedText.slice(1, -1);
      }
      
      // 문자열 이스케이프 처리
      cleanedText = cleanedText.replace(/\\\"/g, '"');
      
      console.log('정제된 텍스트:', cleanedText.substring(0, 100) + '...');
      
      // JSON 파싱 시도
      const parsedJSON = JSON.parse(cleanedText);
      console.log('JSON 파싱 성공');
      
      // 필요한 필드 검증
      if (!parsedJSON.responses || !Array.isArray(parsedJSON.responses) || parsedJSON.responses.length === 0) {
        throw new Error('응답 형식 불일치: responses 배열이 없거나 비어 있습니다.');
      }
      
      // 성공적으로 파싱되면 파싱된 JSON 반환
      return JSON.stringify(parsedJSON);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      
      // 마지막 시도: 응답에서 중괄호로 둘러싸인 부분만 추출
      try {
        const jsonPattern = /\{[\s\S]*\}/g;
        const matches = responseText.match(jsonPattern);
        
        if (matches && matches.length > 0) {
          // 가장 긴 중괄호 부분을 JSON으로 파싱 시도
          const longestMatch = matches.reduce((a, b) => a.length > b.length ? a : b);
          const parsedJSON = JSON.parse(longestMatch);
          console.log('중괄호 추출 후 JSON 파싱 성공');
          return JSON.stringify(parsedJSON);
        }
      } catch (e) {
        console.error('중괄호 추출 후 JSON 파싱 실패:', e);
      }
      
      // 모든 파싱 시도 실패 시 기본 판결 객체로 래핑
      const fallbackResponse = {
        responses: [
          {
            targetUser: "모든 참여자",
            message: responseText,
            style: "일반",
            percentage: 50,
            reasoning: ["판결 내용 참조"],
            punishment: "판결 내용 참조"
          }
        ],
        verdict: {
          summary: "판사의 판결",
          conflict_root_cause: "판결 내용 참조",
          recommendation: "판결 내용 참조"
        }
      };
      
      return JSON.stringify(fallbackResponse);
    }
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    
    // 오류 발생 시에도 유효한 JSON 형식으로 응답
    const errorResponse = {
      responses: [
        {
          targetUser: "모든 참여자",
          message: "죄송합니다. 판사를 불러오는 중 오류가 발생했습니다.",
          style: "정중",
          percentage: 0,
          reasoning: ["오류가 발생했습니다."],
          punishment: "없음"
        }
      ],
      verdict: {
        summary: "오류 발생",
        conflict_root_cause: "판결을 내리는 중 기술적 문제가 발생했습니다.",
        recommendation: "잠시 후 다시 시도해주세요."
      }
    };
    
    return JSON.stringify(errorResponse);
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

export interface VerdictData {
  responses: PersonalizedResponse[];
  verdict: {
    summary: string;
    conflict_root_cause: string;
    recommendation: string;
  };
}

export const generateVerdict = async (messages: Message[]): Promise<VerdictData> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const conversationHistory = messages
    .map(msg => `${msg.name}: ${msg.text}`)
    .join('\n');
  
  const prompt = `
    각 당사자의 말투를 철저히 분석하고, 그들의 감성과 언어에 맞춰 개인별 상세한 맞춤 판결을 내리세요.
    
    대화 내용:
    ${conversationHistory}
    
    응답 형식:
    {
      "responses": [
        {
          "targetUser": "참여자 이름",
          "analysis": "행동과 동기에 대한 상세 분석",
          "message": "맞춤 말투로 된 상세한 응답", 
          "style": "말투 스타일 분류",
          "percentage": 책임 비율,
          "reasoning": ["상세한 과실 내용들"],
          "punishment": "구체적인 처벌/보상"
        }
      ],
      "verdict": {
        "summary": "상황 전체 요약",
        "conflict_root_cause": "근본 원인 분석",
        "recommendation": "장기적 해결방안"
      }
    }
    
    매우 상세하고 구체적인 분석과 해결방안을 제시하세요.
  `;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
