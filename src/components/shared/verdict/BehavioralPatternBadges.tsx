'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  Zap,
  MessageCircle,
} from 'lucide-react';
import type { BehavioralPattern, CommunicationStyle } from '@/types/verdict';

// ===========================================================================
// Shared helpers
// ===========================================================================

const CATEGORY_STYLES = {
  positive: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    label: '긍정',
  },
  negative: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    dot: 'bg-red-500',
    label: '부정',
  },
  neutral: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    label: '중립',
  },
} as const;

const FREQUENCY_MAP: Record<BehavioralPattern['frequency'], number> = {
  rare: 1,
  occasional: 2,
  frequent: 3,
  constant: 4,
};

const FREQUENCY_LABEL: Record<BehavioralPattern['frequency'], string> = {
  rare: '드물게',
  occasional: '가끔',
  frequent: '자주',
  constant: '지속',
};

// ---------------------------------------------------------------------------
// Frequency dots
// ---------------------------------------------------------------------------

function FrequencyDots({ frequency, colorClass }: { frequency: BehavioralPattern['frequency']; colorClass: string }) {
  const count = FREQUENCY_MAP[frequency];
  return (
    <span className="inline-flex items-center gap-0.5 ml-1" aria-label={`빈도: ${FREQUENCY_LABEL[frequency]}`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${i < count ? colorClass : 'bg-gray-200'}`}
        />
      ))}
    </span>
  );
}

// ===========================================================================
// BehavioralPatternBadges
// ===========================================================================

interface BehavioralPatternBadgesProps {
  patterns: BehavioralPattern[];
  compact?: boolean;
}

export function BehavioralPatternBadges({ patterns, compact = false }: BehavioralPatternBadgesProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Group by category, maintaining order: positive -> neutral -> negative
  const ordered: BehavioralPattern['category'][] = ['positive', 'neutral', 'negative'];
  const grouped = ordered
    .map((cat) => ({
      category: cat,
      items: patterns.filter((p) => p.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const toggle = (globalIdx: number) => {
    setExpandedIdx((prev) => (prev === globalIdx ? null : globalIdx));
  };

  let globalIndex = -1;

  return (
    <div className="space-y-3 w-full">
      {grouped.map((group) => {
        const style = CATEGORY_STYLES[group.category];
        return (
          <div key={group.category}>
            {/* Category label */}
            {!compact && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {style.label} 패턴
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((pattern) => {
                globalIndex += 1;
                const idx = globalIndex;
                const isExpanded = expandedIdx === idx;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.06, ease: 'easeOut' }}
                    className="flex flex-col"
                  >
                    {/* Pill button */}
                    <button
                      type="button"
                      onClick={() => toggle(idx)}
                      className={`
                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full border
                        text-xs font-medium transition-all duration-200
                        ${style.bg} ${style.border} ${style.text}
                        hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400
                      `}
                      aria-expanded={isExpanded}
                    >
                      <span className="truncate max-w-[160px]">{pattern.pattern}</span>
                      <FrequencyDots frequency={pattern.frequency} colorClass={style.dot} />
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className={`mt-1.5 p-2.5 rounded-lg border ${style.bg} ${style.border} text-[11px] sm:text-xs space-y-2`}>
                            {/* Examples */}
                            {pattern.examples.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-600">사례:</span>
                                <ul className="mt-0.5 space-y-0.5 text-gray-700">
                                  {pattern.examples.map((ex, ei) => (
                                    <li key={ei} className="flex items-start gap-1">
                                      <span className="flex-shrink-0 mt-1 w-1 h-1 rounded-full bg-gray-400" />
                                      {ex}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Recommendation */}
                            {pattern.recommendation && (
                              <div>
                                <span className="font-semibold text-gray-600">추천:</span>
                                <p className="mt-0.5 text-gray-700 leading-relaxed">
                                  {pattern.recommendation}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================================================
// CommunicationStyleCard
// ===========================================================================

interface CommunicationStyleCardProps {
  style: CommunicationStyle;
  userName: string;
}

function ListSection({
  items,
  icon,
  iconColorClass,
  label,
  delay,
}: {
  items: string[];
  icon: React.ReactNode;
  iconColorClass: string;
  label: string;
  delay: number;
}) {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={iconColorClass}>{icon}</span>
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <span className={`flex-shrink-0 mt-0.5 ${iconColorClass}`}>{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function CommunicationStyleCard({ style, userName }: CommunicationStyleCardProps) {
  return (
    <motion.div
      className="w-full rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-bold text-gray-900">{userName}님 소통 스타일</span>
      </div>

      {/* Style badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <motion.span
          className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm font-bold shadow"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          {style.primary}
        </motion.span>
        {style.secondary && (
          <motion.span
            className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            {style.secondary}
          </motion.span>
        )}
      </div>

      {/* Strengths */}
      <ListSection
        items={style.strengths}
        icon={<Check className="w-3.5 h-3.5" />}
        iconColorClass="text-emerald-500"
        label="강점"
        delay={0.4}
      />

      {/* Weaknesses */}
      <ListSection
        items={style.weaknesses}
        icon={<X className="w-3.5 h-3.5" />}
        iconColorClass="text-red-500"
        label="약점"
        delay={0.55}
      />

      {/* Triggers */}
      <ListSection
        items={style.triggers}
        icon={<Zap className="w-3.5 h-3.5" />}
        iconColorClass="text-amber-500"
        label="트리거"
        delay={0.7}
      />
    </motion.div>
  );
}
