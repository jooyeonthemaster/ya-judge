import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface RoomlessFormData {
  title: string;
  description: string;
  plaintiff: string;
  defendant: string;
  relationship: string;
  duration: string;
  category: string;
  tags: string[];
  intensity: string;
  character: string;
}

export async function POST(request: Request) {
  try {
    const formData: RoomlessFormData = await request.json();
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    // 다단계 심층 분석
    const deepAnalysis = await performDeepAnalysis(formData);
    const judgePersona = getAdvancedJudgePersona(formData.character, formData.intensity);
    
    const prompt = createDeepAnalysisPrompt(formData, deepAnalysis, judgePersona);
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      let cleanedResponse = responseText.trim();
      cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '');
      cleanedResponse = cleanedResponse.replace(/\*\*/g, ''); // 마크다운 제거
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      const judgmentData = JSON.parse(cleanedResponse);
      
      // 마크다운 제거 후처리
      if (judgmentData.verdict) {
        judgmentData.verdict = judgmentData.verdict.replace(/\*\*/g, '');
      }
      if (judgmentData.reasoning) {
        judgmentData.reasoning = judgmentData.reasoning.replace(/\*\*/g, '');
      }
      if (judgmentData.solutions && Array.isArray(judgmentData.solutions)) {
        judgmentData.solutions = judgmentData.solutions.map((solution: string) => 
          solution.replace(/\*\*/g, '')
        );
      }
      
      // 필수 필드 검증
      if (!judgmentData.caseSummary || !judgmentData.verdict || !judgmentData.analysis) {
        throw new Error('Missing required fields in AI response');
      }
      
      return NextResponse.json({ 
        success: true,
        judgment: {
          ...judgmentData,
          analysis: {
            ...judgmentData.analysis,
            ...deepAnalysis // 심층 분석 데이터 추가
          }
        },
        metadata: {
          complexity: deepAnalysis.complexity,
          emotionalIndex: deepAnalysis.emotionalIndex,
          category: formData.category,
          judgeType: judgePersona.title,
          relationshipStage: deepAnalysis.relationshipStage,
          conflictPattern: deepAnalysis.conflictPattern,
          powerDynamics: deepAnalysis.powerDynamics
        }
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return createFallbackResponse(formData, deepAnalysis, judgePersona);
    }
    
  } catch (error) {
    console.error('Error in roomless judge API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate judgment' },
      { status: 500 }
    );
  }
}

async function performDeepAnalysis(formData: RoomlessFormData) {
  const description = formData.description.toLowerCase();
  const title = formData.title.toLowerCase();
  
  // 1단계: 기본 텍스트 분석
  const textAnalysis = analyzeTextPatterns(description, title);
  
  // 2단계: 심리적 패턴 분석
  const psychologyAnalysis = analyzePsychologicalPatterns(formData);
  
  // 3단계: 권력 역학 분석
  const powerDynamics = analyzePowerDynamics(formData);
  
  // 4단계: 갈등 맥락 분석
  const contextAnalysis = analyzeConflictContext(formData);
  
  // 5단계: 책임 비율 정밀 계산
  const responsibilityAnalysis = calculateResponsibilityRatio(formData, powerDynamics);
  
  return {
    ...textAnalysis,
    ...psychologyAnalysis,
    ...powerDynamics,
    ...contextAnalysis,
    ...responsibilityAnalysis
  };
}

function analyzeTextPatterns(description: string, title: string) {
  // 입력 텍스트의 성의, 감정 강도, 숨겨진 의미 분석
  const totalText = description + ' ' + title;
  
  // 성의도 분석
  const sincerity = analyzeSincerity(totalText);
  
  // 감정 강도 분석 (더 정교하게)
  const emotionalIntensity = analyzeEmotionalIntensity(totalText);
  
  // 복잡도 분석
  const complexity = analyzeComplexity(totalText, description.length);
  
  // 숨겨진 욕구 분석
  const hiddenNeeds = analyzeHiddenNeeds(totalText);
  
  return {
    sincerity,
    emotionalIndex: emotionalIntensity,
    complexity,
    hiddenNeeds
  };
}

function analyzeSincerity(text: string): number {
  // 성의 없는 입력의 특징들
  const lackOfSincerityIndicators = [
    text.length < 20, // 너무 짧음
    !text.includes('왜') && !text.includes('어떻게') && !text.includes('뭔가'), // 구체성 부족
    (text.match(/그냥|뭔가|음|어|아/g) || []).length > 3, // 애매한 표현 과다
    !text.includes('느') && !text.includes('생각') && !text.includes('마음') // 감정 표현 부족
  ];
  
  const sincerityScore = 100 - (lackOfSincerityIndicators.filter(Boolean).length * 20);
  return Math.max(10, sincerityScore);
}

function analyzeEmotionalIntensity(text: string): number {
  const veryStrongEmotions = ['폭력', '때', '맞', '폭행', '학대', '위협', '무서', '두려'];
  const strongEmotions = ['화나', '분노', '빡쳐', '짜증', '열받', '억울', '서러', '좌절', '미치'];
  const moderateEmotions = ['속상', '실망', '불만', '걱정', '불안', '답답', '힘들'];
  const relationshipThreats = ['헤어', '이별', '끝', '포기', '지쳐', '한계', '못살'];
  
  let intensity = 1;
  
  veryStrongEmotions.forEach(word => {
    intensity += (text.match(new RegExp(word, 'g')) || []).length * 3;
  });
  
  strongEmotions.forEach(word => {
    intensity += (text.match(new RegExp(word, 'g')) || []).length * 2;
  });
  
  moderateEmotions.forEach(word => {
    intensity += (text.match(new RegExp(word, 'g')) || []).length * 1;
  });
  
  relationshipThreats.forEach(word => {
    intensity += (text.match(new RegExp(word, 'g')) || []).length * 2.5;
  });
  
  return Math.min(10, Math.round(intensity));
}

function analyzeComplexity(text: string, length: number): string {
  const complexityFactors = [
    length > 300,
    (text.match(/그리고|또한|게다가|더욱이|하지만|그런데/g) || []).length > 3,
    text.includes('가족') || text.includes('친구') || text.includes('직장'),
    text.includes('돈') || text.includes('비용') || text.includes('경제'),
    text.includes('과거') || text.includes('전에') || text.includes('예전'),
    (text.match(/때문|원인|이유/g) || []).length > 2
  ];
  
  const score = complexityFactors.filter(Boolean).length;
  if (score >= 5) return '매우복잡';
  if (score >= 3) return '복잡';
  if (score >= 1) return '중간';
  return '단순';
}

function analyzeHiddenNeeds(text: string): string {
  if (text.includes('인정') || text.includes('존중') || text.includes('대우')) {
    return '인정과 존중에 대한 욕구';
  }
  if (text.includes('사랑') || text.includes('관심') || text.includes('애정')) {
    return '사랑과 애정에 대한 갈망';
  }
  if (text.includes('안전') || text.includes('보호') || text.includes('안심')) {
    return '안전과 보호에 대한 욕구';
  }
  if (text.includes('자유') || text.includes('독립') || text.includes('혼자')) {
    return '자율성과 독립에 대한 욕구';
  }
  if (text.includes('소통') || text.includes('대화') || text.includes('이해')) {
    return '진정한 소통과 이해에 대한 욕구';
  }
  return '기본적인 인간적 대우에 대한 욕구';
}

function analyzePsychologicalPatterns(formData: RoomlessFormData) {
  const description = formData.description.toLowerCase();
  
  // 피해자/가해자 패턴 분석
  const victimPatterns = analyzeVictimPatterns(description);
  const aggressorPatterns = analyzeAggressorPatterns(description);
  
  // 관계 단계 분석
  const relationshipStage = analyzeRelationshipStage(formData.duration, description);
  
  // 갈등 패턴 분석
  const conflictPattern = analyzeConflictPattern(description);
  
  return {
    victimPatterns,
    aggressorPatterns,
    relationshipStage,
    conflictPattern
  };
}

function analyzeVictimPatterns(description: string): string {
  if (description.includes('때') || description.includes('맞') || description.includes('폭력')) {
    return '신체적 폭력 피해 패턴 - 즉각적인 보호 조치 필요';
  }
  if (description.includes('무시') || description.includes('무관심') || description.includes('차갑')) {
    return '정서적 무시 패턴 - 자존감 회복이 우선';
  }
  if (description.includes('통제') || description.includes('감시') || description.includes('제한')) {
    return '통제적 관계 패턴 - 개인의 자율성 회복 필요';
  }
  if (description.includes('참') || description.includes('견디') || description.includes('포기')) {
    return '학습된 무력감 패턴 - 적극적 대응 능력 개발 필요';
  }
  return '일반적인 갈등 상황 - 소통 개선으로 해결 가능';
}

function analyzeAggressorPatterns(description: string): string {
  if (description.includes('화내') || description.includes('소리') || description.includes('고함')) {
    return '분노 조절 장애 패턴 - 전문적 치료 필요';
  }
  if (description.includes('무시') || description.includes('냉담') || description.includes('관심없')) {
    return '정서적 냉담 패턴 - 공감 능력 부족';
  }
  if (description.includes('자기') || description.includes('이기') || description.includes('내') && description.includes('만')) {
    return '자기중심적 사고 패턴 - 타인 관점 이해 부족';
  }
  if (description.includes('술') || description.includes('게임') || description.includes('중독')) {
    return '중독성 행동 패턴 - 근본적 문제 해결 필요';
  }
  return '일반적인 관계 미숙 패턴 - 관계 기술 학습 필요';
}

function analyzeRelationshipStage(duration: string, description: string): string {
  const durationLower = duration.toLowerCase();
  
  if (durationLower.includes('개월')) {
    const months = parseInt(durationLower);
    if (months < 3) return '초기 적응기 - 서로를 알아가는 단계';
    if (months < 6) return '안정화 시도기 - 갈등이 자연스러운 시기';
    if (months < 12) return '관계 정착기 - 진짜 모습이 드러나는 시기';
  } else if (durationLower.includes('년')) {
    const years = parseInt(durationLower);
    if (years < 2) return '심화기 - 진정한 이해가 필요한 시기';
    if (years < 5) return '성숙기 - 미래를 고민하는 시기';
    return '장기 관계 - 변화와 성장이 필요한 시기';
  } else if (durationLower.includes('주')) {
    return '매우 초기 - 성급한 갈등일 가능성';
  }
  
  return '관계 단계 파악 필요';
}

function analyzeConflictPattern(description: string): string {
  if (description.includes('또') || description.includes('계속') || description.includes('항상') || description.includes('맨날')) {
    return '만성적 반복 패턴 - 근본적 해결 필요';
  }
  if (description.includes('처음') || description.includes('갑자기') || description.includes('최근')) {
    return '돌발적 갈등 - 외부 요인 분석 필요';
  }
  if (description.includes('때때로') || description.includes('가끔') || description.includes('종종')) {
    return '간헐적 갈등 - 특정 상황 분석 필요';
  }
  if (description.includes('요즘') || description.includes('최근들어')) {
    return '최근 변화 갈등 - 환경 변화 고려 필요';
  }
  
  return '일회성 갈등 - 해결 가능성 높음';
}

function analyzePowerDynamics(formData: RoomlessFormData) {
  const description = formData.description.toLowerCase();
  
  // 권력 불균형 지표들
  const powerImbalanceIndicators = {
    physical: description.includes('때') || description.includes('폭력') || description.includes('위협'),
    economic: description.includes('돈') || description.includes('비용') || description.includes('경제'),
    emotional: description.includes('무시') || description.includes('차별') || description.includes('무관심'),
    social: description.includes('친구') || description.includes('가족') || description.includes('사람들'),
    control: description.includes('통제') || description.includes('감시') || description.includes('제한')
  };
  
  const powerLevel = Object.values(powerImbalanceIndicators).filter(Boolean).length;
  
  let powerDynamics = '균등한 관계';
  let dominantParty = 'none';
  
  if (powerLevel >= 3) {
    powerDynamics = '심각한 권력 불균형';
    dominantParty = 'defendant'; // 일반적으로 가해자가 피고
  } else if (powerLevel >= 2) {
    powerDynamics = '중간 수준 권력 불균형';
    dominantParty = 'defendant';
  } else if (powerLevel >= 1) {
    powerDynamics = '경미한 권력 불균형';
    dominantParty = 'defendant';
  }
  
  return {
    powerDynamics,
    dominantParty,
    powerLevel
  };
}

function analyzeConflictContext(formData: RoomlessFormData) {
  const description = formData.description.toLowerCase();
  
  // 갈등의 근본 원인 심층 분석
  let rootCause = '소통 부족';
  let solvability = 70;
  
  if (description.includes('폭력') || description.includes('때') || description.includes('맞')) {
    rootCause = '폭력적 행동 패턴';
    solvability = 20; // 폭력은 해결이 매우 어려움
  } else if (description.includes('바람') || description.includes('외도') || description.includes('다른')) {
    rootCause = '신뢰 파괴와 배신';
    solvability = 30;
  } else if (description.includes('돈') || description.includes('비용') || description.includes('경제')) {
    rootCause = '경제적 가치관 차이';
    solvability = 60;
  } else if (description.includes('가족') || description.includes('부모') || description.includes('집안')) {
    rootCause = '가족 간섭과 경계 문제';
    solvability = 50;
  } else if (description.includes('성격') || description.includes('습관') || description.includes('버릇')) {
    rootCause = '근본적 성격 불일치';
    solvability = 40;
  } else if (description.includes('미래') || description.includes('결혼') || description.includes('계획')) {
    rootCause = '인생 목표 불일치';
    solvability = 45;
  }
  
  return {
    rootCause,
    solvability: Math.max(15, Math.min(85, solvability))
  };
}

function calculateResponsibilityRatio(formData: RoomlessFormData, powerDynamics: any) {
  const description = formData.description.toLowerCase();
  
  // 기본값: 50:50
  let plaintiffFault = 50;
  let defendantFault = 50;
  
  // 폭력/학대 상황에서는 피해자 책임 최소화
  if (description.includes('폭력') || description.includes('때') || description.includes('맞') || 
      description.includes('폭행') || description.includes('학대') || description.includes('위협')) {
    plaintiffFault = 10; // 피해자는 최소 책임
    defendantFault = 90; // 가해자가 대부분 책임
  }
  // 바람/외도 상황
  else if (description.includes('바람') || description.includes('외도') || description.includes('다른')) {
    plaintiffFault = 20;
    defendantFault = 80;
  }
  // 권력 불균형이 심한 경우
  else if (powerDynamics.powerLevel >= 3) {
    plaintiffFault = 25;
    defendantFault = 75;
  }
  // 중간 수준 권력 불균형
  else if (powerDynamics.powerLevel >= 2) {
    plaintiffFault = 35;
    defendantFault = 65;
  }
  // 원고가 자신의 잘못을 많이 인정하는 경우
  else {
    const selfBlameWords = ['내가', '제가', '저는', '나는', '잘못', '미안'];
    const otherBlameWords = ['상대방', '걔가', '그가', '그녀가', '때문', '탓'];
    
    let selfBlameCount = 0;
    let otherBlameCount = 0;
    
    selfBlameWords.forEach(word => {
      selfBlameCount += (description.match(new RegExp(word, 'g')) || []).length;
    });
    
    otherBlameWords.forEach(word => {
      otherBlameCount += (description.match(new RegExp(word, 'g')) || []).length;
    });
    
    if (selfBlameCount > otherBlameCount + 2) {
      plaintiffFault = Math.min(70, 50 + (selfBlameCount - otherBlameCount) * 5);
    } else if (otherBlameCount > selfBlameCount + 2) {
      plaintiffFault = Math.max(30, 50 - (otherBlameCount - selfBlameCount) * 5);
    }
    
    defendantFault = 100 - plaintiffFault;
  }
  
  return {
    plaintiffFault: Math.round(plaintiffFault),
    defendantFault: Math.round(defendantFault)
  };
}

function createDeepAnalysisPrompt(formData: RoomlessFormData, analysis: any, persona: any): string {
  const baseContext = `
당신은 ${persona.title}입니다.
성격: ${persona.personality}
말투: ${persona.speechStyle}
분석 방식: ${persona.analysisStyle}

심층 분석 결과:
- 입력 성의도: ${analysis.sincerity}%
- 감정 강도: ${analysis.emotionalIndex}/10
- 갈등 복잡도: ${analysis.complexity}
- 권력 역학: ${analysis.powerDynamics}
- 피해자 패턴: ${analysis.victimPatterns}
- 가해자 패턴: ${analysis.aggressorPatterns}
- 숨겨진 욕구: ${analysis.hiddenNeeds}
- 관계 단계: ${analysis.relationshipStage}
- 갈등 패턴: ${analysis.conflictPattern}

사건 정보:
- 제목: ${formData.title}
- 관계: ${formData.relationship} (기간: ${formData.duration})
- 카테고리: ${formData.category}
- 키워드: ${formData.tags.join(', ')}

당사자:
- 원고: ${formData.plaintiff}
- 피고: ${formData.defendant}

갈등 상황:
${formData.description}
`;

  let intensityPrompt = '';
  
  switch (formData.intensity) {
    case '순한맛':
      intensityPrompt = `
${baseContext}

당신은 깊은 공감과 치유 능력을 가진 전문가입니다. 다음 원칙으로 분석하세요:

1. 표면적 갈등 뒤의 진짜 상처와 트라우마를 파악하세요
2. 양쪽 모두의 내면 깊은 곳의 두려움과 욕구를 이해하세요
3. 관계 회복 가능성과 치유의 방향을 제시하세요
4. 따뜻하고 위로가 되는 말투로 희망을 전하세요
5. 실질적이고 단계적인 치유 과정을 제안하세요

단, 폭력이나 학대 상황에서는 안전을 최우선으로 하되, 따뜻한 말투를 유지하세요.

말투: "마음이 많이 아프셨겠어요", "이런 상황에서 느끼시는 감정들이 너무나 자연스러워요", "함께 천천히 해결해나가요"
`;
      break;
      
    case '매운맛':
      intensityPrompt = `
${baseContext}

당신은 현실을 적나라하게 드러내는 독설가입니다. 다음 원칙으로 분석하세요:

1. 자기기만과 현실도피를 가차없이 폭로하세요
2. 불편한 진실을 직설적으로 말하세요
3. 각성을 위한 충격 요법을 사용하세요
4. 변명과 합리화를 박살내세요
5. 행동 변화를 강력하게 촉구하세요

말투: 디시인사이드 스타일이지만 선은 지키세요. "현실 좀 보자", "정신차려", "이게 정상이냐", "꿈 깨", "팩트는"
폭력 상황에서는 더욱 강력하게: "이게 연애냐 폭행이지", "당장 신고해", "니 목숨이 더 소중하다"
`;
      break;
      
    default: // 중간맛
      intensityPrompt = `
${baseContext}

당신은 균형잡힌 전문가로서 객관적이고 건설적으로 분석하세요:

1. 양쪽의 입장을 공정하게 분석하세요
2. 현실적이면서도 희망적인 해결책을 제시하세요
3. 전문적 근거를 바탕으로 조언하세요
4. 관계 개선을 위한 구체적 방향을 제시하세요
5. 냉정하지만 따뜻한 시각을 유지하세요

말투: 전문적이지만 친근하게, 공정하지만 인간적으로
`;
  }

  return `${intensityPrompt}

중요: 다음 JSON 형식으로만 응답하고, 마크다운 문법을 절대 사용하지 마세요:

{
  "caseSummary": "사건을 한 문장으로 요약 (마크다운 없이)",
  "analysis": {
    "complexity": "${analysis.complexity}",
    "emotionalIndex": ${analysis.emotionalIndex},
    "solvability": ${analysis.solvability},
    "rootCause": "${analysis.rootCause}",
    "relationshipDynamics": "권력 구조와 상호작용 패턴을 구체적으로 분석 (교과서적 내용 금지)",
    "psychologicalPattern": "양쪽의 심리적 패턴과 행동 동기를 깊이 있게 분석 (일반론 금지)",
    "communicationIssues": "소통 문제의 구체적 원인과 패턴 분석 (피상적 분석 금지)",
    "underlyingNeeds": "표면 갈등 뒤의 진짜 욕구와 두려움 파악 (${analysis.hiddenNeeds}를 구체화)"
  },
  "verdict": "위 강도와 말투에 맞춰 판결 내용을 4-5문장으로 (마크다운 없이, 구체적이고 현실적으로)",
  "reasoning": "판결 근거를 3-4문장으로 상세히 (일반론 아닌 이 사건만의 특수성 반영)",
  "solutions": [
    "즉시 실행할 수 있는 구체적 행동 (교과서적 답변 금지)",
    "단기간 내 개선 방법 (실제 실행 가능한 구체적 방법)",
    "중기 관계 발전 방향 (이 커플만의 맞춤형 솔루션)",
    "장기적 관계 비전과 목표 (현실적이고 구체적인 방향)"
  ],
  "responsibilityRatio": {
    "plaintiff": ${analysis.plaintiffFault},
    "defendant": ${analysis.defendantFault}
  },
  "coreAdvice": "가장 중요한 핵심 조언 한 문장 (일반론 아닌 맞춤형 조언)",
  "finalMessage": "위 강도와 말투에 맞춰 마무리 메시지 (마크다운 없이)"
}

절대 규칙:
1. 마크다운 문법 사용 금지 (**, *, #, - 등)
2. 교과서적, 일반론적 답변 금지
3. 이 사건의 특수성을 반영한 맞춤형 분석
4. 구체적이고 실행 가능한 해결책 제시
5. 폭력/학대 상황에서는 피해자 보호 우선`;
}

function getAdvancedJudgePersona(character: string, intensity: string) {
  const personas: Record<string, Record<string, any>> = {
    판사: {
      순한맛: {
        title: '마음을 읽는 치유형 판사',
        personality: '깊은 공감과 치유 능력을 가진 따뜻한 전문가',
        speechStyle: '부드럽고 위로가 되는 치유적 말투',
        analysisStyle: '트라우마와 내면 상처까지 고려한 전인적 분석'
      },
      중간맛: {
        title: '균형잡힌 현명한 판사',
        personality: '공정하고 논리적이며 건설적인 해결사',
        speechStyle: '전문적이면서도 인간적인 균형잡힌 말투',
        analysisStyle: '객관적 사실과 감정을 종합한 체계적 분석'
      },
      매운맛: {
        title: '현실 폭격 독설 판사',
        personality: '자기기만을 박살내는 현실주의 각성 전문가',
        speechStyle: '디시인사이드 스타일의 직설적이고 충격적인 말투',
        analysisStyle: '불편한 진실을 적나라하게 드러내는 냉혹한 분석'
      }
    },
    상담사: {
      순한맛: {
        title: '마음을 어루만지는 힐링 상담사',
        personality: '무조건적 수용과 깊은 공감을 제공하는 치료사',
        speechStyle: '치유적이고 포용적인 따뜻한 말투',
        analysisStyle: '트라우마와 내면의 상처까지 고려한 전인적 분석'
      },
      중간맛: {
        title: '통찰력 있는 전문 상담사',
        personality: '심리학적 전문성과 인간적 따뜻함을 겸비한 전문가',
        speechStyle: '전문적이면서도 공감적인 상담 말투',
        analysisStyle: '심리학 이론에 기반한 과학적이고 체계적인 분석'
      },
      매운맛: {
        title: '각성시키는 현실 상담사',
        personality: '변화를 위해 불편한 진실도 직면시키는 도전적 상담사',
        speechStyle: '도전적이고 자극적인 각성 유도 말투',
        analysisStyle: '방어기제를 뚫고 핵심 문제를 파헤치는 날카로운 분석'
      }
    },
    친구: {
      순한맛: {
        title: '마음을 알아주는 베스트 프렌드',
        personality: '무엇이든 들어주고 위로해주는 최고의 친구',
        speechStyle: '친근하고 다정한 절친 말투',
        analysisStyle: '친구의 마음을 헤아리는 감정 중심의 따뜻한 분석'
      },
      중간맛: {
        title: '진실을 말하는 진짜 친구',
        personality: '솔직하지만 애정 어린 조언을 하는 신뢰할 수 있는 친구',
        speechStyle: '진솔하고 진심 어린 친구 말투',
        analysisStyle: '친구로서의 애정과 객관성을 균형있게 담은 분석'
      },
      매운맛: {
        title: '팩트폭격 독설 친구',
        personality: '쓴소리도 마다않는 진짜 현실 친구',
        speechStyle: '거침없고 직설적인 디시 말투의 독설 친구',
        analysisStyle: '친구답게 가차없이 현실을 까발리는 냉정한 분석'
      }
    }
  };
  
  return personas[character]?.[intensity] || personas.판사.중간맛;
}

function createFallbackResponse(formData: RoomlessFormData, analysis: any, persona: any) {
  return NextResponse.json({ 
    success: true,
    judgment: {
      caseSummary: `${formData.title}에 대한 ${formData.relationship} 갈등 상황`,
      analysis: {
        complexity: analysis.complexity,
        emotionalIndex: analysis.emotionalIndex,
        solvability: analysis.solvability,
        rootCause: analysis.rootCause,
        relationshipDynamics: "시스템 오류로 상세 분석을 완료하지 못했습니다",
        psychologicalPattern: "심리적 패턴 분석이 필요합니다",
        communicationIssues: "소통 방식 개선이 필요합니다",
        underlyingNeeds: analysis.hiddenNeeds
      },
      verdict: "시스템 오류로 인해 상세 판결을 생성할 수 없었습니다. 다시 시도해 주세요.",
      reasoning: "AI 응답 파싱 중 오류가 발생했습니다.",
      solutions: [
        "상황을 차분히 다시 정리해보세요",
        "전문가의 도움을 받는 것을 고려해보세요",
        "안전을 최우선으로 생각하세요",
        "건강한 관계를 위한 기준을 세워보세요"
      ],
      responsibilityRatio: {
        plaintiff: analysis.plaintiffFault,
        defendant: analysis.defendantFault
      },
      coreAdvice: "무엇보다 본인의 안전과 행복이 가장 중요합니다",
      finalMessage: "차근차근 해결해 나가시길 바랍니다"
    },
    metadata: {
      complexity: analysis.complexity,
      emotionalIndex: analysis.emotionalIndex,
      category: formData.category,
      judgeType: persona.title,
      relationshipStage: analysis.relationshipStage,
      conflictPattern: analysis.conflictPattern,
      powerDynamics: analysis.powerDynamics
    }
  });
} 