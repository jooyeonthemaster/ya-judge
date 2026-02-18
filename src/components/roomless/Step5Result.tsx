'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Brain, MessageCircle, Heart, Lightbulb, TrendingUp,
  AlertTriangle, CheckCircle2, Gift, Banknote, Gavel, Target,
  Users, Shield, Activity, Zap, Eye, BarChart3, UserCircle,
  ChevronDown, ChevronUp, X, FileText, RotateCcw, Share2
} from 'lucide-react';
import type {
  ExtendedVerdictData, ExtendedPersonalizedResponse,
  GiftSuggestion, FaultEvidence, BehavioralPattern,
  CommunicationStyle, StakeholderMap,
  ConflictTimeline as ConflictTimelineType,
  FaultSummary, VerdictConfidence, ExpandedDimensionalScores,
  DimensionalScores
} from '@/types/verdict';
import { EXPANDED_DIMENSION_LABELS, DIMENSION_LABELS } from '@/types/verdict';
import ResponsibilityGauge from '@/components/shared/verdict/ResponsibilityGauge';

import dynamic from 'next/dynamic';
const ConflictTimeline = dynamic(() => import('@/components/shared/verdict/ConflictTimeline'), { ssr: false });
const EvidenceCardList = dynamic(() => import('@/components/shared/verdict/EvidenceCard').then(m => ({ default: m.EvidenceCardList })), { ssr: false });
const RelationshipMap = dynamic(() => import('@/components/shared/verdict/RelationshipMap'), { ssr: false });
const ComparativeBarChart = dynamic(() => import('@/components/shared/verdict/ComparativeBarChart'), { ssr: false });
const ConfidenceMeter = dynamic(() => import('@/components/shared/verdict/ConfidenceMeter'), { ssr: false });
const BehavioralPatternBadges = dynamic(() => import('@/components/shared/verdict/BehavioralPatternBadges').then(m => ({ default: m.BehavioralPatternBadges })), { ssr: false });
const CommunicationStyleCard = dynamic(() => import('@/components/shared/verdict/BehavioralPatternBadges').then(m => ({ default: m.CommunicationStyleCard })), { ssr: false });

// ==================== Types ====================

interface Step5ResultProps {
  judgment: any; // raw judgment data (legacy compat)
  extendedVerdictData?: ExtendedVerdictData;
  onNewCase: () => void;
  onBackToMain: () => void;
}

type TabType = 'overview' | 'analysis' | 'individual' | 'resolution';

// ==================== Animation Variants ====================

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// ==================== Utility ====================

const removeMarkdown = (text: string): string => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '')
    .replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
};

// ==================== Sub Components ====================

const DimensionBars = ({ scores }: { scores: ExpandedDimensionalScores | DimensionalScores }) => {
  const entries = Object.entries(scores) as [string, number][];
  const labels: Record<string, string> = { ...DIMENSION_LABELS, ...EXPANDED_DIMENSION_LABELS };
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);

  const getBarColor = (v: number) => {
    if (v >= 70) return 'bg-emerald-500';
    if (v >= 50) return 'bg-blue-500';
    if (v >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = (v: number) => {
    if (v >= 70) return 'text-emerald-700';
    if (v >= 50) return 'text-blue-700';
    if (v >= 30) return 'text-amber-700';
    return 'text-red-700';
  };

  return (
    <div className="space-y-2.5">
      {sorted.map(([key, value]) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">{labels[key] || key}</span>
            <span className={`text-xs font-bold tabular-nums ${getTextColor(value)}`}>{value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getBarColor(value)}`}
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const InsightCard = ({ insight, index }: { insight: string; index: number }) => {
  const colors = ['border-l-indigo-500 bg-indigo-50/50', 'border-l-emerald-500 bg-emerald-50/50', 'border-l-amber-500 bg-amber-50/50', 'border-l-rose-500 bg-rose-50/50', 'border-l-violet-500 bg-violet-50/50'];
  return (
    <motion.div variants={itemVariants} className={`border-l-4 ${colors[index % colors.length]} p-3 rounded-r-lg`}>
      <div className="flex items-start space-x-2">
        <Lightbulb className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700 leading-relaxed">{removeMarkdown(insight)}</p>
      </div>
    </motion.div>
  );
};

// ==================== Tab: Overview ====================

const OverviewTab = ({ verdictData }: { verdictData: ExtendedVerdictData }) => {
  const responses = verdictData.responses || [];

  const getNormPct = () => {
    if (responses.length < 2) return responses.map(r => ({ name: r.targetUser, pct: r.percentage }));
    const sorted = [...responses].sort((a, b) => a.percentage - b.percentage);
    const w = sorted[0], l = sorted[sorted.length - 1];
    if (w.percentage === l.percentage) return responses.map(r => ({ name: r.targetUser, pct: 50 }));
    const total = w.percentage + l.percentage;
    return responses.map(r => ({
      name: r.targetUser,
      pct: r.targetUser === w.targetUser
        ? Math.round((w.percentage / total) * 100)
        : 100 - Math.round((w.percentage / total) * 100)
    }));
  };

  const participants = getNormPct();

  const getFaultColor = (pct: number) => {
    if (pct >= 70) return { ring: 'ring-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: '주범', labelBg: 'bg-red-600' };
    if (pct >= 55) return { ring: 'ring-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: '과반 책임', labelBg: 'bg-orange-500' };
    if (pct >= 45) return { ring: 'ring-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: '동등 책임', labelBg: 'bg-yellow-500' };
    return { ring: 'ring-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: '덜 책임', labelBg: 'bg-emerald-600' };
  };

  return (
    <motion.div variants={contentVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-5">
      {/* HERO: Fault Percentage Display */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="text-center mb-1">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center justify-center gap-2">
            <Gavel className="h-5 w-5 text-indigo-600" />
            과실 비율 판정
          </h3>
        </div>

        <div className={`grid gap-3 ${participants.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {participants.map((p, i) => {
            const c = getFaultColor(p.pct);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative ${c.bg} ${c.border} border-2 rounded-2xl p-4 sm:p-6 text-center`}
              >
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 ${c.labelBg} text-white text-[10px] sm:text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap`}>
                  {c.label}
                </span>
                <div className="text-sm sm:text-base font-bold text-gray-800 mt-1 mb-2">{p.name}</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                  className={`text-4xl sm:text-5xl font-black ${c.text} tabular-nums leading-none`}
                >
                  {p.pct}<span className="text-lg sm:text-xl">%</span>
                </motion.div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${p.pct >= 55 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Combined bar */}
        {participants.length === 2 && (
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl">
            <div className="flex h-10 sm:h-12">
              {participants.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 + i * 0.1 }}
                  className={`flex items-center justify-center text-white text-xs sm:text-sm font-bold ${
                    p.pct >= 55 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  }`}
                >
                  {p.pct}%
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between px-3 py-1 bg-gray-50 text-xs text-gray-500">
              <span>{participants[0]?.name}</span>
              <span className="font-medium text-gray-700">과실 비율</span>
              <span>{participants[1]?.name}</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Conflict Timeline */}
      {verdictData.conflictTimeline && verdictData.conflictTimeline.events.length > 0 && (
        <motion.div variants={itemVariants} className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-indigo-600" />
            갈등 타임라인
          </h3>
          <ConflictTimeline timeline={verdictData.conflictTimeline} compact />
        </motion.div>
      )}

      {/* Key Insights */}
      {verdictData.verdict.keyInsights && verdictData.verdict.keyInsights.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
            핵심 인사이트
          </h3>
          {verdictData.verdict.keyInsights.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} />
          ))}
        </motion.div>
      )}

      {/* Verdict Summary */}
      <motion.div variants={itemVariants} className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
          <Scale className="h-4 w-4 mr-2 text-indigo-600" />
          판결 요약
        </h3>
        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{removeMarkdown(verdictData.verdict.summary)}</p>
      </motion.div>

      {/* Relationship Prognosis */}
      {verdictData.verdict.relationshipPrognosis && (
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 sm:p-5 rounded-xl border border-violet-200">
          <h3 className="text-base sm:text-lg font-bold text-violet-900 mb-2 flex items-center">
            <Heart className="h-4 w-4 mr-2 text-violet-600" />
            관계 예후
          </h3>
          <p className="text-violet-800 text-sm leading-relaxed">{removeMarkdown(verdictData.verdict.relationshipPrognosis)}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

// ==================== Tab: Analysis ====================

const AnalysisTab = ({ verdictData, judgment }: { verdictData: ExtendedVerdictData; judgment: any }) => {
  const responses = verdictData.responses || [];
  const hasExpanded = responses.length >= 2 && responses[0].expandedScores && responses[1].expandedScores;

  return (
    <motion.div variants={contentVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-5">
      {/* Relationship Map */}
      {verdictData.stakeholderMap && verdictData.stakeholderMap.stakeholders.length > 0 && (
        <motion.div variants={itemVariants} className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Users className="h-4 w-4 mr-2 text-indigo-600" />
            이해관계자 관계도
          </h3>
          <RelationshipMap stakeholderMap={verdictData.stakeholderMap} />
        </motion.div>
      )}

      {/* Comparative Bar Chart */}
      {hasExpanded && (
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-indigo-600" />
            9차원 역량 비교
          </h3>
          <ComparativeBarChart
            personA={{ name: responses[0].targetUser, scores: responses[0].expandedScores! as unknown as Record<string, number> }}
            personB={{ name: responses[1].targetUser, scores: responses[1].expandedScores! as unknown as Record<string, number> }}
          />
        </motion.div>
      )}

      {/* Deep Psychology Analysis (from legacy judgment data) */}
      {judgment?.analysis && (
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-5 rounded-xl border border-indigo-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Brain className="h-4 w-4 mr-2 text-indigo-600" />
            전문 심리 분석
          </h3>
          <div className="space-y-3">
            {[
              { icon: <Scale className="w-4 h-4 text-purple-600" />, label: '관계 역학', text: judgment.analysis.relationshipDynamics, color: 'text-purple-800' },
              { icon: <Brain className="w-4 h-4 text-indigo-600" />, label: '심리적 패턴', text: judgment.analysis.psychologicalPattern, color: 'text-indigo-800' },
              { icon: <MessageCircle className="w-4 h-4 text-blue-600" />, label: '소통 문제점', text: judgment.analysis.communicationIssues, color: 'text-blue-800' },
              { icon: <Heart className="w-4 h-4 text-pink-600" />, label: '숨겨진 욕구', text: judgment.analysis.underlyingNeeds, color: 'text-pink-800' },
            ].filter(item => item.text && item.text !== '시스템 오류로 상세 분석을 완료하지 못했습니다').map((item, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center space-x-2 mb-1.5">
                  {item.icon}
                  <span className={`font-semibold text-sm ${item.color}`}>{item.label}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{removeMarkdown(item.text)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Root Cause */}
      <motion.div variants={itemVariants} className="bg-red-50 p-4 sm:p-5 rounded-xl border border-red-200">
        <h3 className="text-base sm:text-lg font-bold text-red-900 mb-3 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
          갈등의 근본 원인
        </h3>
        <p className="text-red-800 text-sm sm:text-base leading-relaxed">{removeMarkdown(verdictData.verdict.conflict_root_cause)}</p>
      </motion.div>

      {/* Evidence-based Faults */}
      {verdictData.faultSummaries && verdictData.faultSummaries.length > 0 && (
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Shield className="h-4 w-4 mr-2 text-orange-600" />
            근거 기반 과실 분석
          </h3>
          {(() => {
            const allFaults = responses.flatMap(r => r.faults || []);
            if (allFaults.length === 0) return <p className="text-sm text-gray-500">과실 데이터 없음</p>;
            return <EvidenceCardList evidences={allFaults} faultSummaries={verdictData.faultSummaries} groupBy="person" />;
          })()}
        </motion.div>
      )}
    </motion.div>
  );
};

// ==================== Tab: Individual ====================

const IndividualTab = ({ verdictData }: { verdictData: ExtendedVerdictData }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const responses = verdictData.responses || [];
  if (responses.length === 0) return null;
  const active = responses[activeIdx];

  const getNormPct = (targetUser: string) => {
    if (responses.length < 2) return null;
    const sorted = [...responses].sort((a, b) => a.percentage - b.percentage);
    const w = sorted[0], l = sorted[sorted.length - 1];
    if (w.percentage === l.percentage) return 50;
    const total = w.percentage + l.percentage;
    if (total === 0) return 50;
    if (targetUser === w.targetUser) return Math.round((w.percentage / total) * 100);
    if (targetUser === l.targetUser) return 100 - Math.round((w.percentage / total) * 100);
    return null;
  };

  return (
    <motion.div variants={contentVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-5">
      {/* Participant Selector */}
      <div className="flex gap-2">
        {responses.map((r, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
              activeIdx === i
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <UserCircle className="h-4 w-4 inline mr-1" />
            {r.targetUser}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
          {/* Responsibility Gauge */}
          <div className="flex justify-center">
            <ResponsibilityGauge
              percentage={getNormPct(active.targetUser) || active.percentage}
              userName={active.targetUser}
              size="md"
            />
          </div>

          {/* Dimensional Scores */}
          {(active.expandedScores || active.dimensionalScores) && (
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <Target className="h-4 w-4 mr-1.5 text-indigo-500" />
                {active.expandedScores ? '9차원 역량 분석' : '5차원 역량 분석'}
              </h4>
              <DimensionBars scores={active.expandedScores || active.dimensionalScores!} />
            </div>
          )}

          {/* Analysis */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-1.5 text-indigo-600" />
              상세 분석
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">{removeMarkdown(active.analysis)}</p>
          </div>

          {/* Judge Message */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center">
              <Gavel className="h-4 w-4 mr-1.5 text-blue-600" />
              판사 메시지
            </h4>
            <p className="text-blue-800 text-sm leading-relaxed border-l-4 border-blue-400 pl-3">{removeMarkdown(active.message)}</p>
          </div>

          {/* Evidence-based Faults */}
          {active.faults && active.faults.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-1.5 text-orange-600" />
                과실 근거 ({active.faults.length}건)
              </h4>
              <EvidenceCardList evidences={active.faults} groupBy="severity" />
            </div>
          )}

          {/* Behavioral Patterns */}
          {active.behavioralPatterns && active.behavioralPatterns.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <Activity className="h-4 w-4 mr-1.5 text-purple-600" />
                행동 패턴
              </h4>
              <BehavioralPatternBadges patterns={active.behavioralPatterns} />
            </div>
          )}

          {/* Communication Style */}
          {active.communicationStyle && (
            <CommunicationStyleCard style={active.communicationStyle} userName={active.targetUser} />
          )}

          {/* Reasoning */}
          {active.reasoning && active.reasoning.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h4 className="text-sm font-bold text-yellow-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1.5 text-yellow-600" />
                판단 근거
              </h4>
              <div className="space-y-1.5">
                {active.reasoning.map((r, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <span className="text-yellow-600 font-bold text-xs mt-0.5">{i + 1}.</span>
                    <p className="text-yellow-800 text-sm leading-relaxed">{removeMarkdown(r)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Punishment/Improvement */}
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center">
              <Gavel className="h-4 w-4 mr-1.5 text-red-600" />
              개선 및 성장 과제
            </h4>
            <p className="text-red-800 text-sm leading-relaxed">{removeMarkdown(active.punishment)}</p>
          </div>

          {/* Individual Penalty */}
          {active.penaltyInfo && active.penaltyInfo.amount > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-300">
              <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center">
                <Banknote className="h-4 w-4 mr-1.5 text-amber-600" />
                벌금: {active.penaltyInfo.amount.toLocaleString()}원
              </h4>
              <p className="text-xs text-gray-700">{active.penaltyInfo.reason}</p>
              <p className="text-xs text-gray-500 mt-1">{active.penaltyInfo.description}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== Tab: Resolution ====================

const ResolutionTab = ({ verdictData, judgment }: { verdictData: ExtendedVerdictData; judgment: any }) => (
  <motion.div variants={contentVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-5">
    {/* Recommendation */}
    <motion.div variants={itemVariants} className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200">
      <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 flex items-center">
        <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
        개선 권고사항
      </h3>
      <p className="text-blue-800 text-sm sm:text-base leading-relaxed">{removeMarkdown(verdictData.verdict.recommendation)}</p>
    </motion.div>

    {/* Step-by-Step Solutions */}
    {judgment?.solutions && judgment.solutions.length > 0 && (
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-5 rounded-xl border border-green-200">
        <h3 className="text-base sm:text-lg font-bold text-green-900 mb-3 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2 text-green-600" />
          단계별 해결 방안
        </h3>
        <div className="space-y-3">
          {judgment.solutions.map((solution: string, index: number) => {
            const steps = ['즉시 실행', '단기 개선', '중기 발전', '장기 비전'];
            const colors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
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
      </motion.div>
    )}

    {/* Core Advice */}
    {judgment?.coreAdvice && (
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200 text-center"
      >
        <div className="text-3xl mb-2">⭐</div>
        <h3 className="text-base font-semibold text-amber-800 mb-2">핵심 조언</h3>
        <p className="text-gray-800 font-medium text-base leading-relaxed">
          &ldquo;{removeMarkdown(judgment.coreAdvice)}&rdquo;
        </p>
      </motion.div>
    )}

    {/* Gift Suggestions */}
    {verdictData.verdict.giftSuggestions && verdictData.verdict.giftSuggestions.length > 0 && (
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 sm:p-5 rounded-xl border border-pink-200">
        <h3 className="text-base sm:text-lg font-bold text-pink-900 mb-3 flex items-center">
          <Gift className="h-4 w-4 mr-2 text-pink-600" />
          화해 선물 추천
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {verdictData.verdict.giftSuggestions.map((gift, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-pink-100 shadow-sm text-center">
              <div className="text-xs font-medium text-pink-500 mb-1">
                {gift.category === 'small' ? '소소한 마음' : gift.category === 'medium' ? '진심 담은' : '특별한 화해'}
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">{gift.item}</div>
              <div className="text-pink-600 font-bold text-sm mb-1">{gift.price?.toLocaleString()}원</div>
              <div className="text-xs text-gray-500">{gift.reason}</div>
            </div>
          ))}
        </div>
      </motion.div>
    )}

    {/* Penalty Banner */}
    {verdictData.responses && verdictData.responses.some(r => r.penaltyInfo && r.penaltyInfo.amount) && (
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 rounded-xl border-2 border-amber-300">
        <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-3 flex items-center">
          <Banknote className="h-4 w-4 mr-2 text-amber-600" />
          벌금 고지서
        </h3>
        {verdictData.responses.filter(r => r.penaltyInfo && r.penaltyInfo.amount).map((r, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200 mb-2 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900">{r.targetUser}님</span>
              <span className="text-xl font-bold text-amber-600">{r.penaltyInfo!.amount.toLocaleString()}원</span>
            </div>
            <p className="text-sm text-gray-700 mb-1"><strong>사유:</strong> {r.penaltyInfo!.reason}</p>
            <p className="text-xs text-gray-500">{r.penaltyInfo!.description}</p>
          </div>
        ))}
      </motion.div>
    )}

    {/* Closing Message */}
    {judgment?.finalMessage && (
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-200 text-center">
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
    )}
  </motion.div>
);

// ==================== Tab Config ====================

const TAB_CONFIG: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: '종합', icon: <Eye className="h-3.5 w-3.5" /> },
  { key: 'analysis', label: '분석', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { key: 'individual', label: '개별', icon: <UserCircle className="h-3.5 w-3.5" /> },
  { key: 'resolution', label: '해결', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
];

// ==================== Main Component ====================

const Step5Result: React.FC<Step5ResultProps> = ({ judgment, extendedVerdictData, onNewCase, onBackToMain }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Build ExtendedVerdictData from extendedVerdictData prop, or build fallback from legacy judgment
  const verdictData: ExtendedVerdictData = extendedVerdictData || buildFallbackVerdictData(judgment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-0"
    >
      {/* ============ Header ============ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-4 sm:p-5 text-white rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 sm:p-2.5 bg-white/10 rounded-xl backdrop-blur">
              <Gavel className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">최종 판결</h2>
              <p className="text-white/60 text-xs sm:text-sm">AI 판사의 공정한 결정</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Tab Navigation ============ */}
      <div className="border-b border-gray-200 bg-gray-50 rounded-none">
        <div className="flex">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============ Tab Content ============ */}
      <div className="pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab verdictData={verdictData} />}
            {activeTab === 'analysis' && <AnalysisTab verdictData={verdictData} judgment={judgment} />}
            {activeTab === 'individual' && <IndividualTab verdictData={verdictData} />}
            {activeTab === 'resolution' && <ResolutionTab verdictData={verdictData} judgment={judgment} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ============ Action Buttons ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 mt-5"
      >
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'AI 판사 판결 결과', text: removeMarkdown(verdictData.verdict.summary), url: window.location.href });
            }
          }}
          className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
        >
          <Share2 className="h-4 w-4" />
          <span>판결 결과 공유</span>
        </button>
        <button onClick={onNewCase} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg">
          새 사건 접수
        </button>
        <button onClick={onBackToMain} className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg">
          메인으로
        </button>
      </motion.div>
    </motion.div>
  );
};

// ==================== Fallback Builder (legacy compat) ====================

function buildFallbackVerdictData(judgment: any): ExtendedVerdictData {
  // If the judgment already has responses in the new format, use them
  if (judgment?.responses && Array.isArray(judgment.responses) && judgment.responses.length > 0) {
    return {
      responses: judgment.responses,
      verdict: typeof judgment.verdict === 'object' ? {
        summary: judgment.verdict.summary || judgment.caseSummary || '',
        conflict_root_cause: judgment.verdict.conflict_root_cause || judgment.analysis?.rootCause || '',
        recommendation: judgment.verdict.recommendation || '',
        giftSuggestions: judgment.verdict.giftSuggestions || judgment.giftSuggestions,
        overallSeverity: judgment.verdict.overallSeverity || 'medium',
        keyInsights: judgment.verdict.keyInsights || judgment.keyInsights || [],
        relationshipPrognosis: judgment.verdict.relationshipPrognosis || judgment.relationshipPrognosis,
      } : {
        summary: judgment.verdict || judgment.caseSummary || '판결 요약 없음',
        conflict_root_cause: judgment.analysis?.rootCause || '',
        recommendation: judgment.solutions?.[0] || '',
        overallSeverity: 'medium' as const,
        keyInsights: judgment.keyInsights || [],
      },
      stakeholderMap: judgment.stakeholderMap,
      conflictTimeline: judgment.conflictTimeline,
      faultSummaries: judgment.faultSummaries,
      verdictConfidence: judgment.verdictConfidence,
    };
  }

  // Legacy format - build from old flat structure
  const plaintiff = judgment?.responsibilityRatio?.plaintiff ?? 50;
  const defendant = judgment?.responsibilityRatio?.defendant ?? 50;

  return {
    responses: [
      {
        targetUser: '원고 (신청인)',
        analysis: judgment?.analysis?.psychologicalPattern || '분석 없음',
        message: '판결 결과를 확인해 주세요.',
        style: '미분류',
        percentage: plaintiff,
        reasoning: judgment?.solutions || [],
        punishment: judgment?.coreAdvice || '',
        dimensionalScores: judgment?.dimensionalScores?.plaintiff,
        expandedScores: judgment?.expandedScores?.plaintiff,
      },
      {
        targetUser: '피고 (상대방)',
        analysis: judgment?.analysis?.communicationIssues || '분석 없음',
        message: '판결 결과를 확인해 주세요.',
        style: '미분류',
        percentage: defendant,
        reasoning: [],
        punishment: '',
        dimensionalScores: judgment?.dimensionalScores?.defendant,
        expandedScores: judgment?.expandedScores?.defendant,
      },
    ],
    verdict: {
      summary: judgment?.verdict || judgment?.caseSummary || '판결 요약 없음',
      conflict_root_cause: judgment?.analysis?.rootCause || '',
      recommendation: judgment?.reasoning || '',
      overallSeverity: 'medium',
      keyInsights: judgment?.keyInsights || [],
      relationshipPrognosis: judgment?.relationshipPrognosis,
      giftSuggestions: judgment?.giftSuggestions,
    },
    stakeholderMap: judgment?.stakeholderMap,
    conflictTimeline: judgment?.conflictTimeline,
    faultSummaries: judgment?.faultSummaries,
    verdictConfidence: judgment?.verdictConfidence,
  };
}

export default Step5Result;
