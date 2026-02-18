'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Heart,
  Activity,
  Shield,
  Target,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  User,
  Quote,
} from 'lucide-react';
import type { FaultEvidence, FaultSummary } from '@/types/verdict';

// ==================== Constants ====================

type Severity = FaultEvidence['severity'];
type Category = FaultEvidence['category'];

const SEVERITY_LABELS: Record<Severity, string> = {
  minor: '경미',
  moderate: '보통',
  serious: '심각',
  critical: '치명적',
};

const SEVERITY_COLORS: Record<Severity, {
  border: string;
  badge: string;
  badgeText: string;
  dot: string;
}> = {
  minor: {
    border: 'border-l-blue-400',
    badge: 'bg-blue-50 ring-1 ring-blue-200',
    badgeText: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  moderate: {
    border: 'border-l-amber-400',
    badge: 'bg-amber-50 ring-1 ring-amber-200',
    badgeText: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  serious: {
    border: 'border-l-orange-500',
    badge: 'bg-orange-50 ring-1 ring-orange-200',
    badgeText: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  critical: {
    border: 'border-l-red-500',
    badge: 'bg-red-50 ring-1 ring-red-200',
    badgeText: 'text-red-700',
    dot: 'bg-red-500',
  },
};

const CATEGORY_LABELS: Record<Category, string> = {
  communication: '의사소통',
  emotional: '감정',
  behavioral: '행동',
  moral: '도덕',
  responsibility: '책임감',
};

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  communication: MessageCircle,
  emotional: Heart,
  behavioral: Activity,
  moral: Shield,
  responsibility: Target,
};

const CATEGORY_COLORS: Record<Category, string> = {
  communication: 'text-sky-600',
  emotional: 'text-rose-500',
  behavioral: 'text-teal-600',
  moral: 'text-indigo-600',
  responsibility: 'text-amber-600',
};

// ==================== EvidenceCard ====================

interface EvidenceCardProps {
  evidence: FaultEvidence;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const severityStyle = SEVERITY_COLORS[evidence.severity];
  const CategoryIcon = CATEGORY_ICONS[evidence.category];

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 border-l-4 ${severityStyle.border}
        shadow-sm hover:shadow-md transition-shadow duration-200
      `}
    >
      <div className="p-4 space-y-3">
        {/* Top row: severity badge + category icon + target person */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Severity badge */}
            <span
              className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                ${severityStyle.badge} ${severityStyle.badgeText}
              `}
            >
              {SEVERITY_LABELS[evidence.severity]}
            </span>

            {/* Category icon + label */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${CATEGORY_COLORS[evidence.category]}`}>
              <CategoryIcon className="w-3.5 h-3.5" />
              {CATEGORY_LABELS[evidence.category]}
            </span>
          </div>

          {/* Target person tag */}
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            <User className="w-3 h-3" />
            {evidence.targetPerson}
          </span>
        </div>

        {/* Quote block */}
        {evidence.quote && (
          <div className="relative bg-gray-50 rounded-md border-l-2 border-gray-300 px-3 py-2">
            <Quote className="absolute top-2 right-2 w-3.5 h-3.5 text-gray-300" />
            <p className="text-sm italic text-gray-600 leading-relaxed pr-5">
              &ldquo;{evidence.quote}&rdquo;
            </p>
          </div>
        )}

        {/* Behavior description */}
        <p className="text-sm text-gray-800 leading-relaxed">
          {evidence.behavior}
        </p>

        {/* Impact */}
        <div className="flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            {evidence.impact}
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== SummaryCard (internal) ====================

interface SummaryCardProps {
  summary: FaultSummary;
}

function SummaryCard({ summary }: SummaryCardProps) {
  const severityOrder: Severity[] = ['critical', 'serious', 'moderate', 'minor'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
            {summary.person.charAt(0)}
          </div>
          <span className="font-semibold text-gray-900 text-sm">{summary.person}</span>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          과실 {summary.totalFaults}건
        </span>
      </div>

      {/* Severity dot distribution */}
      <div className="flex items-center gap-3 mb-3">
        {severityOrder.map((sev) => {
          const count = summary.faultsBySeverity[sev] || 0;
          if (count === 0) return null;
          return (
            <div key={sev} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${SEVERITY_COLORS[sev].dot}`} />
              <span className="text-xs text-gray-600">
                {SEVERITY_LABELS[sev]} {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main issues */}
      {summary.mainIssues.length > 0 && (
        <ul className="space-y-1">
          {summary.mainIssues.map((issue, idx) => (
            <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
              <span className="text-gray-400 mt-0.5 flex-shrink-0">&bull;</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==================== CollapsibleGroup (internal) ====================

interface CollapsibleGroupProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleGroup({ title, count, children, defaultOpen = true }: CollapsibleGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between
          py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100
          transition-colors duration-150 text-left
        "
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-800 text-sm">
          {title}
          <span className="ml-2 text-xs font-normal text-gray-500">({count}건)</span>
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== EvidenceCardList ====================

interface EvidenceCardListProps {
  evidences: FaultEvidence[];
  groupBy?: 'person' | 'severity';
  faultSummaries?: FaultSummary[];
}

const SEVERITY_SORT_ORDER: Record<Severity, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

export function EvidenceCardList({
  evidences,
  groupBy = 'person',
  faultSummaries,
}: EvidenceCardListProps) {
  const grouped = useMemo(() => {
    const groups = new Map<string, FaultEvidence[]>();

    if (groupBy === 'person') {
      for (const ev of evidences) {
        const key = ev.targetPerson;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(ev);
      }
    } else {
      // Group by severity, ordered critical -> minor
      const orderedKeys: Severity[] = ['critical', 'serious', 'moderate', 'minor'];
      for (const sev of orderedKeys) {
        const matches = evidences.filter((e) => e.severity === sev);
        if (matches.length > 0) {
          groups.set(sev, matches);
        }
      }
    }

    return groups;
  }, [evidences, groupBy]);

  const getGroupLabel = useCallback(
    (key: string): string => {
      if (groupBy === 'severity') {
        return `${SEVERITY_LABELS[key as Severity]} 과실`;
      }
      return `${key}`;
    },
    [groupBy],
  );

  if (evidences.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        분석된 과실 근거가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fault summaries */}
      {faultSummaries && faultSummaries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            과실 요약
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {faultSummaries.map((summary, idx) => (
              <motion.div
                key={summary.person}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
              >
                <SummaryCard summary={summary} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped evidence cards */}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([key, items]) => (
          <CollapsibleGroup
            key={key}
            title={getGroupLabel(key)}
            count={items.length}
            defaultOpen
          >
            {items
              .sort((a, b) => SEVERITY_SORT_ORDER[a.severity] - SEVERITY_SORT_ORDER[b.severity])
              .map((ev, idx) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: idx * 0.06,
                    ease: 'easeOut',
                  }}
                >
                  <EvidenceCard evidence={ev} />
                </motion.div>
              ))}
          </CollapsibleGroup>
        ))}
      </div>
    </div>
  );
}

export default EvidenceCard;
