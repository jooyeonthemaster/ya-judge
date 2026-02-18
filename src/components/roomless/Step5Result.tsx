'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Brain, MessageCircle, Heart, Lightbulb, TrendingUp,
  AlertTriangle, CheckCircle, Gift, Banknote, Gavel, Target,
  Users, Shield, Activity, Zap, Eye, ChevronDown, ChevronUp,
  BarChart3, UserCircle
} from 'lucide-react';
import ResponsibilityGauge from '@/components/shared/verdict/ResponsibilityGauge';
import DimensionalScoreChart from '@/components/shared/verdict/DimensionalScoreChart';
import type {
  DimensionalScores, GiftSuggestion, PenaltyInfo,
  ExpandedDimensionalScores, StakeholderMap,
  ConflictTimeline as ConflictTimelineType,
  FaultEvidence, FaultSummary, BehavioralPattern,
  CommunicationStyle, VerdictConfidence
} from '@/types/verdict';

import dynamic from 'next/dynamic';
const RadarChart = dynamic(() => import('@/components/shared/verdict/RadarChart'), { ssr: false });
const ConflictTimeline = dynamic(() => import('@/components/shared/verdict/ConflictTimeline'), { ssr: false });
const EvidenceCardList = dynamic(() => import('@/components/shared/verdict/EvidenceCard').then(m => ({ default: m.EvidenceCardList })), { ssr: false });
const RelationshipMap = dynamic(() => import('@/components/shared/verdict/RelationshipMap'), { ssr: false });
const ComparativeBarChart = dynamic(() => import('@/components/shared/verdict/ComparativeBarChart'), { ssr: false });
const ScoreMatrix = dynamic(() => import('@/components/shared/verdict/ScoreMatrix'), { ssr: false });
const ConfidenceMeter = dynamic(() => import('@/components/shared/verdict/ConfidenceMeter'), { ssr: false });
const BehavioralPatternBadges = dynamic(() => import('@/components/shared/verdict/BehavioralPatternBadges').then(m => ({ default: m.BehavioralPatternBadges })), { ssr: false });
const CommunicationStyleCard = dynamic(() => import('@/components/shared/verdict/BehavioralPatternBadges').then(m => ({ default: m.CommunicationStyleCard })), { ssr: false });

interface Analysis {
  complexity: string;
  emotionalIndex: number;
  solvability: number;
  rootCause: string;
  relationshipDynamics: string;
  psychologicalPattern: string;
  communicationIssues: string;
  underlyingNeeds: string;
}

interface ResponsibilityRatio {
  plaintiff: number;
  defendant: number;
}

interface Judgment {
  caseSummary: string;
  analysis: Analysis;
  verdict: string;
  reasoning: string;
  solutions: string[];
  responsibilityRatio: ResponsibilityRatio;
  coreAdvice: string;
  finalMessage: string;
  dimensionalScores?: {
    plaintiff: DimensionalScores;
    defendant: DimensionalScores;
  };
  giftSuggestions?: GiftSuggestion[];
  penaltyInfo?: PenaltyInfo & { target?: string } | null;
  // V2 확장 필드
  expandedScores?: {
    plaintiff: ExpandedDimensionalScores;
    defendant: ExpandedDimensionalScores;
  };
  stakeholderMap?: StakeholderMap;
  conflictTimeline?: ConflictTimelineType;
  faultAnalysis?: {
    plaintiff: FaultEvidence[];
    defendant: FaultEvidence[];
  };
  faultSummaries?: FaultSummary[];
  behavioralPatterns?: {
    plaintiff: BehavioralPattern[];
    defendant: BehavioralPattern[];
  };
  communicationStyles?: {
    plaintiff: CommunicationStyle;
    defendant: CommunicationStyle;
  };
  keyInsights?: string[];
  relationshipPrognosis?: string;
  verdictConfidence?: VerdictConfidence;
}

interface Step5ResultProps {
  judgment: Judgment;
  onRestart: () => void;
  onBackToMain: () => void;
}

// Collapsible section wrapper
const Section = ({ title, icon, children, defaultOpen = true, bgClass = 'bg-white', borderClass = 'border-gray-200', delay = 0 }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  defaultOpen?: boolean; bgClass?: string; borderClass?: string; delay?: number;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`${bgClass} rounded-xl border ${borderClass} overflow-hidden`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Step5Result: React.FC<Step5ResultProps> = ({ judgment, onRestart, onBackToMain }) => {
  const removeMarkdown = (text: string): string => {
    if (!text) return '';
    return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '')
      .replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
  };

  const getEmotionalDisplay = (index: number) => {
    if (index >= 8) return { color: 'text-red-600', bgColor: 'bg-red-100', icon: '🔥', label: '매우높음' };
    if (index >= 6) return { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '⚡', label: '높음' };
    if (index >= 3) return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🌊', label: '보통' };
    return { color: 'text-green-600', bgColor: 'bg-green-100', icon: '🌱', label: '낮음' };
  };

  const getSolvabilityColor = (pct: number) => {
    if (pct >= 70) return 'text-green-600';
    if (pct >= 50) return 'text-yellow-600';
    if (pct >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const emotionalDisplay = getEmotionalDisplay(judgment.analysis.emotionalIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* ============ Header ============ */}
      <div className="text-center space-y-3">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="text-5xl mb-2">
          ⚖️
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-700 bg-clip-text text-transparent">
          판결 완료
        </h2>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-gray-500 text-sm">AI 판사의 공정한 심리 결과</span>
          {judgment.verdictConfidence && (
            <ConfidenceMeter confidence={judgment.verdictConfidence} size="sm" />
          )}
        </div>
      </div>

      {/* ============ Case Summary ============ */}
      <Section
        title="사건 요약"
        icon={<MessageCircle className="w-5 h-5 text-purple-600" />}
        bgClass="bg-gradient-to-r from-purple-50 to-pink-50"
        borderClass="border-purple-200"
        delay={0.3}
      >
        <p className="text-gray-700 leading-relaxed">{removeMarkdown(judgment.caseSummary)}</p>
      </Section>

      {/* ============ Stakeholder Map ============ */}
      {judgment.stakeholderMap && judgment.stakeholderMap.stakeholders.length > 0 && (
        <Section
          title="이해관계자 관계도"
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          bgClass="bg-gradient-to-r from-indigo-50 to-blue-50"
          borderClass="border-indigo-200"
          delay={0.35}
        >
          <RelationshipMap stakeholderMap={judgment.stakeholderMap} />
        </Section>
      )}

      {/* ============ Conflict Timeline ============ */}
      {judgment.conflictTimeline && judgment.conflictTimeline.events.length > 0 && (
        <Section
          title="갈등 타임라인"
          icon={<Zap className="w-5 h-5 text-amber-600" />}
          bgClass="bg-gradient-to-r from-amber-50 to-yellow-50"
          borderClass="border-amber-200"
          delay={0.4}
        >
          <ConflictTimeline timeline={judgment.conflictTimeline} />
        </Section>
      )}

      {/* ============ Key Insights ============ */}
      {judgment.keyInsights && judgment.keyInsights.length > 0 && (
        <Section
          title="핵심 인사이트"
          icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
          bgClass="bg-gradient-to-r from-amber-50 to-orange-50"
          borderClass="border-amber-200"
          delay={0.42}
        >
          <div className="space-y-2">
            {judgment.keyInsights.map((insight, i) => {
              const colors = ['border-l-indigo-500 bg-indigo-50/50', 'border-l-emerald-500 bg-emerald-50/50', 'border-l-amber-500 bg-amber-50/50', 'border-l-rose-500 bg-rose-50/50', 'border-l-violet-500 bg-violet-50/50'];
              return (
                <div key={i} className={`border-l-4 ${colors[i % colors.length]} p-3 rounded-r-lg`}>
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 leading-relaxed">{removeMarkdown(insight)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ============ Deep Psychological Analysis ============ */}
      <Section
        title="전문 심리 분석"
        icon={<Brain className="w-5 h-5 text-indigo-600" />}
        bgClass="bg-gradient-to-r from-indigo-50 to-purple-50"
        borderClass="border-indigo-200"
        delay={0.45}
      >
        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
            <div className="text-xl mb-1">📊</div>
            <div className="text-xs font-semibold text-gray-600">갈등 복잡도</div>
            <div className="text-sm font-bold text-gray-900">{judgment.analysis.complexity}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
            <div className="text-xl mb-1">{emotionalDisplay.icon}</div>
            <div className="text-xs font-semibold text-gray-600">감정 지수</div>
            <div className={`text-sm font-bold ${emotionalDisplay.color}`}>{judgment.analysis.emotionalIndex}/10</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
            <div className="text-xl mb-1">{judgment.analysis.solvability >= 70 ? '✅' : judgment.analysis.solvability >= 50 ? '⚖️' : '⚠️'}</div>
            <div className="text-xs font-semibold text-gray-600">해결 가능성</div>
            <div className={`text-sm font-bold ${getSolvabilityColor(judgment.analysis.solvability)}`}>{judgment.analysis.solvability}%</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
            <div className="text-xl mb-1">🎯</div>
            <div className="text-xs font-semibold text-gray-600">핵심 원인</div>
            <div className="text-xs font-bold text-gray-900 mt-1 line-clamp-2">{judgment.analysis.rootCause}</div>
          </div>
        </div>

        {/* Detail Cards */}
        <div className="space-y-3">
          {[
            { icon: <Scale className="w-4 h-4 text-purple-600" />, label: '관계 역학', text: judgment.analysis.relationshipDynamics, color: 'text-purple-800' },
            { icon: <Brain className="w-4 h-4 text-indigo-600" />, label: '심리적 패턴', text: judgment.analysis.psychologicalPattern, color: 'text-indigo-800' },
            { icon: <MessageCircle className="w-4 h-4 text-blue-600" />, label: '소통 문제점', text: judgment.analysis.communicationIssues, color: 'text-blue-800' },
            { icon: <Heart className="w-4 h-4 text-pink-600" />, label: '숨겨진 욕구', text: judgment.analysis.underlyingNeeds, color: 'text-pink-800' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center space-x-2 mb-1.5">
                {item.icon}
                <span className={`font-semibold text-sm ${item.color}`}>{item.label}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{removeMarkdown(item.text)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ 9-Dimension Radar Comparison ============ */}
      {judgment.expandedScores && (
        <Section
          title="9차원 역량 레이더"
          icon={<Target className="w-5 h-5 text-indigo-600" />}
          bgClass="bg-gradient-to-r from-indigo-50 to-violet-50"
          borderClass="border-indigo-200"
          delay={0.5}
        >
          <RadarChart
            datasets={[
              { label: '원고', scores: judgment.expandedScores.plaintiff, color: '#6366f1' },
              { label: '피고', scores: judgment.expandedScores.defendant, color: '#f43f5e' },
            ]}
          />
        </Section>
      )}

      {/* ============ Comparative Bar Chart ============ */}
      {judgment.expandedScores && (
        <Section
          title="역량 대결 비교"
          icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}
          delay={0.52}
        >
          <ComparativeBarChart
            personA={{ name: '원고', scores: judgment.expandedScores.plaintiff }}
            personB={{ name: '피고', scores: judgment.expandedScores.defendant }}
          />
        </Section>
      )}

      {/* ============ Score Matrix ============ */}
      {(judgment.expandedScores || judgment.dimensionalScores) && (
        <Section
          title="점수 매트릭스"
          icon={<BarChart3 className="w-5 h-5 text-teal-600" />}
          delay={0.54}
        >
          <ScoreMatrix
            participants={[
              { name: '원고', scores: (judgment.expandedScores?.plaintiff || judgment.dimensionalScores?.plaintiff)! },
              { name: '피고', scores: (judgment.expandedScores?.defendant || judgment.dimensionalScores?.defendant)! },
            ]}
          />
        </Section>
      )}

      {/* ============ Evidence-Based Faults ============ */}
      {judgment.faultAnalysis && (judgment.faultAnalysis.plaintiff.length > 0 || judgment.faultAnalysis.defendant.length > 0) && (
        <Section
          title="근거 기반 과실 분석"
          icon={<Shield className="w-5 h-5 text-orange-600" />}
          bgClass="bg-gradient-to-r from-orange-50 to-red-50"
          borderClass="border-orange-200"
          delay={0.56}
        >
          <EvidenceCardList
            evidences={[...judgment.faultAnalysis.plaintiff, ...judgment.faultAnalysis.defendant]}
            faultSummaries={judgment.faultSummaries}
            groupBy="person"
          />
        </Section>
      )}

      {/* ============ Responsibility Ratio ============ */}
      <Section
        title="책임 비율"
        icon={<Scale className="w-5 h-5 text-orange-600" />}
        bgClass="bg-gradient-to-r from-yellow-50 to-orange-50"
        borderClass="border-yellow-200"
        delay={0.58}
      >
        <div className="grid grid-cols-2 gap-4">
          <ResponsibilityGauge percentage={judgment.responsibilityRatio.plaintiff} userName="원고 (신청인)" size="sm" />
          <ResponsibilityGauge percentage={judgment.responsibilityRatio.defendant} userName="피고 (상대방)" size="sm" />
        </div>
      </Section>

      {/* ============ Basic Dimensional Comparison (fallback) ============ */}
      {!judgment.expandedScores && judgment.dimensionalScores && (
        <Section
          title="다차원 역량 비교"
          icon={<Brain className="w-5 h-5 text-indigo-600" />}
          bgClass="bg-gradient-to-r from-indigo-50 to-violet-50"
          borderClass="border-indigo-200"
          delay={0.6}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
              <DimensionalScoreChart scores={judgment.dimensionalScores.plaintiff} userName="원고" />
            </div>
            <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
              <DimensionalScoreChart scores={judgment.dimensionalScores.defendant} userName="피고" />
            </div>
          </div>
        </Section>
      )}

      {/* ============ Behavioral Patterns ============ */}
      {judgment.behavioralPatterns && (
        <Section
          title="행동 패턴 분석"
          icon={<Activity className="w-5 h-5 text-purple-600" />}
          delay={0.62}
        >
          <div className="space-y-4">
            {judgment.behavioralPatterns.plaintiff.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">원고 (신청인)</h4>
                <BehavioralPatternBadges patterns={judgment.behavioralPatterns.plaintiff} />
              </div>
            )}
            {judgment.behavioralPatterns.defendant.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">피고 (상대방)</h4>
                <BehavioralPatternBadges patterns={judgment.behavioralPatterns.defendant} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ============ Communication Styles ============ */}
      {judgment.communicationStyles && (
        <Section
          title="소통 스타일 분석"
          icon={<MessageCircle className="w-5 h-5 text-blue-600" />}
          delay={0.64}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CommunicationStyleCard style={judgment.communicationStyles.plaintiff} userName="원고" />
            <CommunicationStyleCard style={judgment.communicationStyles.defendant} userName="피고" />
          </div>
        </Section>
      )}

      {/* ============ Final Verdict ============ */}
      <Section
        title="최종 판결"
        icon={<Scale className="w-5 h-5 text-gray-700" />}
        bgClass="bg-gradient-to-r from-gray-50 to-slate-50"
        borderClass="border-gray-300 border-2"
        delay={0.66}
      >
        <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500 mb-3">
          <p className="text-gray-800 font-medium leading-relaxed">{removeMarkdown(judgment.verdict)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400">
          <p className="text-gray-700 leading-relaxed text-sm">{removeMarkdown(judgment.reasoning)}</p>
        </div>
      </Section>

      {/* ============ Relationship Prognosis ============ */}
      {judgment.relationshipPrognosis && (
        <Section
          title="관계 예후"
          icon={<Heart className="w-5 h-5 text-violet-600" />}
          bgClass="bg-gradient-to-r from-violet-50 to-purple-50"
          borderClass="border-violet-200"
          delay={0.68}
        >
          <p className="text-violet-800 text-sm leading-relaxed">{removeMarkdown(judgment.relationshipPrognosis)}</p>
        </Section>
      )}

      {/* ============ Step-by-Step Solutions ============ */}
      <Section
        title="단계별 해결 방안"
        icon={<Lightbulb className="w-5 h-5 text-green-600" />}
        bgClass="bg-gradient-to-r from-green-50 to-emerald-50"
        borderClass="border-green-200"
        delay={0.7}
      >
        <div className="space-y-3">
          {judgment.solutions.map((solution, index) => {
            const steps = ['즉시 실행', '단기 개선', '중기 발전', '장기 비전'];
            const colors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-white rounded-lg p-3 border border-gray-100"
              >
                <div className="flex items-start space-x-3">
                  <div className={`${colors[index]} text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">{steps[index]}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{removeMarkdown(solution)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ============ Core Advice ============ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1 }}
        className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200 text-center"
      >
        <div className="text-3xl mb-2">⭐</div>
        <h3 className="text-base font-semibold text-amber-800 mb-2">핵심 조언</h3>
        <p className="text-gray-800 font-medium text-base leading-relaxed">
          &ldquo;{removeMarkdown(judgment.coreAdvice)}&rdquo;
        </p>
      </motion.div>

      {/* ============ Gift Suggestions ============ */}
      {judgment.giftSuggestions && judgment.giftSuggestions.length > 0 && (
        <Section
          title="화해 선물 추천"
          icon={<Gift className="w-5 h-5 text-pink-600" />}
          bgClass="bg-gradient-to-r from-pink-50 to-rose-50"
          borderClass="border-pink-200"
          delay={1.15}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {judgment.giftSuggestions.map((gift, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-pink-100 shadow-sm text-center">
                <div className="text-xs font-medium text-pink-500 mb-1">
                  {gift.category === 'small' ? '소소한 마음' : gift.category === 'medium' ? '진심 담은' : '특별한 화해'}
                </div>
                <div className="font-bold text-gray-900 text-sm mb-1">{gift.item}</div>
                <div className="text-pink-600 font-bold mb-1">{gift.price?.toLocaleString()}원</div>
                <div className="text-xs text-gray-500">{gift.reason}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ============ Penalty ============ */}
      {judgment.penaltyInfo && judgment.penaltyInfo.amount > 0 && (
        <Section
          title="벌금 고지서"
          icon={<Banknote className="w-5 h-5 text-amber-600" />}
          bgClass="bg-gradient-to-r from-amber-50 to-orange-50"
          borderClass="border-amber-300 border-2"
          delay={1.18}
          defaultOpen={false}
        >
          <div className="bg-white rounded-lg p-4 border border-amber-200 text-center">
            <div className="text-sm text-gray-600 mb-1">
              {judgment.penaltyInfo.target === 'plaintiff' ? '원고 (신청인)' : '피고 (상대방)'}에게 부과
            </div>
            <div className="text-2xl font-bold text-amber-600 mb-2">{judgment.penaltyInfo.amount.toLocaleString()}원</div>
            <p className="text-sm text-gray-700 mb-1"><strong>사유:</strong> {judgment.penaltyInfo.reason}</p>
            <p className="text-xs text-gray-500">{judgment.penaltyInfo.description}</p>
          </div>
        </Section>
      )}

      {/* ============ Action Buttons ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'AI 판사 판결 결과', text: removeMarkdown(judgment.caseSummary), url: window.location.href });
            }
          }}
          className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg"
        >
          판결 결과 공유하기
        </button>
        <button onClick={onRestart} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg">
          새 사건 접수
        </button>
        <button onClick={onBackToMain} className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg">
          메인으로
        </button>
      </motion.div>

      {/* ============ Closing ============ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-200 text-center"
      >
        <div className="text-2xl mb-2">💕</div>
        <h3 className="text-base font-semibold text-pink-800 mb-2">마무리 말씀</h3>
        <p className="text-gray-700 leading-relaxed text-sm">{removeMarkdown(judgment.finalMessage)}</p>
        <div className="mt-4 pt-3 border-t border-pink-200">
          <p className="text-xs text-gray-500">
            AI 판사의 판결은 참고용이며 법적 효력은 없습니다.
            건전하고 건강한 관계를 위해 서로 이해하고 배려하세요.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Step5Result;
