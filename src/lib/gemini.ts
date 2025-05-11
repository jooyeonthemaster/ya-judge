import { GoogleGenerativeAI } from '@google/generative-ai';

// API 키 확인
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
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
  messageType?: 'normal' | 'evidence' | 'objection' | 'question' | 'closing';
  relatedIssue?: string;
  stage?: string;
}

export const getJudgeResponse = async (messages: Message[], stage?: string, context?: string) => {
  if (!apiKey) {
    console.error('Gemini API 키가 설정되지 않았습니다.');
    return '판사를 부를 수 없습니다. API 키가 설정되지 않았습니다.';
  }
  
  try {
    console.log('Gemini API 호출 시작');
    // 원래 모델명으로 다시 변경 (gemini-2.0-flash)
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
    let prompt = '';
    
    if (stage === 'verdict') {
      // 판결 단계에서는 종합적인 판결 프롬프트 사용
      prompt = `
        당신은 철저하고 전문적인 판사입니다. 각 당사자의 성향을 철저히 파악하고, 그들이 공감할 수 있는 방식으로 판결을 전달합니다.

        ### 성향 및 말투 분석 가이드라인:
        
        1. 철저한 말투 및 성향 분석:
          - 각 참여자의 반복적인 언어 패턴 파악 (높임말/반말, 욕설, 이모티콘, 신조어 등)
          - 대화 방식, 사고 패턴, 감정 표현 방식, 사용하는 단어/문장 구조의 특징 분석
          - 각 참가자만의 독특한 표현이나 말버릇, 문장 끝맺음 방식 파악
          - 싸가지 없는 말투, 감성적 말투, 논리적 말투, 예의 바른 말투, 피해자 의식 말투 등을 구분
        
        2. 초정밀 맞춤형 응답 생성:
          - 단순히 존댓말/반말 구분을 넘어, 각 참가자의 고유한 언어 패턴과 단어 선택을 모방
          - 그들이 자주 쓰는 표현, 문장 구조, 이모티콘, 특수문자 사용 방식 등을 그대로 반영
          - 그들의 사고방식과 가치관에 맞춰 설득력 있게 전달
          - 예: "ㅋㅋㅋ진짜 개빡치네ㅠㅠㅠ" 식의 화자라면 그대로 반영, "저는 생각하기에..." 식의 화자라면 그 스타일 반영
        
        3. 심층적 분석과 판결:
          - 각 쟁점별로 철저한 판단 근거와 논리 제시
          - 시시비비를 명확히 가려내는 객관적 판단
          - 각자의 책임 비율과 그 근거를 구체적으로 제시
          - 행동 너머의 심리적 동기와 이면의 감정까지 파악
        
        4. 개인별 맞춤 판결 전달:
          각 참가자에게 그들의 언어로 판결을 전달함으로써 수용성을 극대화
          
          예시:
          - 디시 감성/과격한 말투의 참가자에게는:
            "ㅋㅋㅋ [이름]아 솔직히 개빡치는거 이해함ㅇㅇ 근데 진짜 넌 [구체적 문제행동] 이거때매 80% 책임 있는거 인정해야됨 ㅇㅋ? 진짜 개또라이짓 했잖아 ㄹㅇ... [구체적인 이유들]"
          
          - 감성적인 참가자에게는:
            "우리 [이름]아... 많이 속상했겠다ㅠㅠ 내 마음도 찢어질 것 같아... 근데 [구체적 문제행동]는 솔직히 조금 너무했어... 그래도 다 지나간 일이니까 이제 우리 화해하고 더 행복해지자...♡"
          
          - 논리적인 참가자에게는:
            "다음과 같은 사실관계를 바탕으로 판단했습니다. 첫째, [구체적 증거1]에서 볼 수 있듯이 귀하가 [행동1]을 한 것은 객관적 사실입니다. 둘째, [증거2]를 고려할 때, 상대방의 주장은 일부 과장되었습니다. 종합적으로 귀하의 책임은 60%로 판단됩니다."
        
        ### 응답 형식:
        {
          "responses": [
            {
              "targetUser": "참여자1 이름",
              "analysis": "참여자1의 말투와 성향, 행동, 심리에 대한 매우 상세한 분석",
              "message": "참여자1의 말투와 단어 선택을 그대로 모방한 완전 맞춤형 판결문", 
              "style": "참여자1의 말투 스타일 (최대한 구체적으로)",
              "percentage": 70, // 책임 비율
              "reasoning": ["구체적인 책임 이유 1", "구체적인 책임 이유 2", "구체적인 책임 이유 3"],
              "punishment": "상황에 맞는 창의적인 처벌 또는 해결책"
            },
            // 다른 참여자들에 대한 응답도 동일한 형식으로
          ],
          "issueJudgements": [
            {
              "issue": "쟁점1",
              "judgement": "쟁점1에 대한 판단",
              "reasoning": "판단 근거"
            },
            // 다른 쟁점들에 대한 판단도 동일한 형식으로
          ],
          "verdict": {
            "summary": "사건 전체에 대한 요약 판결",
            "conflict_root_cause": "갈등의 근본 원인 분석",
            "recommendation": "향후 유사 갈등 방지를 위한 조언"
          }
        }
        
        대화 내용:
        ${conversationHistory}
        
        ${context ? `추가 컨텍스트: ${context}` : ''}
        
        각 참여자(${participants && participants.length > 0 ? participants.join(', ') : '대화 참가자'})의 말투와 성향을 극도로 세밀하게 분석해 완전한 맞춤형 판결을 내려주세요. 단순히 말투 유형을 구분하는 것을 넘어, 각자가 사용하는 구체적인 표현과 패턴을 그대로 반영해야 합니다. 판결은 논리적이고 철저하되, 지루하지 않게 작성해주세요.
        
        중요: 응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운 코드 블록이나 "알겠습니다"와 같은 추가 텍스트 없이 JSON 객체만 반환하세요.
      `;
    } else if (stage === 'issues') {
      // 쟁점 정리 단계에서는 핵심 쟁점 추출 프롬프트 사용
      prompt = `
        당신은 법정에서 논쟁의 핵심을 정확히 파악하는 뛰어난 판사입니다. 현재 '쟁점 정리' 단계에서 참가자들의 주장을 분석하여 핵심 쟁점을 추출해야 합니다.
        
        다음 대화 내용을 분석하여:
        1. 이 갈등/논쟁의 핵심 쟁점 3-5개를 추출하세요
        2. 각 쟁점은 양측의 의견 차이가 있는 부분이어야 합니다
        3. 각 쟁점은 명확하고 구체적인 하나의 문장으로 표현하세요
        
        대화 내용:
        ${conversationHistory}
        
        다음 JSON 형식으로 응답하세요:
        {
          "issues": [
            "쟁점1에 대한 명확한 문장",
            "쟁점2에 대한 명확한 문장",
            "쟁점3에 대한 명확한 문장"
          ],
          "summary": "사건의 전체적인 요약",
          "judgeMessage": "판사로서 쟁점을 설명하는 메시지"
        }
        
        쟁점 예시:
        - "A가 약속 시간에 30분 늦은 것이 고의적 무시였는지 단순 실수였는지"
        - "B가 A의 과거 행동을 현재 상황에서 언급한 것이 정당했는지 여부"
        - "공동 비용 부담에 있어 균등 분배가 적절한지 사용량 기준 분배가 적절한지"
        
        쟁점은 판단이 필요한 부분이어야 하며, 단순한 사실관계가 아닌 해석이나 가치판단이 필요한 부분을 포착해야 합니다.
      `;
    } else if (stage === 'intro') {
      // 재판 소개 단계에서는 구체적인 진행 방식과 명확한 지시사항을 제공
      prompt = `
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
          "judgeMessage": "판사로서 참가자들이 즉시 수행해야 할 명확한 행동 지시와 구체적인 안내 메시지 (예: '지금 즉시 첫 번째 참가자부터 자신의 입장을 설명해주세요. \"저는 이번 사건에서 ...\"와 같이 구체적으로 말씀해주시기 바랍니다.')",
          "nextStep": "다음에 진행할 단계나 참가자들이 취해야 할 행동에 대한 안내"
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
      prompt = `
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
      prompt = `
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
      prompt = `
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
      prompt = `
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

    // API 응답 처리 개선
    const responseText = result.response.text();
    console.log('===== API 원본 응답 전체 =====');
    console.log('응답 길이:', responseText.length);
    console.log(responseText);

    // 모든 'undefined' 문자열을 제거한 텍스트 준비
    const cleanedFromUndefined = responseText.replace(/undefined/g, '');
    console.log('===== undefined 문자열 제거 후 =====');
    console.log('정제된 응답 길이:', cleanedFromUndefined.length);
    console.log(cleanedFromUndefined);

    let finalResponse = cleanedFromUndefined;
    
    // 응답 정제 및 파싱 시도
    try {
      // 응답에서 실제 JSON 부분 추출
      let cleanedText = cleanedFromUndefined;
      console.log('===== 정제 전 원본 응답 =====');
      console.log('원본 응답:', cleanedFromUndefined);
      
      // "알겠습니다"와 같은 일반 텍스트 응답 처리
      if (cleanedText.startsWith("알겠습니다") || 
          cleanedText.startsWith("네,") || 
          cleanedText.startsWith("이해했습니다") ||
          cleanedText.startsWith("제") ||
          !cleanedText.trim().startsWith("{")) {
        const jsonMatch = cleanedText.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedText = jsonMatch[1];
          console.log('===== JSON 부분 추출 결과 =====');
          console.log(cleanedText);
        } else {
          // JSON 형식을 찾을 수 없는 경우 기본 JSON 구조로 래핑
          console.log('JSON 형식 없음, 텍스트 응답을 JSON으로 변환');
          if (stage === 'issues') {
            return JSON.stringify({
              issues: ["쟁점 추출 실패"],
              summary: "AI가 텍스트로 응답했습니다.",
              judgeMessage: cleanedText
            });
          } else if (stage === 'intro') {
            return JSON.stringify({
              analysis: { "참가자들": "분석 실패" },
              judgeMessage: cleanedText,
              nextStep: "다음 단계로 진행"
            });
          } else if (stage === 'discussion') {
            return JSON.stringify({
              analysis: { "참가자들": "분석 실패" },
              evidenceRequired: false,
              summary: "텍스트 응답 받음",
              judgeMessage: cleanedText
            });
          } else if (stage === 'questions') {
            return JSON.stringify({
              questions: [{ 
                targetUser: participants[0] || "참가자", 
                question: "판사가 직접 질문하는 중입니다.", 
                purpose: "대화 진행" 
              }],
              summary: "텍스트 응답 받음",
              judgeMessage: cleanedText
            });
          } else if (stage === 'closing') {
            return JSON.stringify({
              summary: "텍스트 응답 받음",
              closingInstructions: "판사의 안내에 따라 최종 변론을 진행하세요.",
              judgeMessage: cleanedText
            });
          } else if (stage === 'verdict') {
            return JSON.stringify({
              responses: [{
                targetUser: "모든 참여자",
                message: cleanedText,
                style: "일반",
                percentage: 50,
                reasoning: ["판결 내용 참조"],
                punishment: "판결 내용 참조"
              }],
              verdict: {
                summary: "판사의 판결",
                conflict_root_cause: "판결 내용 참조",
                recommendation: "판결 내용 참조"
              }
            });
          } else {
            return JSON.stringify({
              analysis: { "참가자들": "분석 실패" },
              judgeMessage: cleanedText,
              nextStep: "다음 단계로 진행"
            });
          }
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
      
      console.log('===== 정제 후 텍스트 전체 =====');
      console.log('정제된 텍스트 길이:', cleanedText.length);
      console.log(cleanedText);
      
      // JSON 파싱 시도
      const parsedJSON = JSON.parse(cleanedText);
      console.log('===== 파싱된 JSON 객체 =====');
      console.log(JSON.stringify(parsedJSON, null, 2));
      
      finalResponse = JSON.stringify(parsedJSON);
      console.log('===== 최종 응답 =====');
      console.log('최종 응답 길이:', finalResponse.length);
      console.log(finalResponse);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      
      // 마지막 시도: 응답에서 중괄호로 둘러싸인 부분만 추출
      try {
        const jsonPattern = /\{[\s\S]*\}/g;
        const matches = cleanedFromUndefined.match(jsonPattern);
        
        if (matches && matches.length > 0) {
          // 가장 긴 중괄호 부분을 JSON으로 파싱 시도
          const longestMatch = matches.reduce((a, b) => a.length > b.length ? a : b);
          const parsedJSON = JSON.parse(longestMatch);
          console.log('중괄호 추출 후 JSON 파싱 성공');
          finalResponse = JSON.stringify(parsedJSON);
        }
      } catch (e) {
        console.error('중괄호 추출 후 JSON 파싱 실패:', e);
      }
      
      // 모든 파싱 시도 실패 시 기본 판결 객체로 래핑
      if (finalResponse === cleanedFromUndefined) {
        const fallbackResponse = {
          responses: [
            {
              targetUser: "모든 참여자",
              message: cleanedFromUndefined,
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
        
        finalResponse = JSON.stringify(fallbackResponse);
      }
    }
    
    return finalResponse;
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
  return JSON.parse(response) as IssuesData;
};

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
      nextStep: '모두 진술 단계로 진행'
    };
  }
};