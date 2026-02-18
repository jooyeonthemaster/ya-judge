'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Participant {
  name: string;
  scores: Record<string, number>;
}

interface ScoreMatrixProps {
  participants: Participant[];
  dimensionLabels?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a 0-100 score to a background hex color.
 *  green 80-100 | yellow 60-79 | orange 40-59 | red 0-39 */
function scoreToBg(score: number): string {
  if (score >= 80) return '#16a34a'; // green-600
  if (score >= 60) return '#ca8a04'; // yellow-600
  if (score >= 40) return '#ea580c'; // orange-600
  return '#dc2626';                  // red-600
}

/** White text for dark backgrounds, dark text for lighter ones. */
function scoreToText(score: number): string {
  if (score >= 80) return '#ffffff';
  if (score >= 60) return '#1c1917'; // stone-900
  if (score >= 40) return '#ffffff';
  return '#ffffff';
}

/** Tailwind-friendly ring color class per tier. */
function tierRingClass(score: number): string {
  if (score >= 80) return 'ring-green-300';
  if (score >= 60) return 'ring-yellow-300';
  if (score >= 40) return 'ring-orange-300';
  return 'ring-red-300';
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScoreMatrix({ participants, dimensionLabels }: ScoreMatrixProps) {
  // Derive ordered dimension keys from the first participant.
  const dimensions = useMemo(() => {
    if (participants.length === 0) return [] as string[];
    return Object.keys(participants[0].scores);
  }, [participants]);

  // Compute weighted average per participant (equal weights when none specified).
  const averages = useMemo(() => {
    return participants.map((p) => {
      const vals = dimensions.map((d) => p.scores[d] ?? 0);
      if (vals.length === 0) return 0;
      const sum = vals.reduce((a, b) => a + b, 0);
      return clamp(Math.round(sum / vals.length));
    });
  }, [participants, dimensions]);

  if (participants.length === 0 || dimensions.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        {/* ---- Header row: participant names ---- */}
        <thead>
          <tr>
            {/* Top-left empty cell */}
            <th
              className="sticky left-0 z-10 bg-gray-50 rounded-tl-xl px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200"
              aria-label="Dimension"
            >
              항목
            </th>
            {participants.map((p, ci) => (
              <th
                key={p.name}
                className={`px-4 py-2 text-center text-xs font-bold text-gray-800 border-b border-gray-200 bg-gray-50 ${
                  ci === participants.length - 1 ? 'rounded-tr-xl' : ''
                }`}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* ---- Dimension rows ---- */}
          {dimensions.map((dim, ri) => (
            <tr key={dim}>
              {/* Row header: dimension label */}
              <td className="sticky left-0 z-10 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 border-b border-r border-gray-200 whitespace-nowrap">
                {dimensionLabels?.[dim] ?? dim}
              </td>

              {participants.map((p, ci) => {
                const score = clamp(p.scores[dim] ?? 0);
                const bg = scoreToBg(score);
                const fg = scoreToText(score);
                const staggerDelay = ri * 0.06 + ci * 0.08;

                return (
                  <td
                    key={`${dim}-${p.name}`}
                    className="px-2 py-1.5 border-b border-gray-100 text-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.35,
                        delay: staggerDelay,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`inline-flex items-center justify-center w-11 h-9 sm:w-14 sm:h-10 rounded-lg ring-1 ${tierRingClass(score)} shadow-sm`}
                      style={{ backgroundColor: bg }}
                    >
                      <span
                        className="text-xs sm:text-sm font-bold tabular-nums"
                        style={{ color: fg }}
                      >
                        {score}
                      </span>
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}

          {/* ---- Total weighted average row ---- */}
          <tr>
            <td className="sticky left-0 z-10 bg-gray-50 rounded-bl-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 border-t-2 border-r border-gray-300 whitespace-nowrap">
              종합 평균
            </td>
            {averages.map((avg, ci) => {
              const bg = scoreToBg(avg);
              const fg = scoreToText(avg);
              const staggerDelay = dimensions.length * 0.06 + ci * 0.08;

              return (
                <td
                  key={`avg-${ci}`}
                  className={`px-2 py-2 text-center border-t-2 border-gray-300 bg-gray-50 ${
                    ci === participants.length - 1 ? 'rounded-br-xl' : ''
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: staggerDelay,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`inline-flex items-center justify-center w-14 h-10 sm:w-16 sm:h-11 rounded-xl ring-2 ${tierRingClass(avg)} shadow-md`}
                    style={{ backgroundColor: bg }}
                  >
                    <span
                      className="text-sm sm:text-base font-extrabold tabular-nums"
                      style={{ color: fg }}
                    >
                      {avg}
                    </span>
                  </motion.div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
