import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Gavel, X, AlertTriangle, CheckCircle2, Crown,
  Users, FileText, TrendingUp, TrendingDown, Award, Target,
  RotateCcw, Gift, Banknote, Eye, BarChart3, UserCircle,
  Lightbulb, Shield, MessageCircle, Zap, Heart, Activity,
  ChevronDown, ChevronUp
} from 'lucide-react';
import type {
  ExtendedVerdictData, GiftSuggestion,
  FaultEvidence, BehavioralPattern, CommunicationStyle,
  StakeholderMap, ConflictTimeline as ConflictTimelineType,
  FaultSummary, VerdictConfidence, ExpandedDimensionalScores,
  DimensionalScores
} from '@/types/verdict';
import { EXPANDED_DIMENSION_LABELS, DIMENSION_LABELS } from '@/types/verdict';
import ResponsibilityGauge from '@/components/shared/verdict/ResponsibilityGauge';


// Lazy-load heavy visualization components
import dynamic from 'next/dynamic';
const ConflictTimeline = dynamic(() => import('@/components/shared/verdict/ConflictTimeline'), { ssr: false });
const EvidenceCardList = dynamic(() => import('@/components/shared/verdict/EvidenceCard').then(m => ({ default: m.EvidenceCardList })), { ssr: false });
const RelationshipMap = dynamic(() => import('@/components/shared/verdict/RelationshipMap'), { ssr: false });
const ComparativeBarChart = dynamic(() => import('@/components/shared/verdict/ComparativeBarChart'), { ssr: false });
const ConfidenceMeter = dynamic(() => import('@/components/shared/verdict/ConfidenceMeter'), { ssr: false });
const BehavioralPatternBadges = dynamic(() => import('@/components/shared/verdict/BehavioralPatternBadges').then(m => ({ default: m.BehavioralPatternBadges })), { ssr: false });
const CommunicationStyleCard = dynamic(() => import('@/components/shared/verdict/BehavioralPatternBadges').then(m => ({ default: m.CommunicationStyleCard })), { ssr: false });

interface VerdictModalProps {
  isOpen: boolean;
  onClose: () => void;
  verdictData: ExtendedVerdictData | null;
  showRetrialCTA?: boolean;
  onRequestRetrial?: () => void;
  onPayPenalty?: (amount: number, reason: string) => void;
  onPayGift?: (gift: GiftSuggestion) => void;
}

type TabType = 'overview' | 'analysis' | 'individual' | 'resolution';

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 }
};
const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// ==================== Sub Components ====================

const DimensionBars = ({ scores, color }: { scores: ExpandedDimensionalScores | DimensionalScores; color: string }) => {
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

const SeverityBadge = ({ severity }: { severity: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: 'bg-green-100', text: 'text-green-700', label: '경미' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '보통' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', label: '심각' },
    critical: { bg: 'bg-red-100', text: 'text-red-700', label: '치명적' },
  };
  const c = config[severity] || config.medium;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>{c.label}</span>;
};

const WinnerDisplay = ({ responses }: { responses: ExtendedVerdictData['responses'] }) => {
  if (!responses || responses.length < 2) return null;
  const sorted = [...responses].sort((a, b) => a.percentage - b.percentage);
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];
  const isTie = winner.percentage === loser.percentage;
  const totalPct = winner.percentage + loser.percentage;
  const normWinner = totalPct > 0 ? Math.round((winner.percentage / totalPct) * 100) : 50;
  const normLoser = 100 - normWinner;

  if (isTie) {
    return (
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border border-amber-200">
        <div className="flex items-center space-x-2 mb-3">
          <Scale className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-bold text-amber-900">양측 동등 책임</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {responses.map((r, i) => (
            <div key={i} className="bg-amber-100/70 p-3 rounded-lg text-center">
              <div className="text-base font-bold text-amber-800">{r.targetUser}님</div>
              <div className="text-sm text-amber-600">책임도 50%</div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl border border-gray-200">
      {/* Gradient background bar */}
      <div className="flex h-16 sm:h-20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normLoser}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center"
        >
          <div className="text-white text-center px-2">
            <div className="text-xs font-medium opacity-80">더 합리적</div>
            <div className="text-sm sm:text-base font-bold">{winner.targetUser}</div>
          </div>
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normWinner}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
          className="bg-gradient-to-r from-rose-400 to-rose-500 flex items-center justify-center"
        >
          <div className="text-white text-center px-2">
            <div className="text-xs font-medium opacity-80">더 많은 책임</div>
            <div className="text-sm sm:text-base font-bold">{loser.targetUser}</div>
          </div>
        </motion.div>
      </div>
      <div className="flex justify-between px-3 py-1.5 bg-gray-50 text-xs text-gray-500">
        <span>책임 {normWinner}%</span>
        <span className="font-medium text-gray-700">갈등 책임 비율</span>
        <span>책임 {normLoser}%</span>
      </div>
    </motion.div>
  );
};

const InsightCard = ({ insight, index }: { insight: string; index: number }) => {
  const colors = ['border-l-indigo-500 bg-indigo-50/50', 'border-l-emerald-500 bg-emerald-50/50', 'border-l-amber-500 bg-amber-50/50', 'border-l-rose-500 bg-rose-50/50', 'border-l-violet-500 bg-violet-50/50'];
  return (
    <motion.div variants={itemVariants} className={`border-l-4 ${colors[index % colors.length]} p-3 rounded-r-lg`}>
      <div className="flex items-start space-x-2">
        <Lightbulb className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
      </div>
    </motion.div>
  );
};

// ==================== Tab Components ====================

const OverviewTab = ({ verdictData }: { verdictData: ExtendedVerdictData }) => {
  const responses = verdictData.responses || [];

  // Calculate normalized percentages
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
      {/* ===== HERO: Fault Percentage Display ===== */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="text-center mb-1">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center justify-center gap-2">
            <Gavel className="h-5 w-5 text-indigo-600" />
            과실 비율 판정
          </h3>
        </div>

        {/* Per-person big fault cards */}
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
                {/* Label badge */}
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 ${c.labelBg} text-white text-[10px] sm:text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap`}>
                  {c.label}
                </span>

                {/* Name */}
                <div className="text-sm sm:text-base font-bold text-gray-800 mt-1 mb-2">{p.name}</div>

                {/* Big percentage */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                  className={`text-4xl sm:text-6xl font-black ${c.text} tabular-nums leading-none`}
                >
                  {p.pct}<span className="text-lg sm:text-2xl">%</span>
                </motion.div>

                {/* Visual bar */}
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

        {/* VS divider or combined bar for 2 people */}
        {participants.length === 2 && (
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-xl"
          >
            <div className="flex h-10 sm:h-12">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${participants[0].pct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                className={`flex items-center justify-center text-white text-xs sm:text-sm font-bold ${participants[0].pct >= 55 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
              >
                {participants[0].pct}%
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${participants[1].pct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                className={`flex items-center justify-center text-white text-xs sm:text-sm font-bold ${participants[1].pct >= 55 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
              >
                {participants[1].pct}%
              </motion.div>
            </div>
            <div className="flex justify-between px-3 py-1 bg-gray-50 text-xs text-gray-500">
              <span>{participants[0].name}</span>
              <span className="font-medium text-gray-700">과실 비율</span>
              <span>{participants[1].name}</span>
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
        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{verdictData.verdict.summary}</p>
      </motion.div>

      {/* Relationship Prognosis */}
      {verdictData.verdict.relationshipPrognosis && (
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 sm:p-5 rounded-xl border border-violet-200">
          <h3 className="text-base sm:text-lg font-bold text-violet-900 mb-2 flex items-center">
            <Heart className="h-4 w-4 mr-2 text-violet-600" />
            관계 예후
          </h3>
          <p className="text-violet-800 text-sm leading-relaxed">{verdictData.verdict.relationshipPrognosis}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

const AnalysisTab = ({ verdictData }: { verdictData: ExtendedVerdictData }) => {
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

      {/* Comparative Bar Chart (9차원 역량 비교 - 레이더/매트릭스와 동일 데이터이므로 하나만 표시) */}
      {hasExpanded && (
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-indigo-600" />
            9차원 역량 비교
          </h3>
          <ComparativeBarChart
            personA={{ name: responses[0].targetUser, scores: responses[0].expandedScores! }}
            personB={{ name: responses[1].targetUser, scores: responses[1].expandedScores! }}
          />
        </motion.div>
      )}

      {/* Root Cause */}
      <motion.div variants={itemVariants} className="bg-red-50 p-4 sm:p-5 rounded-xl border border-red-200">
        <h3 className="text-base sm:text-lg font-bold text-red-900 mb-3 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
          갈등의 근본 원인
        </h3>
        <p className="text-red-800 text-sm sm:text-base leading-relaxed">{verdictData.verdict.conflict_root_cause}</p>
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

          {/* Dimensional Scores Bar Chart */}
          {(active.expandedScores || active.dimensionalScores) && (
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <Target className="h-4 w-4 mr-1.5 text-indigo-500" />
                {active.expandedScores ? '9차원 역량 분석' : '5차원 역량 분석'}
              </h4>
              <DimensionBars
                scores={active.expandedScores || active.dimensionalScores!}
                color={activeIdx === 0 ? '#6366f1' : '#f43f5e'}
              />
            </div>
          )}

          {/* Analysis */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-1.5 text-indigo-600" />
              상세 분석
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">{active.analysis}</p>
          </div>

          {/* Judge Message */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center">
              <Gavel className="h-4 w-4 mr-1.5 text-blue-600" />
              판사 메시지
            </h4>
            <p className="text-blue-800 text-sm leading-relaxed border-l-4 border-blue-400 pl-3">{active.message}</p>
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
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <h4 className="text-sm font-bold text-yellow-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-1.5 text-yellow-600" />
              판단 근거
            </h4>
            <div className="space-y-1.5">
              {active.reasoning.map((r, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="text-yellow-600 font-bold text-xs mt-0.5">{i + 1}.</span>
                  <p className="text-yellow-800 text-sm leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Punishment/Improvement */}
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center">
              <Gavel className="h-4 w-4 mr-1.5 text-red-600" />
              개선 및 처벌 사항
            </h4>
            <p className="text-red-800 text-sm leading-relaxed">{active.punishment}</p>
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

const ResolutionTab = ({ verdictData, showRetrialCTA, onRequestRetrial, onPayPenalty, onPayGift }: {
  verdictData: ExtendedVerdictData;
  showRetrialCTA?: boolean;
  onRequestRetrial?: () => void;
  onPayPenalty?: (amount: number, reason: string) => void;
  onPayGift?: (gift: GiftSuggestion) => void;
}) => (
  <motion.div variants={contentVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-5">
    {/* Recommendation */}
    <motion.div variants={itemVariants} className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200">
      <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 flex items-center">
        <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
        개선 권고사항
      </h3>
      <p className="text-blue-800 text-sm sm:text-base leading-relaxed">{verdictData.verdict.recommendation}</p>
    </motion.div>

    {/* Gift Suggestions */}
    {verdictData.verdict.giftSuggestions && verdictData.verdict.giftSuggestions.length > 0 && (
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 sm:p-5 rounded-xl border border-pink-200">
        <h3 className="text-base sm:text-lg font-bold text-pink-900 mb-3 flex items-center">
          <Gift className="h-4 w-4 mr-2 text-pink-600" />
          화해 선물 추천
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {verdictData.verdict.giftSuggestions.map((gift, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-pink-100 shadow-sm">
              <div className="text-xs font-medium text-pink-500 mb-1">
                {gift.category === 'small' ? '소소한 마음' : gift.category === 'medium' ? '진심 담은' : '특별한 화해'}
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">{gift.item}</div>
              <div className="text-pink-600 font-bold text-sm mb-1">{gift.price?.toLocaleString()}원</div>
              <div className="text-xs text-gray-500 mb-2">{gift.reason}</div>
              {onPayGift && (
                <button
                  onClick={() => onPayGift(gift)}
                  className="w-full text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white py-1.5 rounded-md hover:from-pink-600 hover:to-rose-600 transition-all font-medium"
                >
                  선물하기
                </button>
              )}
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
            <p className="text-xs text-gray-500 mb-3">{r.penaltyInfo!.description}</p>
            {onPayPenalty && (
              <button
                onClick={() => onPayPenalty(r.penaltyInfo!.amount, r.penaltyInfo!.reason)}
                className="w-full text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium flex items-center justify-center space-x-1"
              >
                <Gavel className="h-4 w-4" />
                <span>벌금 납부하기</span>
              </button>
            )}
          </div>
        ))}
      </motion.div>
    )}

    {/* Retrial CTA */}
    {showRetrialCTA && onRequestRetrial && (
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-5 rounded-xl border border-indigo-200">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <RotateCcw className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-indigo-900">판결이 불공정하다고 느끼셨나요?</h3>
          </div>
          <p className="text-sm text-indigo-700">재심을 청구하여 새로운 판결을 받아보세요</p>
          <button
            onClick={onRequestRetrial}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 mx-auto"
          >
            <RotateCcw className="h-4 w-4" />
            <span>재심 청구하기</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">1,000원</span>
          </button>
        </div>
      </motion.div>
    )}
  </motion.div>
);

// ==================== Main Modal ====================

const TAB_CONFIG: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: '종합', icon: <Eye className="h-3.5 w-3.5" /> },
  { key: 'analysis', label: '분석', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { key: 'individual', label: '개별', icon: <UserCircle className="h-3.5 w-3.5" /> },
  { key: 'resolution', label: '해결', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
];

export default function VerdictModal({ isOpen, onClose, verdictData, showRetrialCTA, onRequestRetrial, onPayPenalty, onPayGift }: VerdictModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!verdictData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden" animate="visible" exit="hidden"
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4"
          style={{ willChange: 'opacity' }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200"
            style={{ willChange: 'transform, opacity' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-3 sm:p-5 text-white relative">
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
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
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

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-160px)]">
              <div className="p-3 sm:p-5">
                {activeTab === 'overview' && <OverviewTab verdictData={verdictData} />}
                {activeTab === 'analysis' && <AnalysisTab verdictData={verdictData} />}
                {activeTab === 'individual' && <IndividualTab verdictData={verdictData} />}
                {activeTab === 'resolution' && (
                  <ResolutionTab
                    verdictData={verdictData}
                    showRetrialCTA={showRetrialCTA}
                    onRequestRetrial={onRequestRetrial}
                    onPayPenalty={onPayPenalty}
                    onPayGift={onPayGift}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
