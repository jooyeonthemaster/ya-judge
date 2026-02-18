import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ExtendedVerdictData,
  ExtendedPersonalizedResponse,
  ExpandedDimensionalScores,
  FaultEvidence,
  BehavioralPattern,
  CommunicationStyle,
  PenaltyInfo,
  GiftSuggestion,
  StakeholderMap,
  ConflictTimeline,
  FaultSummary,
  VerdictConfidence,
} from '@/types/verdict';

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

// ==================== POST Handler ====================

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
      cleanedResponse = cleanedResponse.replace(/\*\*/g, '');

      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }

      const judgmentData = JSON.parse(cleanedResponse);

      // 마크다운 제거 후처리 (재귀적)
      deepCleanMarkdown(judgmentData);

      // 필수 필드 검증
      if (!judgmentData.caseSummary || !judgmentData.verdict || !judgmentData.responses) {
        throw new Error('Missing required fields in AI response');
      }

      // ExtendedVerdictData 변환
      const extendedVerdictData = transformToExtendedVerdictData(judgmentData, formData, deepAnalysis);

      return NextResponse.json({
        success: true,
        judgment: {
          ...judgmentData,
          analysis: {
            ...(judgmentData.analysis || {}),
            ...deepAnalysis
          }
        },
        extendedVerdictData,
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

// ==================== Transform AI Response to ExtendedVerdictData ====================

function transformToExtendedVerdictData(
  raw: any,
  _formData: RoomlessFormData,
  deepAnalysis: any
): ExtendedVerdictData {
  // Build responses array
  const responses: ExtendedPersonalizedResponse[] = (raw.responses || []).map((r: any) => {
    const expandedScores: ExpandedDimensionalScores = r.expandedScores
      ? {
          emotional: clampScore(r.expandedScores.emotional),
          logical: clampScore(r.expandedScores.logical),
          communication: clampScore(r.expandedScores.communication),
          empathy: clampScore(r.expandedScores.empathy),
          responsibility: clampScore(r.expandedScores.responsibility),
          moralEthical: clampScore(r.expandedScores.moralEthical),
          emotionalMaturity: clampScore(r.expandedScores.emotionalMaturity),
          conflictContribution: clampScore(r.expandedScores.conflictContribution),
          growthPotential: clampScore(r.expandedScores.growthPotential),
        }
      : defaultExpandedScores();

    const faults: FaultEvidence[] = (r.faults || []).map((f: any, idx: number) => ({
      id: f.id || `fault-${r.targetUser}-${idx}`,
      targetPerson: f.targetPerson || r.targetUser,
      category: validateFaultCategory(f.category),
      quote: f.quote || undefined,
      behavior: f.behavior || '행동 미상',
      severity: validateSeverity(f.severity),
      impact: f.impact || '영향 미상',
    }));

    const behavioralPatterns: BehavioralPattern[] = (r.behavioralPatterns || []).map((bp: any) => ({
      pattern: bp.pattern || '패턴 미상',
      category: validatePatternCategory(bp.category),
      frequency: validateFrequency(bp.frequency),
      examples: Array.isArray(bp.examples) ? bp.examples : [],
      recommendation: bp.recommendation || '',
    }));

    const communicationStyle: CommunicationStyle | undefined = r.communicationStyle
      ? {
          primary: r.communicationStyle.primary || '미분류',
          secondary: r.communicationStyle.secondary || undefined,
          strengths: Array.isArray(r.communicationStyle.strengths) ? r.communicationStyle.strengths : [],
          weaknesses: Array.isArray(r.communicationStyle.weaknesses) ? r.communicationStyle.weaknesses : [],
          triggers: Array.isArray(r.communicationStyle.triggers) ? r.communicationStyle.triggers : [],
        }
      : undefined;

    const penaltyInfo: PenaltyInfo | undefined =
      r.penaltyInfo && r.penaltyInfo.amount > 0
        ? {
            amount: r.penaltyInfo.amount,
            reason: r.penaltyInfo.reason || '사유 미상',
            description: r.penaltyInfo.description || '',
          }
        : undefined;

    const dimensionalScores = {
      emotional: expandedScores.emotional,
      logical: expandedScores.logical,
      communication: expandedScores.communication,
      empathy: expandedScores.empathy,
      responsibility: expandedScores.responsibility,
    };

    return {
      targetUser: r.targetUser || '미상',
      analysis: r.analysis || '분석 없음',
      message: r.message || '메시지 없음',
      style: r.style || '미분류',
      percentage: typeof r.percentage === 'number' ? r.percentage : 50,
      reasoning: Array.isArray(r.reasoning) ? r.reasoning : [],
      punishment: r.punishment || '없음',
      dimensionalScores,
      expandedScores,
      faults,
      behavioralPatterns,
      communicationStyle,
      penaltyInfo,
    } as ExtendedPersonalizedResponse;
  });

  // Build verdict object
  const verdictObj = raw.verdict || {};
  const verdict: ExtendedVerdictData['verdict'] = {
    summary: typeof verdictObj === 'string' ? verdictObj : (verdictObj.summary || '판결 요약 없음'),
    conflict_root_cause: typeof verdictObj === 'string'
      ? (deepAnalysis.rootCause || '근본 원인 미상')
      : (verdictObj.conflict_root_cause || deepAnalysis.rootCause || '근본 원인 미상'),
    recommendation: typeof verdictObj === 'string'
      ? '상세 권고를 생성하지 못했습니다.'
      : (verdictObj.recommendation || '권고 사항 없음'),
    giftSuggestions: parseGiftSuggestions(
      typeof verdictObj === 'string' ? raw.giftSuggestions : (verdictObj.giftSuggestions || raw.giftSuggestions)
    ),
    overallSeverity: validateOverallSeverity(
      typeof verdictObj === 'string' ? undefined : verdictObj.overallSeverity
    ),
    keyInsights: Array.isArray(typeof verdictObj === 'string' ? raw.keyInsights : verdictObj.keyInsights)
      ? (typeof verdictObj === 'string' ? raw.keyInsights : verdictObj.keyInsights)
      : [],
    relationshipPrognosis: typeof verdictObj === 'string'
      ? (raw.relationshipPrognosis || undefined)
      : (verdictObj.relationshipPrognosis || undefined),
  };

  // Build stakeholderMap
  const validRoles = ['primary', 'secondary', 'witness', 'mentioned'];
  const validRelTypes = ['romantic', 'family', 'friend', 'colleague', 'acquaintance', 'conflict'];
  const validQualities = ['positive', 'neutral', 'negative', 'complicated'];

  const stakeholderMap: StakeholderMap | undefined = raw.stakeholderMap
    ? (() => {
        const stakeholders = (raw.stakeholderMap.stakeholders || []).map((s: any) => ({
          id: s.id || `person-${Math.random().toString(36).slice(2, 6)}`,
          name: s.name || '미상',
          role: validRoles.includes(s.role) ? s.role : 'secondary',
          relationship: s.relationship || '',
          involvementLevel: typeof s.involvementLevel === 'number' ? Math.max(0, Math.min(100, s.involvementLevel)) : 50,
          description: s.description || '',
        }));

        const stakeholderIds = new Set(stakeholders.map((s: any) => s.id));

        // Filter out relationships referencing non-existent stakeholders
        const relationships = (raw.stakeholderMap.relationships || [])
          .filter((r: any) => r.from && r.to && stakeholderIds.has(r.from) && stakeholderIds.has(r.to))
          .map((r: any) => ({
            from: r.from,
            to: r.to,
            type: validRelTypes.includes(r.type) ? r.type : 'acquaintance',
            quality: validQualities.includes(r.quality) ? r.quality : 'complicated',
            description: r.description || '',
          }));

        return { stakeholders, relationships };
      })()
    : undefined;

  // Build conflictTimeline
  const conflictTimeline: ConflictTimeline | undefined = raw.conflictTimeline
    ? {
        events: (raw.conflictTimeline.events || []).map((e: any) => ({
          id: e.id || `evt-${e.order}`,
          order: e.order || 0,
          type: e.type || 'trigger',
          title: e.title || '',
          description: e.description || '',
          involvedParties: Array.isArray(e.involvedParties) ? e.involvedParties : [],
          emotionalImpact: typeof e.emotionalImpact === 'number' ? e.emotionalImpact : -50,
        })),
        totalDuration: raw.conflictTimeline.totalDuration || '미상',
        peakMoment: raw.conflictTimeline.peakMoment || '미상',
        resolutionAttempts: raw.conflictTimeline.resolutionAttempts || 0,
      }
    : undefined;

  // Build faultSummaries
  const faultSummaries: FaultSummary[] | undefined = Array.isArray(raw.faultSummaries)
    ? raw.faultSummaries.map((fs: any) => ({
        person: fs.person || '미상',
        totalFaults: fs.totalFaults || 0,
        faultsBySeverity: fs.faultsBySeverity || { minor: 0, moderate: 0, serious: 0, critical: 0 },
        mainIssues: Array.isArray(fs.mainIssues) ? fs.mainIssues : [],
      }))
    : undefined;

  // Build verdictConfidence
  const verdictConfidence: VerdictConfidence | undefined = raw.verdictConfidence
    ? {
        overall: raw.verdictConfidence.overall || 0,
        factors: {
          evidenceQuality: raw.verdictConfidence.factors?.evidenceQuality || 0,
          informationCompleteness: raw.verdictConfidence.factors?.informationCompleteness || 0,
          patternClarity: raw.verdictConfidence.factors?.patternClarity || 0,
          contextUnderstanding: raw.verdictConfidence.factors?.contextUnderstanding || 0,
        },
        limitations: Array.isArray(raw.verdictConfidence.limitations) ? raw.verdictConfidence.limitations : [],
      }
    : undefined;

  return {
    responses,
    verdict,
    stakeholderMap,
    conflictTimeline,
    faultSummaries,
    verdictConfidence,
  };
}

// ==================== Validation Helpers ====================

function clampScore(val: any): number {
  const n = typeof val === 'number' ? val : 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function defaultExpandedScores(): ExpandedDimensionalScores {
  return {
    emotional: 50, logical: 50, communication: 50, empathy: 50, responsibility: 50,
    moralEthical: 50, emotionalMaturity: 50, conflictContribution: 50, growthPotential: 50,
  };
}

function validateFaultCategory(cat: any): FaultEvidence['category'] {
  const valid = ['communication', 'emotional', 'behavioral', 'moral', 'responsibility'];
  return valid.includes(cat) ? cat : 'behavioral';
}

function validateSeverity(sev: any): FaultEvidence['severity'] {
  const valid = ['minor', 'moderate', 'serious', 'critical'];
  return valid.includes(sev) ? sev : 'moderate';
}

function validatePatternCategory(cat: any): BehavioralPattern['category'] {
  const valid = ['positive', 'negative', 'neutral'];
  return valid.includes(cat) ? cat : 'neutral';
}

function validateFrequency(freq: any): BehavioralPattern['frequency'] {
  const valid = ['rare', 'occasional', 'frequent', 'constant'];
  return valid.includes(freq) ? freq : 'occasional';
}

function validateOverallSeverity(sev: any): 'low' | 'medium' | 'high' | 'critical' {
  const valid = ['low', 'medium', 'high', 'critical'];
  return valid.includes(sev) ? sev : 'medium';
}

function parseGiftSuggestions(arr: any): GiftSuggestion[] | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr.map((g: any) => ({
    item: g.item || '선물',
    price: g.price || 10000,
    reason: g.reason || '',
    category: g.category || 'medium',
  }));
}

function deepCleanMarkdown(obj: any): void {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        obj[i] = obj[i].replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '');
      } else {
        deepCleanMarkdown(obj[i]);
      }
    }
    return;
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '');
      } else {
        deepCleanMarkdown(obj[key]);
      }
    }
  }
}

// ==================== Deep Analysis Pipeline ====================

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
  const totalText = description + ' ' + title;

  const sincerity = analyzeSincerity(totalText);
  const emotionalIntensity = analyzeEmotionalIntensity(totalText);
  const complexity = analyzeComplexity(totalText, description.length);
  const hiddenNeeds = analyzeHiddenNeeds(totalText);

  return {
    sincerity,
    emotionalIndex: emotionalIntensity,
    complexity,
    hiddenNeeds
  };
}

function analyzeSincerity(text: string): number {
  const lackOfSincerityIndicators = [
    text.length < 20,
    !text.includes('왜') && !text.includes('어떻게') && !text.includes('뭔가'),
    (text.match(/그냥|뭔가|음|어|아/g) || []).length > 3,
    !text.includes('느') && !text.includes('생각') && !text.includes('마음')
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

  const victimPatterns = analyzeVictimPatterns(description);
  const aggressorPatterns = analyzeAggressorPatterns(description);
  const relationshipStage = analyzeRelationshipStage(formData.duration, description);
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

function analyzeRelationshipStage(duration: string, _description: string): string {
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
    dominantParty = 'defendant';
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

  let rootCause = '소통 부족';
  let solvability = 70;

  if (description.includes('폭력') || description.includes('때') || description.includes('맞')) {
    rootCause = '폭력적 행동 패턴';
    solvability = 20;
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

  let plaintiffFault = 50;
  let defendantFault = 50;

  if (description.includes('폭력') || description.includes('때') || description.includes('맞') ||
      description.includes('폭행') || description.includes('학대') || description.includes('위협')) {
    plaintiffFault = 10;
    defendantFault = 90;
  }
  else if (description.includes('바람') || description.includes('외도') || description.includes('다른')) {
    plaintiffFault = 20;
    defendantFault = 80;
  }
  else if (powerDynamics.powerLevel >= 3) {
    plaintiffFault = 25;
    defendantFault = 75;
  }
  else if (powerDynamics.powerLevel >= 2) {
    plaintiffFault = 35;
    defendantFault = 65;
  }
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

// ==================== Prompt Generation ====================

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
- 근본 원인: ${analysis.rootCause}
- 해결 가능성: ${analysis.solvability}%

사건 정보:
- 제목: ${formData.title}
- 관계: ${formData.relationship} (기간: ${formData.duration})
- 카테고리: ${formData.category}
- 키워드: ${formData.tags.join(', ')}

당사자:
- 원고 (신청인): ${formData.plaintiff}
- 피고 (상대방): ${formData.defendant}

갈등 상황 설명:
${formData.description}
`;

  let toneDirective = '';

  switch (formData.intensity) {
    case '순한맛':
      toneDirective = `
당신은 깊은 공감과 치유 능력을 가진 전문가입니다. 다음 원칙을 따르세요:
1. 표면적 갈등 뒤의 진짜 상처와 트라우마를 파악
2. 양쪽 모두의 내면 깊은 곳의 두려움과 욕구를 이해
3. 관계 회복 가능성과 치유의 방향을 제시
4. 따뜻하고 위로가 되는 말투로 희망을 전달
5. 실질적이고 단계적인 치유 과정을 제안

message 필드에서 사용할 말투 예시:
- "마음이 많이 아프셨겠어요..."
- "이런 상황에서 느끼시는 감정들이 너무나 자연스러워요"
- "함께 천천히 해결해나가요"
- 이모지를 적절히 사용: 💛🌱✨🤗💕

단, 폭력이나 학대 상황에서는 안전을 최우선으로 하되, 따뜻한 말투를 유지하세요.
`;
      break;

    case '매운맛':
      toneDirective = `
당신은 현실을 적나라하게 드러내는 독설가입니다. 다음 원칙을 따르세요:
1. 자기기만과 현실도피를 가차없이 폭로
2. 불편한 진실을 직설적으로 전달
3. 각성을 위한 충격 요법 사용
4. 변명과 합리화를 박살
5. 행동 변화를 강력하게 촉구

message 필드에서 사용할 말투 예시:
- "현실 좀 보자고. 이게 연애야 봉사활동이야?"
- "정신차려. 지금 니 상황이 정상인 줄 알아?"
- "팩트 폭격 갑니다"
- 이모지를 적절히 사용: 🔥💀⚡🚨😤

폭력 상황에서는 더욱 강력하게:
- "이게 연애냐 폭행이지. 당장 신고해"
- "니 목숨이 더 소중하다"
`;
      break;

    default: // 중간맛
      toneDirective = `
당신은 균형잡힌 전문가로서 객관적이고 건설적으로 분석하세요:
1. 양쪽의 입장을 공정하게 분석
2. 현실적이면서도 희망적인 해결책 제시
3. 전문적 근거를 바탕으로 조언
4. 관계 개선을 위한 구체적 방향 제시
5. 냉정하지만 따뜻한 시각 유지

message 필드에서 사용할 말투: 전문적이지만 친근하게, 공정하지만 인간적으로.
이모지를 적절히 활용: ⚖️🤔💡📊✅
`;
  }

  return `${baseContext}

${toneDirective}

중요: 다음 JSON 형식으로만 응답하세요. 마크다운 문법을 절대 사용하지 마세요 (**, *, # 등 금지).
JSON 바깥에 어떤 텍스트도 포함하지 마세요.

핵심 원칙:
- "responses" 배열에서 각 사람을 그 사람의 관점에서 개별 분석하세요
- 각 사람에게 보내는 message는 그 사람의 소통 스타일과 성격에 맞게 개인화하세요
- 각 사람의 심리적 동기, 두려움, 방어기제를 깊이 분석하세요
- 설명에서 추론 가능한 구체적 행동/발언을 quote로 인용하세요 (실제 채팅이 아니므로 설명에서 추론)
- 두 사람의 percentage 합은 반드시 100이 되어야 합니다
- 각 사람에게 최소 5개의 구체적 reasoning을 제공하세요
- expandedScores는 9개 차원 각각 0-100으로 매기되, 근거 없이 중간값을 남발하지 마세요
- faults에는 설명에서 추론 가능한 구체적 행동만 포함하세요

{
  "caseSummary": "사건을 한 문장으로 요약 (구체적으로, 당사자 이름 포함)",

  "responses": [
    {
      "targetUser": "${formData.plaintiff}",
      "analysis": "${formData.plaintiff}님에 대한 심층 심리 분석 (200자 이상). 이 사람의 내면 동기, 두려움, 방어기제, 관계에서의 역할을 구체적으로 분석. 일반론 금지, 이 사건의 특수성만 반영.",
      "message": "${formData.plaintiff}님에게 전하는 개인화된 메시지 (150자 이상, 이모지 포함). 이 사람의 소통 스타일에 맞춰 작성. 위 강도(${formData.intensity})에 맞는 말투 사용.",
      "style": "${formData.plaintiff}님의 소통 스타일 한 단어 요약 (예: 회피형, 공격형, 수동공격형, 논리형, 감정호소형 등)",
      "percentage": ${analysis.plaintiffFault},
      "reasoning": [
        "${formData.plaintiff}님의 구체적 과실/책임 근거 1 (이 사건에서 추론 가능한 구체적 행동)",
        "구체적 과실/책임 근거 2",
        "구체적 과실/책임 근거 3",
        "구체적 과실/책임 근거 4",
        "구체적 과실/책임 근거 5"
      ],
      "punishment": "${formData.plaintiff}님을 위한 개인화된 개선 권고 (구체적이고 실행 가능한 방법, 이 사람의 성격과 상황에 맞춰)",
      "expandedScores": {
        "emotional": 0,
        "logical": 0,
        "communication": 0,
        "empathy": 0,
        "responsibility": 0,
        "moralEthical": 0,
        "emotionalMaturity": 0,
        "conflictContribution": 0,
        "growthPotential": 0
      },
      "faults": [
        {
          "id": "pf1",
          "targetPerson": "${formData.plaintiff}",
          "category": "communication|emotional|behavioral|moral|responsibility 중 하나",
          "quote": "설명에서 추론한 이 사람의 발언이나 행동 인용 (없으면 null)",
          "behavior": "구체적 과실 행동 설명",
          "severity": "minor|moderate|serious|critical 중 하나",
          "impact": "이 과실이 갈등에 미친 구체적 영향"
        }
      ],
      "behavioralPatterns": [
        {
          "pattern": "패턴명 (구체적으로)",
          "category": "positive|negative|neutral 중 하나",
          "frequency": "rare|occasional|frequent|constant 중 하나",
          "examples": ["이 사건에서의 구체적 사례"],
          "recommendation": "개선 방안"
        }
      ],
      "communicationStyle": {
        "primary": "주된 소통 유형 (공격적/회피적/수동공격적/논리적/감정호소적/건설적 등)",
        "secondary": "보조 소통 유형 (없으면 null)",
        "strengths": ["소통의 강점 1", "강점 2"],
        "weaknesses": ["소통의 약점 1", "약점 2"],
        "triggers": ["소통 파괴 트리거 1", "트리거 2"]
      },
      "penaltyInfo": null
    },
    {
      "targetUser": "${formData.defendant}",
      "analysis": "${formData.defendant}님에 대한 심층 심리 분석 (200자 이상). 이 사람의 내면 동기, 두려움, 방어기제, 관계에서의 역할을 구체적으로 분석. 일반론 금지.",
      "message": "${formData.defendant}님에게 전하는 개인화된 메시지 (150자 이상, 이모지 포함). 이 사람의 소통 스타일에 맞춰 작성. 위 강도(${formData.intensity})에 맞는 말투 사용.",
      "style": "${formData.defendant}님의 소통 스타일 한 단어 요약",
      "percentage": ${analysis.defendantFault},
      "reasoning": [
        "${formData.defendant}님의 구체적 과실/책임 근거 1",
        "구체적 과실/책임 근거 2",
        "구체적 과실/책임 근거 3",
        "구체적 과실/책임 근거 4",
        "구체적 과실/책임 근거 5"
      ],
      "punishment": "${formData.defendant}님을 위한 개인화된 개선 권고 (구체적이고 실행 가능한 방법)",
      "expandedScores": {
        "emotional": 0,
        "logical": 0,
        "communication": 0,
        "empathy": 0,
        "responsibility": 0,
        "moralEthical": 0,
        "emotionalMaturity": 0,
        "conflictContribution": 0,
        "growthPotential": 0
      },
      "faults": [
        {
          "id": "df1",
          "targetPerson": "${formData.defendant}",
          "category": "communication|emotional|behavioral|moral|responsibility 중 하나",
          "quote": "설명에서 추론한 이 사람의 발언이나 행동 인용 (없으면 null)",
          "behavior": "구체적 과실 행동 설명",
          "severity": "minor|moderate|serious|critical 중 하나",
          "impact": "이 과실이 갈등에 미친 구체적 영향"
        }
      ],
      "behavioralPatterns": [
        {
          "pattern": "패턴명",
          "category": "positive|negative|neutral 중 하나",
          "frequency": "rare|occasional|frequent|constant 중 하나",
          "examples": ["구체적 사례"],
          "recommendation": "개선 방안"
        }
      ],
      "communicationStyle": {
        "primary": "주된 소통 유형",
        "secondary": "보조 소통 유형 (없으면 null)",
        "strengths": ["강점"],
        "weaknesses": ["약점"],
        "triggers": ["트리거"]
      },
      "penaltyInfo": null
    }
  ],

  "verdict": {
    "summary": "종합 판결문 (300자 이상). 양측의 잘못과 상황을 균형있게 분석하고, 이 사건만의 특수성을 반영한 맞춤형 판결. 위 강도(${formData.intensity})에 맞는 말투 사용. 마크다운 금지.",
    "conflict_root_cause": "갈등의 진짜 근본 원인 심층 분석 (표면적 이유가 아닌 깊은 심리적/관계적 원인)",
    "recommendation": "관계 개선을 위한 구체적 권고사항 (200자 이상). 즉시 실행 가능하고 이 커플에게 맞춤화된 솔루션. 교과서적 답변 금지.",
    "keyInsights": [
      "핵심 통찰 1: 표면 아래 진짜 문제 (이 사건만의 독특한 통찰)",
      "핵심 통찰 2: 양측이 인식하지 못하는 패턴",
      "핵심 통찰 3: 관계 역학의 핵심"
    ],
    "relationshipPrognosis": "현재 상태로 봤을 때 관계 예후와 향후 전망 (구체적으로)",
    "giftSuggestions": [
      { "item": "소소한 선물 이름 (5000원 이하)", "price": 5000, "reason": "추천 이유", "category": "small" },
      { "item": "적당한 선물 이름 (1~2만원)", "price": 15000, "reason": "추천 이유", "category": "medium" },
      { "item": "진심어린 선물 이름 (3만원+)", "price": 35000, "reason": "추천 이유", "category": "large" }
    ],
    "overallSeverity": "low|medium|high|critical 중 하나"
  },

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

  "stakeholderMap": {
    "stakeholders": [
      {
        "id": "plaintiff",
        "name": "${formData.plaintiff}",
        "role": "primary",
        "relationship": "원고 (신청인)",
        "involvementLevel": 100,
        "description": "이 사건에서 ${formData.plaintiff}님의 역할과 특징을 구체적으로"
      },
      {
        "id": "defendant",
        "name": "${formData.defendant}",
        "role": "primary",
        "relationship": "피고 (상대방)",
        "involvementLevel": 100,
        "description": "이 사건에서 ${formData.defendant}님의 역할과 특징을 구체적으로"
      }
      // ★★★ 매우 중요: 설명에서 언급된 모든 제3자를 여기에 추가하세요! ★★★
      // 친구, 가족, 직장동료, 선후배 등 서사에 등장하는 인물이라면 반드시 포함
      // 예시 (실제 인물명과 관계로 대체):
      // { "id": "person3", "name": "실제이름", "role": "secondary", "relationship": "plaintiff의 친구", "involvementLevel": 60, "description": "구체적 역할" },
      // { "id": "person4", "name": "실제이름", "role": "secondary", "relationship": "defendant의 어머니", "involvementLevel": 40, "description": "구체적 역할" },
      // { "id": "person5", "name": "실제이름", "role": "mentioned", "relationship": "직장 상사", "involvementLevel": 20, "description": "구체적 역할" }
      // role 기준: secondary=사건에 직접 관여하거나 영향을 준 인물, witness=목격자, mentioned=간접적으로 언급된 인물
    ],
    "relationships": [
      {
        "from": "plaintiff",
        "to": "defendant",
        "type": "갈등 상황의 관계 유형 (romantic/family/friend/colleague/conflict 중 하나)",
        "quality": "관계 품질 (positive/neutral/negative/complicated 중 하나)",
        "description": "이 사건 맥락에서의 구체적 관계 설명"
      }
      // ★★★ 매우 중요: 모든 이해관계자 간의 관계를 빠짐없이 추가하세요! ★★★
      // 추가된 제3자 각각에 대해, 그 인물이 다른 인물과 맺는 모든 관계를 relationships에 포함
      // 모든 stakeholder는 최소 1개 이상의 relationship에 연결되어야 합니다!
      // 예시:
      // { "from": "plaintiff", "to": "person3", "type": "friend", "quality": "positive", "description": "오랜 친구 관계" },
      // { "from": "defendant", "to": "person4", "type": "family", "quality": "positive", "description": "모자 관계" },
      // { "from": "person3", "to": "defendant", "type": "acquaintance", "quality": "negative", "description": "사건으로 인해 사이가 안 좋아짐" }
    ]
  },

  "conflictTimeline": {
    "events": [
      {
        "id": "evt1",
        "order": 1,
        "type": "trigger",
        "title": "갈등의 시작점",
        "description": "무슨 일이 있었는지 구체적으로",
        "involvedParties": ["${formData.plaintiff}", "${formData.defendant}"],
        "emotionalImpact": -30
      },
      {
        "id": "evt2",
        "order": 2,
        "type": "escalation",
        "title": "갈등 격화",
        "description": "어떻게 악화되었는지",
        "involvedParties": ["${formData.plaintiff}", "${formData.defendant}"],
        "emotionalImpact": -60
      },
      {
        "id": "evt3",
        "order": 3,
        "type": "breakdown",
        "title": "결정적 순간",
        "description": "현재 상황 설명",
        "involvedParties": ["${formData.plaintiff}", "${formData.defendant}"],
        "emotionalImpact": -80
      }
    ],
    "totalDuration": "갈등 기간 추정",
    "peakMoment": "가장 격렬했던 순간",
    "resolutionAttempts": 0
  },

  "faultSummaries": [
    {
      "person": "${formData.plaintiff}",
      "totalFaults": 0,
      "faultsBySeverity": { "minor": 0, "moderate": 0, "serious": 0, "critical": 0 },
      "mainIssues": ["주요 문제 1", "주요 문제 2"]
    },
    {
      "person": "${formData.defendant}",
      "totalFaults": 0,
      "faultsBySeverity": { "minor": 0, "moderate": 0, "serious": 0, "critical": 0 },
      "mainIssues": ["주요 문제 1", "주요 문제 2"]
    }
  ],

  "verdictConfidence": {
    "overall": 0,
    "factors": {
      "evidenceQuality": 0,
      "informationCompleteness": 0,
      "patternClarity": 0,
      "contextUnderstanding": 0
    },
    "limitations": ["한쪽 입장만 들었으므로 편향 가능성", "실제 대화 내용 없이 설명만으로 판단"]
  },

  "responsibilityRatio": {
    "plaintiff": ${analysis.plaintiffFault},
    "defendant": ${analysis.defendantFault}
  },

  "solutions": [
    "즉시 실행할 수 있는 구체적 행동 (교과서적 답변 금지)",
    "단기간 내 개선 방법 (실제 실행 가능한 구체적 방법)",
    "중기 관계 발전 방향 (이 커플만의 맞춤형 솔루션)",
    "장기적 관계 비전과 목표 (현실적이고 구체적인 방향)"
  ],

  "coreAdvice": "가장 중요한 핵심 조언 한 문장 (일반론 아닌 맞춤형 조언)",
  "finalMessage": "위 강도와 말투에 맞춰 마무리 메시지 (마크다운 없이)"
}

9차원 평가 기준 (expandedScores의 각 숫자를 0-100으로 채우세요):
1. emotional: 감정 관리 - 화를 참는 정도, 감정 조절
2. logical: 논리력 - 주장의 논리성, 근거 제시
3. communication: 소통 능력 - 경청, 명확한 표현
4. empathy: 공감 능력 - 상대 입장 이해
5. responsibility: 책임감 - 자기 잘못 인정
6. moralEthical: 도덕/윤리 - 상대방 존중, 공정성
7. emotionalMaturity: 감정 성숙도 - 성인다운 대처
8. conflictContribution: 갈등 해소력 - 높을수록 갈등 해소에 기여 (=좋음). 갈등을 부추겼으면 낮은 점수, 해결하려 노력했으면 높은 점수
9. growthPotential: 성장 가능성 - 변화 의지, 자기성찰

responses 작성 규칙:
1. 각 사람의 percentage는 과실 비율 (=책임도). 두 사람의 percentage 합은 반드시 100
2. 각 사람을 그 사람의 시점에서 분석하세요 - "${formData.plaintiff}"님을 분석할 때는 이 사람이 왜 그렇게 느끼고 행동했는지를, "${formData.defendant}"님은 반대 시점에서
3. message는 그 사람에게 직접 말하는 것처럼 작성 (2인칭). 이모지 3-5개 포함
4. analysis는 제3자 시점에서 이 사람을 심층 분석 (200자 이상 필수)
5. reasoning은 반드시 5개 이상, 각각 구체적이고 이 사건에서 추론 가능한 내용
6. punishment는 "처벌"이 아니라 "개인화된 성장 과제"로 작성
7. faults는 최소 2개 이상, 각각 설명에서 추론 가능한 구체적 행동만 포함
8. behavioralPatterns는 최소 2개 이상
9. percentage가 60% 이상인 사람에게만 penaltyInfo를 부여 (60% 미만이면 null로):
   - penaltyInfo가 필요한 경우: { "amount": 3000~10000 사이 금액, "reason": "유머러스한 벌금 사유", "description": "벌금 이행 방법" }
   - 60% 미만이면 반드시 null

절대 규칙:
1. 마크다운 문법 사용 금지 (**, *, #, - 등)
2. 교과서적, 일반론적 답변 금지. 이 사건의 특수성을 반영한 맞춤형 분석만
3. 구체적이고 실행 가능한 해결책 제시
4. 폭력/학대 상황에서는 피해자 보호 최우선
5. 화해 선물은 관계 유형(${formData.relationship})에 맞게 현실적으로 추천
6. stakeholderMap 필수 규칙: 설명에서 이름이 언급된 모든 인물(친구, 가족, 직장동료, 선후배 등)을 반드시 stakeholders 배열에 추가하고, 각 인물은 최소 1개 이상의 relationship으로 다른 인물과 연결해야 합니다. 서사에 3명 이상 등장하면 3명 이상 포함하세요. 연결이 없는 고립된 노드가 있으면 안 됩니다
7. conflictTimeline은 설명에서 추론 가능한 사건 흐름을 시간순으로 정리
8. faultSummaries의 totalFaults와 faultsBySeverity는 responses 안의 faults와 일치시키세요
9. 모든 텍스트 필드에서 마크다운 절대 금지 - 순수 텍스트만
10. JSON 이외의 어떤 텍스트도 응답에 포함하지 마세요`;
}

// ==================== Judge Persona ====================

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

// ==================== Fallback Response ====================

function createFallbackResponse(formData: RoomlessFormData, analysis: any, persona: any) {
  const fallbackExtendedVerdictData: ExtendedVerdictData = {
    responses: [
      {
        targetUser: formData.plaintiff,
        analysis: '시스템 오류로 인해 상세 분석을 완료하지 못했습니다. 다시 시도해 주세요.',
        message: '분석 중 오류가 발생했어요. 다시 한번 시도해 주세요.',
        style: '미분류',
        percentage: analysis.plaintiffFault,
        reasoning: ['시스템 오류로 인해 구체적 분석이 불가합니다'],
        punishment: '다시 시도해 주세요',
        expandedScores: defaultExpandedScores(),
        faults: [],
        behavioralPatterns: [],
        communicationStyle: {
          primary: '미분류',
          strengths: [],
          weaknesses: [],
          triggers: [],
        },
      },
      {
        targetUser: formData.defendant,
        analysis: '시스템 오류로 인해 상세 분석을 완료하지 못했습니다. 다시 시도해 주세요.',
        message: '분석 중 오류가 발생했어요. 다시 한번 시도해 주세요.',
        style: '미분류',
        percentage: analysis.defendantFault,
        reasoning: ['시스템 오류로 인해 구체적 분석이 불가합니다'],
        punishment: '다시 시도해 주세요',
        expandedScores: defaultExpandedScores(),
        faults: [],
        behavioralPatterns: [],
        communicationStyle: {
          primary: '미분류',
          strengths: [],
          weaknesses: [],
          triggers: [],
        },
      },
    ],
    verdict: {
      summary: '시스템 오류로 인해 상세 판결을 생성할 수 없었습니다. 다시 시도해 주세요.',
      conflict_root_cause: analysis.rootCause || '분석 실패',
      recommendation: '상황을 차분히 다시 정리하고, 전문가의 도움을 받는 것을 고려해 보세요.',
      overallSeverity: 'medium',
      keyInsights: [],
    },
    faultSummaries: [
      {
        person: formData.plaintiff,
        totalFaults: 0,
        faultsBySeverity: { minor: 0, moderate: 0, serious: 0, critical: 0 },
        mainIssues: [],
      },
      {
        person: formData.defendant,
        totalFaults: 0,
        faultsBySeverity: { minor: 0, moderate: 0, serious: 0, critical: 0 },
        mainIssues: [],
      },
    ],
    verdictConfidence: {
      overall: 10,
      factors: {
        evidenceQuality: 10,
        informationCompleteness: 10,
        patternClarity: 10,
        contextUnderstanding: 10,
      },
      limitations: ['AI 응답 파싱 실패로 인한 폴백 응답'],
    },
  };

  return NextResponse.json({
    success: true,
    judgment: {
      caseSummary: `${formData.title}에 대한 ${formData.relationship} 갈등 상황`,
      analysis: {
        complexity: analysis.complexity,
        emotionalIndex: analysis.emotionalIndex,
        solvability: analysis.solvability,
        rootCause: analysis.rootCause,
        relationshipDynamics: '시스템 오류로 상세 분석을 완료하지 못했습니다',
        psychologicalPattern: '심리적 패턴 분석이 필요합니다',
        communicationIssues: '소통 방식 개선이 필요합니다',
        underlyingNeeds: analysis.hiddenNeeds
      },
      verdict: {
        summary: '시스템 오류로 인해 상세 판결을 생성할 수 없었습니다. 다시 시도해 주세요.',
        conflict_root_cause: analysis.rootCause,
        recommendation: '상황을 차분히 다시 정리해보세요.',
        keyInsights: [],
        overallSeverity: 'medium',
      },
      responses: fallbackExtendedVerdictData.responses,
      reasoning: 'AI 응답 파싱 중 오류가 발생했습니다.',
      solutions: [
        '상황을 차분히 다시 정리해보세요',
        '전문가의 도움을 받는 것을 고려해보세요',
        '안전을 최우선으로 생각하세요',
        '건강한 관계를 위한 기준을 세워보세요'
      ],
      responsibilityRatio: {
        plaintiff: analysis.plaintiffFault,
        defendant: analysis.defendantFault
      },
      coreAdvice: '무엇보다 본인의 안전과 행복이 가장 중요합니다',
      finalMessage: '차근차근 해결해 나가시길 바랍니다'
    },
    extendedVerdictData: fallbackExtendedVerdictData,
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
