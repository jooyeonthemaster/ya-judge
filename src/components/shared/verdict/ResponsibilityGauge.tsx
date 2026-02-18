'use client';

import { motion } from 'framer-motion';

interface ResponsibilityGaugeProps {
  percentage: number;
  userName: string;
  size?: 'sm' | 'md' | 'lg';
}

function getGaugeColor(pct: number): string {
  if (pct >= 70) return '#ef4444'; // red-500
  if (pct >= 50) return '#f97316'; // orange-500
  if (pct >= 40) return '#eab308'; // yellow-500
  return '#22c55e'; // green-500
}

function getLabel(pct: number): string {
  if (pct >= 70) return '높은 책임';
  if (pct >= 50) return '중간 이상 책임';
  if (pct >= 40) return '중간 책임';
  return '낮은 책임';
}

function getTextColor(pct: number): string {
  if (pct >= 70) return 'text-red-600';
  if (pct >= 50) return 'text-orange-600';
  if (pct >= 40) return 'text-yellow-600';
  return 'text-green-600';
}

const SIZES = {
  sm: { svgSize: 120, strokeWidth: 10, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { svgSize: 160, strokeWidth: 12, fontSize: 'text-2xl', labelSize: 'text-sm' },
  lg: { svgSize: 200, strokeWidth: 14, fontSize: 'text-3xl', labelSize: 'text-base' },
};

export default function ResponsibilityGauge({ percentage, userName, size = 'md' }: ResponsibilityGaugeProps) {
  const { svgSize, strokeWidth, fontSize, labelSize } = SIZES[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = Math.PI * radius; // semicircle
  const progress = (percentage / 100) * circumference;
  const color = getGaugeColor(percentage);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: svgSize, height: svgSize / 2 + 10 }}>
        <svg
          width={svgSize}
          height={svgSize / 2 + strokeWidth}
          viewBox={`0 0 ${svgSize} ${svgSize / 2 + strokeWidth}`}
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${svgSize / 2} A ${radius} ${radius} 0 0 1 ${svgSize - strokeWidth / 2} ${svgSize / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <motion.path
            d={`M ${strokeWidth / 2} ${svgSize / 2} A ${radius} ${radius} 0 0 1 ${svgSize - strokeWidth / 2} ${svgSize / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-1"
          style={{ height: svgSize / 2 + 10 }}
        >
          <motion.span
            className={`${fontSize} font-bold ${getTextColor(percentage)}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>
      <div className="text-center mt-1">
        <div className="font-bold text-gray-900 text-sm">{userName}님</div>
        <div className={`${labelSize} font-medium ${getTextColor(percentage)}`}>
          {getLabel(percentage)}
        </div>
      </div>
    </div>
  );
}
