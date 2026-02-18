'use client';

import { motion } from 'framer-motion';
import { EXPANDED_DIMENSION_LABELS, DIMENSION_LABELS } from '@/types/verdict';

// ==================== Types ====================

interface PersonData {
  name: string;
  scores: Record<string, number>;
}

interface ComparativeBarChartProps {
  personA: PersonData;
  personB: PersonData;
  colorA?: string;
  colorB?: string;
}

// ==================== Helpers ====================

function getDimensionLabel(key: string): string {
  if (key in EXPANDED_DIMENSION_LABELS) {
    return EXPANDED_DIMENSION_LABELS[key as keyof typeof EXPANDED_DIMENSION_LABELS];
  }
  if (key in DIMENSION_LABELS) {
    return DIMENSION_LABELS[key as keyof typeof DIMENSION_LABELS];
  }
  return key;
}

function computeTotalScore(scores: Record<string, number>): number {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function getWinnerVerdict(
  avgA: number,
  avgB: number,
): 'A' | 'B' | 'draw' {
  const diff = Math.abs(avgA - avgB);
  if (diff <= 2) return 'draw';
  return avgA > avgB ? 'A' : 'B';
}

// ==================== Sub-components ====================

function WinnerBadge({
  winner,
  nameA,
  nameB,
  avgA,
  avgB,
  colorA,
  colorB,
}: {
  winner: 'A' | 'B' | 'draw';
  nameA: string;
  nameB: string;
  avgA: number;
  avgB: number;
  colorA: string;
  colorB: string;
}) {
  const isDraw = winner === 'draw';
  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : '';
  const winnerColor = winner === 'A' ? colorA : colorB;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className="mt-5 pt-4 border-t border-gray-200"
    >
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colorA }}
          />
          <span className="font-semibold text-gray-700">{nameA}</span>
          <span className="font-bold text-gray-900">{avgA}점</span>
        </div>

        <span className="text-gray-300 text-xs">vs</span>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colorB }}
          />
          <span className="font-semibold text-gray-700">{nameB}</span>
          <span className="font-bold text-gray-900">{avgB}점</span>
        </div>
      </div>

      <div className="mt-2.5 text-center">
        {isDraw ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 12h8" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            무승부
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-sm"
            style={{ backgroundColor: winnerColor }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {winnerName}님 종합 우위
          </span>
        )}
      </div>
    </motion.div>
  );
}

function DimensionRow({
  dimensionKey,
  scoreA,
  scoreB,
  colorA,
  colorB,
  index,
  isEven,
}: {
  dimensionKey: string;
  scoreA: number;
  scoreB: number;
  colorA: string;
  colorB: string;
  index: number;
  isEven: boolean;
}) {
  const label = getDimensionLabel(dimensionKey);
  const maxScore = 100;
  const pctA = Math.min(scoreA / maxScore, 1) * 100;
  const pctB = Math.min(scoreB / maxScore, 1) * 100;
  const aWins = scoreA > scoreB;
  const bWins = scoreB > scoreA;
  const delay = 0.15 + index * 0.08;

  return (
    <div
      className={`grid items-center gap-x-1 sm:gap-x-2 py-2 sm:py-2.5 px-1.5 sm:px-3 ${
        isEven ? 'bg-gray-50/60' : ''
      }`}
      style={{
        gridTemplateColumns: 'minmax(24px, 32px) 1fr minmax(56px, 80px) 1fr minmax(24px, 32px)',
      }}
    >
      {/* Score A */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
        className="text-[10px] sm:text-xs font-bold text-right tabular-nums"
        style={{ color: colorA }}
      >
        {scoreA}
      </motion.span>

      {/* Bar A - extends from right to left */}
      <div className="flex justify-end h-5 sm:h-6">
        <div className="relative w-full h-full flex justify-end items-center">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pctA}%` }}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full rounded-l-md relative overflow-hidden"
            style={{
              background: `linear-gradient(to left, ${colorA}, ${colorA}cc)`,
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '-100%' }}
              transition={{ delay: delay + 0.7, duration: 0.6 }}
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              }}
            />
          </motion.div>
          {/* Winner indicator */}
          {aWins && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.8, type: 'spring', stiffness: 300 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-0.5"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={colorA}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sm:w-3.5 sm:h-3.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
          )}
        </div>
      </div>

      {/* Center label */}
      <div className="text-center px-0.5">
        <span className="text-[10px] sm:text-xs font-semibold text-gray-600 leading-tight block whitespace-nowrap">
          {label}
        </span>
      </div>

      {/* Bar B - extends from left to right */}
      <div className="flex justify-start h-5 sm:h-6">
        <div className="relative w-full h-full flex justify-start items-center">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pctB}%` }}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full rounded-r-md relative overflow-hidden"
            style={{
              background: `linear-gradient(to right, ${colorB}cc, ${colorB})`,
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ delay: delay + 0.7, duration: 0.6 }}
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              }}
            />
          </motion.div>
          {/* Winner indicator */}
          {bWins && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.8, type: 'spring', stiffness: 300 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-0.5"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={colorB}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sm:w-3.5 sm:h-3.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
          )}
        </div>
      </div>

      {/* Score B */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
        className="text-[10px] sm:text-xs font-bold text-left tabular-nums"
        style={{ color: colorB }}
      >
        {scoreB}
      </motion.span>
    </div>
  );
}

// ==================== Main Component ====================

export default function ComparativeBarChart({
  personA,
  personB,
  colorA = '#6366f1',
  colorB = '#f43f5e',
}: ComparativeBarChartProps) {
  // Merge all dimension keys from both persons, preserving order
  const allKeys = Array.from(
    new Set([...Object.keys(personA.scores), ...Object.keys(personB.scores)]),
  );

  const avgA = computeTotalScore(personA.scores);
  const avgB = computeTotalScore(personB.scores);
  const winner = getWinnerVerdict(avgA, avgB);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="grid items-center py-3 px-1.5 sm:px-3 border-b border-gray-100"
          style={{
            gridTemplateColumns: 'minmax(24px, 32px) 1fr minmax(56px, 80px) 1fr minmax(24px, 32px)',
          }}
        >
          {/* PersonA name area spanning score + bar columns */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="col-span-2 flex items-center justify-end gap-1.5 pr-2"
          >
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorA }}
            />
            <span className="text-xs sm:text-sm font-bold truncate" style={{ color: colorA }}>
              {personA.name}
            </span>
          </motion.div>

          {/* Center divider label */}
          <div className="text-center">
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium">비교</span>
          </div>

          {/* PersonB name area spanning bar + score columns */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="col-span-2 flex items-center justify-start gap-1.5 pl-2"
          >
            <span className="text-xs sm:text-sm font-bold truncate" style={{ color: colorB }}>
              {personB.name}
            </span>
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorB }}
            />
          </motion.div>
        </div>

        {/* Dimension rows */}
        <div className="divide-y divide-gray-100/50">
          {allKeys.map((key, idx) => (
            <DimensionRow
              key={key}
              dimensionKey={key}
              scoreA={personA.scores[key] ?? 0}
              scoreB={personB.scores[key] ?? 0}
              colorA={colorA}
              colorB={colorB}
              index={idx}
              isEven={idx % 2 === 0}
            />
          ))}
        </div>

        {/* Overall winner */}
        <div className="px-3 sm:px-4 pb-4">
          <WinnerBadge
            winner={winner}
            nameA={personA.name}
            nameB={personB.name}
            avgA={avgA}
            avgB={avgB}
            colorA={colorA}
            colorB={colorB}
          />
        </div>
      </div>
    </div>
  );
}
