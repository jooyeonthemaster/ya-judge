'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  Heart,
  XCircle,
  Clock,
  Flame,
  HandHelping,
} from 'lucide-react';
import type { ConflictTimeline, TimelineEvent } from '@/types/verdict';
import type { LucideIcon } from 'lucide-react';

// ==================== Props ====================

interface ConflictTimelineProps {
  timeline: ConflictTimeline;
  compact?: boolean;
}

// ==================== Type Configuration ====================

interface EventTypeConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
  label: string;
}

const EVENT_TYPE_CONFIG: Record<TimelineEvent['type'], EventTypeConfig> = {
  trigger: {
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    ringColor: 'ring-blue-200',
    label: '발단',
  },
  escalation: {
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    ringColor: 'ring-orange-200',
    label: '격화',
  },
  turning_point: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    ringColor: 'ring-yellow-200',
    label: '전환점',
  },
  attempt_resolution: {
    icon: Heart,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    ringColor: 'ring-emerald-200',
    label: '해소 시도',
  },
  breakdown: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    ringColor: 'ring-red-200',
    label: '결렬',
  },
};

// ==================== Helpers ====================

function isPeakEvent(event: TimelineEvent, peakMoment: string): boolean {
  if (!peakMoment) return false;
  const normalizedPeak = peakMoment.toLowerCase().trim();
  return (
    event.title.toLowerCase().trim().includes(normalizedPeak) ||
    normalizedPeak.includes(event.title.toLowerCase().trim()) ||
    event.description.toLowerCase().trim().includes(normalizedPeak) ||
    normalizedPeak.includes(event.description.toLowerCase().trim())
  );
}

function getImpactBarWidth(impact: number): number {
  return Math.min(Math.abs(impact), 100);
}

// ==================== Animation Variants ====================

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const eventVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const footerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.3 },
  },
};

// ==================== Sub-Components ====================

function EmotionalImpactBadge({
  impact,
}: {
  impact: number;
  compact?: boolean;
}) {
  const getConfig = (val: number) => {
    if (val <= -60) return { emoji: '🔥', label: '상황 크게 악화', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    if (val <= -30) return { emoji: '😤', label: '갈등 심화', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    if (val < 0) return { emoji: '😕', label: '분위기 나빠짐', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    if (val === 0) return { emoji: '😐', label: '변화 없음', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
    if (val <= 30) return { emoji: '🤝', label: '분위기 나아짐', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (val <= 60) return { emoji: '😊', label: '갈등 완화', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
    return { emoji: '💚', label: '크게 개선', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
  };

  const c = getConfig(impact);

  return (
    <div className="mt-1.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.text} border ${c.border}`}>
        <span>{c.emoji}</span>
        {c.label}
      </span>
    </div>
  );
}

function EventNode({
  event,
  isPeak,
  compact,
  isLast,
}: {
  event: TimelineEvent;
  isPeak: boolean;
  compact: boolean;
  isLast: boolean;
}) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;
  const nodeSize = compact ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = compact ? 14 : 18;

  return (
    <motion.div
      variants={eventVariants}
      className="relative flex gap-3 sm:gap-4"
    >
      {/* Left column: node + connecting segment */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Circle node */}
        <div
          className={[
            nodeSize,
            'rounded-full flex items-center justify-center',
            'border-2 shadow-sm relative z-10',
            config.bgColor,
            config.borderColor,
            isPeak ? 'ring-2 ring-offset-1 ring-amber-400 shadow-amber-200/60 shadow-md' : '',
          ].join(' ')}
        >
          <Icon size={iconSize} className={config.color} strokeWidth={2.5} />
        </div>
        {/* Connecting line segment below node */}
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[16px] bg-gradient-to-b from-gray-200 to-gray-300" />
        )}
      </div>

      {/* Right column: event card */}
      <div className={`flex-1 ${isLast ? '' : compact ? 'pb-3' : 'pb-4'}`}>
        <div
          className={[
            'rounded-xl border bg-white shadow-sm',
            compact ? 'p-2.5' : 'p-3 sm:p-4',
            isPeak
              ? 'border-amber-300 bg-amber-50/30 shadow-amber-100/50'
              : 'border-gray-200',
          ].join(' ')}
        >
          {/* Header row: type badge + peak indicator */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={[
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                config.bgColor,
                config.color,
              ].join(' ')}
            >
              {config.label}
            </span>
            {isPeak && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                <Flame size={10} />
                절정
              </span>
            )}
          </div>

          {/* Title */}
          <h4
            className={[
              'font-bold text-gray-900 leading-snug',
              compact ? 'text-xs' : 'text-sm',
            ].join(' ')}
          >
            {event.title}
          </h4>

          {/* Description */}
          <p
            className={[
              'text-gray-600 leading-relaxed mt-0.5',
              compact ? 'text-[11px]' : 'text-xs sm:text-sm',
            ].join(' ')}
          >
            {event.description}
          </p>

          {/* Involved parties */}
          {event.involvedParties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.involvedParties.map((party) => (
                <span
                  key={party}
                  className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium border border-gray-200"
                >
                  {party}
                </span>
              ))}
            </div>
          )}

          {/* Emotional impact badge */}
          <EmotionalImpactBadge impact={event.emotionalImpact} />
        </div>
      </div>
    </motion.div>
  );
}

// ==================== Main Component ====================

export default function ConflictTimelineView({
  timeline,
  compact = false,
}: ConflictTimelineProps) {
  const sortedEvents = [...timeline.events].sort((a, b) => a.order - b.order);

  // Find peak event -- if peakMoment matches none, fall back to most negative impact
  let peakEventId: string | null = null;
  for (const event of sortedEvents) {
    if (isPeakEvent(event, timeline.peakMoment)) {
      peakEventId = event.id;
      break;
    }
  }
  if (!peakEventId && sortedEvents.length > 0) {
    const mostIntense = sortedEvents.reduce((prev, curr) =>
      Math.abs(curr.emotionalImpact) > Math.abs(prev.emotionalImpact) ? curr : prev,
    );
    peakEventId = mostIntense.id;
  }

  return (
    <div className="w-full">
      {/* Section header */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">갈등 타임라인</h3>
            <p className="text-[11px] text-gray-500">
              갈등의 시작부터 현재까지의 흐름
            </p>
          </div>
        </motion.div>
      )}

      {/* Timeline events */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {/* Background gradient line (absolute, behind nodes) */}
        {sortedEvents.length > 1 && (
          <div
            className="absolute left-[15px] sm:left-[19px] top-5 bottom-5 w-0.5 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, #86efac, #fbbf24, #f87171)',
            }}
            aria-hidden="true"
          />
        )}

        {sortedEvents.map((event, index) => (
          <EventNode
            key={event.id}
            event={event}
            isPeak={event.id === peakEventId}
            compact={compact}
            isLast={index === sortedEvents.length - 1}
          />
        ))}
      </motion.div>

      {/* Summary footer */}
      <motion.div
        variants={footerVariants}
        initial="hidden"
        animate="visible"
        className={[
          'grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-gray-50',
          compact ? 'mt-3 p-2.5' : 'mt-4 p-3 sm:p-4',
        ].join(' ')}
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock size={12} className="text-gray-400" />
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              기간
            </span>
          </div>
          <p
            className={[
              'font-bold text-gray-900',
              compact ? 'text-xs' : 'text-sm',
            ].join(' ')}
          >
            {timeline.totalDuration}
          </p>
        </div>

        <div className="text-center border-x border-gray-200">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame size={12} className="text-amber-500" />
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              절정
            </span>
          </div>
          <p
            className={[
              'font-bold text-gray-900 leading-tight',
              compact ? 'text-[10px]' : 'text-xs',
            ].join(' ')}
          >
            {timeline.peakMoment}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <HandHelping size={12} className="text-emerald-500" />
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              해소 시도
            </span>
          </div>
          <p
            className={[
              'font-bold text-gray-900',
              compact ? 'text-xs' : 'text-sm',
            ].join(' ')}
          >
            {timeline.resolutionAttempts}회
          </p>
        </div>
      </motion.div>
    </div>
  );
}
