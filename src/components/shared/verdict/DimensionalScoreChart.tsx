'use client';

import { motion } from 'framer-motion';
import type { DimensionalScores } from '@/types/verdict';
import { DIMENSION_LABELS } from '@/types/verdict';

interface DimensionalScoreChartProps {
  scores: DimensionalScores;
  userName: string;
  compact?: boolean;
}

const DIMENSION_COLORS: Record<keyof DimensionalScores, string> = {
  emotional: 'from-rose-400 to-rose-500',
  logical: 'from-blue-400 to-blue-500',
  communication: 'from-emerald-400 to-emerald-500',
  empathy: 'from-purple-400 to-purple-500',
  responsibility: 'from-amber-400 to-amber-500',
};

const DIMENSION_BG: Record<keyof DimensionalScores, string> = {
  emotional: 'bg-rose-100',
  logical: 'bg-blue-100',
  communication: 'bg-emerald-100',
  empathy: 'bg-purple-100',
  responsibility: 'bg-amber-100',
};

const DIMENSION_TEXT: Record<keyof DimensionalScores, string> = {
  emotional: 'text-rose-700',
  logical: 'text-blue-700',
  communication: 'text-emerald-700',
  empathy: 'text-purple-700',
  responsibility: 'text-amber-700',
};

const DIMENSION_ICONS: Record<keyof DimensionalScores, string> = {
  emotional: '💭',
  logical: '🧠',
  communication: '💬',
  empathy: '💗',
  responsibility: '⚡',
};

export default function DimensionalScoreChart({ scores, userName, compact = false }: DimensionalScoreChartProps) {
  const dimensions = Object.keys(scores) as (keyof DimensionalScores)[];

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact && (
        <div className="text-sm font-semibold text-gray-700 mb-2">{userName}님 다차원 분석</div>
      )}
      {dimensions.map((dim, idx) => (
        <div key={dim} className="flex items-center space-x-2">
          <div className={`flex-shrink-0 w-16 sm:w-20 flex items-center space-x-1 ${DIMENSION_TEXT[dim]}`}>
            <span className="text-xs">{DIMENSION_ICONS[dim]}</span>
            <span className={`text-xs font-medium truncate ${compact ? '' : 'sm:text-sm'}`}>
              {DIMENSION_LABELS[dim]}
            </span>
          </div>
          <div className={`flex-1 ${DIMENSION_BG[dim]} rounded-full ${compact ? 'h-3' : 'h-4'} overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${scores[dim]}%` }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${DIMENSION_COLORS[dim]} rounded-full`}
            />
          </div>
          <span className={`flex-shrink-0 w-8 text-right font-bold ${DIMENSION_TEXT[dim]} ${compact ? 'text-xs' : 'text-sm'}`}>
            {scores[dim]}
          </span>
        </div>
      ))}
    </div>
  );
}
