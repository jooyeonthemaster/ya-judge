// ==================== 다차원 판결 점수 체계 ====================

export interface DimensionalScores {
  emotional: number;       // 감정 관리 0-100
  logical: number;         // 논리력 0-100
  communication: number;   // 소통 능력 0-100
  empathy: number;         // 공감 능력 0-100
  responsibility: number;  // 책임감 0-100
}

export const DIMENSION_LABELS: Record<keyof DimensionalScores, string> = {
  emotional: '감정 관리',
  logical: '논리력',
  communication: '소통 능력',
  empathy: '공감 능력',
  responsibility: '책임감',
};

export const DIMENSION_WEIGHTS: Record<keyof DimensionalScores, number> = {
  emotional: 0.25,
  logical: 0.20,
  communication: 0.20,
  empathy: 0.15,
  responsibility: 0.20,
};

// ==================== 확장된 9차원 점수 체계 ====================

export interface ExpandedDimensionalScores extends DimensionalScores {
  moralEthical: number;        // 도덕/윤리 0-100
  emotionalMaturity: number;   // 감정적 성숙도 0-100
  conflictContribution: number; // 갈등 해소력 0-100 (높을수록 갈등 해소에 기여)
  growthPotential: number;     // 성장 가능성 0-100
}

export const EXPANDED_DIMENSION_LABELS: Record<keyof ExpandedDimensionalScores, string> = {
  emotional: '감정 관리',
  logical: '논리력',
  communication: '소통 능력',
  empathy: '공감 능력',
  responsibility: '책임감',
  moralEthical: '도덕/윤리',
  emotionalMaturity: '감정 성숙도',
  conflictContribution: '갈등 해소력',
  growthPotential: '성장 가능성',
};

// ==================== 이해관계자 관계도 ====================

export interface Stakeholder {
  id: string;
  name: string;
  role: 'primary' | 'secondary' | 'witness' | 'mentioned';
  relationship: string;       // "여자친구", "직장동료", "어머니" 등
  involvementLevel: number;   // 0-100
  description: string;
}

export interface StakeholderRelationship {
  from: string;               // stakeholder id
  to: string;
  type: 'romantic' | 'family' | 'friend' | 'colleague' | 'acquaintance' | 'conflict';
  quality: 'positive' | 'neutral' | 'negative' | 'complicated';
  description: string;
}

export interface StakeholderMap {
  stakeholders: Stakeholder[];
  relationships: StakeholderRelationship[];
}

// ==================== 근거 기반 과실 분석 ====================

export interface FaultEvidence {
  id: string;
  targetPerson: string;
  category: 'communication' | 'emotional' | 'behavioral' | 'moral' | 'responsibility';
  quote?: string;             // 대화 중 실제 인용
  behavior: string;           // 과실 행동 설명
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  impact: string;             // 갈등에 미친 영향
}

export interface FaultSummary {
  person: string;
  totalFaults: number;
  faultsBySeverity: Record<'minor' | 'moderate' | 'serious' | 'critical', number>;
  mainIssues: string[];
}

// ==================== 갈등 타임라인 ====================

export interface TimelineEvent {
  id: string;
  order: number;
  type: 'trigger' | 'escalation' | 'turning_point' | 'attempt_resolution' | 'breakdown';
  title: string;
  description: string;
  involvedParties: string[];
  emotionalImpact: number;    // -100 ~ 100 (음수 = 갈등 심화, 양수 = 해소 방향)
}

export interface ConflictTimeline {
  events: TimelineEvent[];
  totalDuration: string;      // "5분", "2일" 등
  peakMoment: string;         // 가장 격렬했던 순간
  resolutionAttempts: number;
}

// ==================== 행동 패턴 분석 ====================

export interface BehavioralPattern {
  pattern: string;
  category: 'positive' | 'negative' | 'neutral';
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  examples: string[];
  recommendation: string;
}

export interface CommunicationStyle {
  primary: string;            // "공격적", "회피적", "수동공격적", "건설적" 등
  secondary?: string;
  strengths: string[];
  weaknesses: string[];
  triggers: string[];
}

// ==================== 판결 신뢰도 ====================

export interface VerdictConfidence {
  overall: number;            // 0-100
  factors: {
    evidenceQuality: number;
    informationCompleteness: number;
    patternClarity: number;
    contextUnderstanding: number;
  };
  limitations: string[];
}

// ==================== 선물 추천 ====================

export interface GiftSuggestion {
  item: string;            // "커피 기프티콘"
  price: number;           // 5000 (KRW)
  reason: string;          // "소소한 화해의 시작"
  category: 'small' | 'medium' | 'large'; // 소소한/적당한/진심어린
}

// ==================== 벌금 정보 ====================

export interface PenaltyInfo {
  amount: number;          // 금액 (KRW, 3000~10000)
  reason: string;          // 벌금 사유
  description: string;     // 이행 방법 설명
}

// ==================== 확장된 개인 분석 응답 ====================

export interface ExtendedPersonalizedResponse {
  targetUser: string;
  analysis: string;
  message: string;
  style: string;
  percentage: number;
  reasoning: string[];
  punishment: string;
  dimensionalScores?: DimensionalScores;
  penaltyInfo?: PenaltyInfo;
  // V2 확장 필드 (optional for backward compat)
  expandedScores?: ExpandedDimensionalScores;
  faults?: FaultEvidence[];
  behavioralPatterns?: BehavioralPattern[];
  communicationStyle?: CommunicationStyle;
}

// ==================== 확장된 판결 데이터 ====================

export interface ExtendedVerdictData {
  responses?: ExtendedPersonalizedResponse[];
  verdict: {
    summary: string;
    conflict_root_cause: string;
    recommendation: string;
    giftSuggestions?: GiftSuggestion[];
    overallSeverity?: 'low' | 'medium' | 'high' | 'critical';
    // V2 확장 필드
    keyInsights?: string[];
    relationshipPrognosis?: string;
  };
  // V2 확장 필드 (optional for backward compat)
  stakeholderMap?: StakeholderMap;
  conflictTimeline?: ConflictTimeline;
  faultSummaries?: FaultSummary[];
  verdictConfidence?: VerdictConfidence;
}

// ==================== 결제 타입 ====================

export type PaymentProductType = 'retrial' | 'penalty' | 'gift';

export interface PaymentProduct {
  type: PaymentProductType;
  amount: number;
  orderName: string;
  metadata?: Record<string, string>;
}
