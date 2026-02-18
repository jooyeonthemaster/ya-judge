'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { VerdictConfidence } from '@/types/verdict';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConfidenceMeterProps {
  confidence: VerdictConfidence;
  size?: 'sm' | 'md';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a'; // green-600
  if (score >= 60) return '#ca8a04'; // yellow-600
  if (score >= 40) return '#ea580c'; // orange-600
  return '#dc2626';                  // red-600
}

function scoreBgClass(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function scoreTrackClass(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}

function scoreLabelClass(score: number): string {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-yellow-700';
  if (score >= 40) return 'text-orange-700';
  return 'text-red-700';
}

const FACTOR_LABELS: Record<string, string> = {
  evidenceQuality: '증거 품질',
  informationCompleteness: '정보 완성도',
  patternClarity: '패턴 명확성',
  contextUnderstanding: '맥락 이해도',
};

const SIZE_CONFIG = {
  sm: { svg: 128, stroke: 10, textClass: 'text-2xl', labelClass: 'text-[10px]' },
  md: { svg: 172, stroke: 12, textClass: 'text-3xl', labelClass: 'text-xs' },
} as const;

// ---------------------------------------------------------------------------
// Circular Gauge (full circle)
// ---------------------------------------------------------------------------

function CircularGauge({
  value,
  svgSize,
  strokeWidth,
  textClass,
}: {
  value: number;
  svgSize: number;
  strokeWidth: number;
  textClass: string;
}) {
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const color = scoreColor(value);
  const center = svgSize / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>

      {/* Center label */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <span className={`${textClass} font-extrabold tabular-nums`} style={{ color }}>
          {value}
        </span>
        <span className="text-[10px] font-medium text-gray-400 -mt-0.5">/ 100</span>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Factor Mini-Bar
// ---------------------------------------------------------------------------

function FactorBar({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0 w-[72px] text-[11px] sm:text-xs font-medium text-gray-600 text-right leading-tight">
        {label}
      </span>
      <div className={`flex-1 h-2.5 rounded-full ${scoreTrackClass(value)} overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${scoreBgClass(value)}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        />
      </div>
      <span className={`flex-shrink-0 w-7 text-right text-[11px] font-bold tabular-nums ${scoreLabelClass(value)}`}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ConfidenceMeter({ confidence, size = 'sm' }: ConfidenceMeterProps) {
  const cfg = SIZE_CONFIG[size];
  const factorKeys = Object.keys(confidence.factors) as (keyof typeof confidence.factors)[];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Circular gauge */}
      <CircularGauge
        value={confidence.overall}
        svgSize={cfg.svg}
        strokeWidth={cfg.stroke}
        textClass={cfg.textClass}
      />

      {/* Factor bars */}
      <div className="w-full max-w-xs space-y-1.5">
        {factorKeys.map((key, i) => (
          <FactorBar
            key={key}
            label={FACTOR_LABELS[key] ?? key}
            value={confidence.factors[key]}
            delay={0.3 + i * 0.12}
          />
        ))}
      </div>

      {/* Limitations (only in md size) */}
      {size === 'md' && confidence.limitations.length > 0 && (
        <motion.div
          className="w-full max-w-xs mt-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              한계점
            </span>
          </div>
          <ul className="space-y-1">
            {confidence.limitations.map((lim, idx) => (
              <motion.li
                key={idx}
                className="flex items-start gap-1.5 text-[11px] sm:text-xs text-gray-600 leading-relaxed"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + idx * 0.08, duration: 0.3 }}
              >
                <span className="flex-shrink-0 mt-1 w-1 h-1 rounded-full bg-amber-400" />
                {lim}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
