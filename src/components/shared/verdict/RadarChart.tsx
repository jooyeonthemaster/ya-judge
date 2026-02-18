'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  EXPANDED_DIMENSION_LABELS,
  DIMENSION_LABELS,
} from '@/types/verdict';
// Re-export for convenience so consumers can type their score objects.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type { ExpandedDimensionalScores, DimensionalScores } from '@/types/verdict';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Accepts either the base 5-dimension `DimensionalScores`, the expanded
 * 9-dimension `ExpandedDimensionalScores`, or any arbitrary string-keyed
 * numeric record.
 */
export type RadarScores = Record<string, number>;

export interface RadarDataset {
  label: string;
  scores: RadarScores;
  color: string;
}

export interface RadarChartProps {
  /** One or more overlapping datasets to render. */
  datasets: RadarDataset[];
  /** Rendered width & height in px. Defaults to 280. */
  size?: number;
  /** Whether axis labels are visible. Defaults to true. */
  showLabels?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Internal viewBox dimensions for consistent geometry. */
const VB = 340;
const CENTER = VB / 2;
const MAX_RADIUS = 110;
const LABEL_OFFSET = 28;
const GRID_STEPS = [20, 40, 60, 80, 100] as const;

/** Merge both label maps so we can look up any key. */
const ALL_LABELS: Record<string, string> = {
  ...DIMENSION_LABELS,
  ...EXPANDED_DIMENSION_LABELS,
};

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function angleForIndex(i: number, total: number): number {
  // Start from the top (-PI/2) and go clockwise.
  return (2 * Math.PI * i) / total - Math.PI / 2;
}

function pointOnCircle(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function buildPolygonPath(
  points: [number, number][],
): string {
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ') + ' Z';
}

/**
 * Determine `text-anchor` and small x/y nudge based on the vertex angle so
 * that Korean labels never overlap the chart area.
 */
function labelAlignment(angle: number): {
  textAnchor: 'start' | 'middle' | 'end';
  dx: number;
  dy: number;
} {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  let dx = 0;
  let dy = 0;

  // Horizontal alignment
  if (cos > 0.3) textAnchor = 'start';
  else if (cos < -0.3) textAnchor = 'end';

  // Fine-tune nudge
  if (cos > 0.3) dx = 4;
  else if (cos < -0.3) dx = -4;

  if (sin < -0.3) dy = -4;
  else if (sin > 0.3) dy = 10;
  else dy = 3;

  return { textAnchor, dx, dy };
}

/**
 * Convert a hex colour string (#RRGGBB or #RGB) to an `rgba()` value at the
 * given alpha. Falls back to the raw colour on unexpected input.
 */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const [r, g, b] = clean.split('').map((c) => parseInt(c + c, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return hex;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Concentric grid polygons + axis spokes. */
function GridLayer({ axisCount }: { axisCount: number }) {
  const gridPolygons = useMemo(() => {
    return GRID_STEPS.map((pct) => {
      const r = (pct / 100) * MAX_RADIUS;
      const pts: [number, number][] = Array.from({ length: axisCount }, (_, i) =>
        pointOnCircle(CENTER, CENTER, r, angleForIndex(i, axisCount)),
      );
      return { pct, path: buildPolygonPath(pts) };
    });
  }, [axisCount]);

  const spokes = useMemo(() => {
    return Array.from({ length: axisCount }, (_, i) => {
      const angle = angleForIndex(i, axisCount);
      const [x, y] = pointOnCircle(CENTER, CENTER, MAX_RADIUS, angle);
      return { x, y };
    });
  }, [axisCount]);

  return (
    <g>
      {/* Concentric grid polygons */}
      {gridPolygons.map(({ pct, path }) => (
        <path
          key={pct}
          d={path}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={pct === 100 ? 1 : 0.6}
          opacity={pct === 100 ? 0.9 : 0.55}
        />
      ))}
      {/* Axis spokes */}
      {spokes.map(({ x, y }, i) => (
        <line
          key={i}
          x1={CENTER}
          y1={CENTER}
          x2={x}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.6}
        />
      ))}
      {/* Percentage tick labels at 12 o'clock axis */}
      {GRID_STEPS.map((pct) => {
        const r = (pct / 100) * MAX_RADIUS;
        return (
          <text
            key={`tick-${pct}`}
            x={CENTER + 3}
            y={CENTER - r - 2}
            fontSize={7}
            fill="#9ca3af"
            textAnchor="start"
          >
            {pct}
          </text>
        );
      })}
    </g>
  );
}

/** Animated data polygon for a single dataset. */
function DatasetPolygon({
  dataset,
  axisKeys,
  axisCount,
  index,
}: {
  dataset: RadarDataset;
  axisKeys: string[];
  axisCount: number;
  index: number;
}) {
  const { scores, color } = dataset;

  const vertices = useMemo(() => {
    return axisKeys.map((key, i) => {
      const value = Math.max(0, Math.min(100, scores[key] ?? 0));
      const r = (value / 100) * MAX_RADIUS;
      const angle = angleForIndex(i, axisCount);
      const [x, y] = pointOnCircle(CENTER, CENTER, r, angle);
      return { key, value, x, y, angle };
    });
  }, [scores, axisKeys, axisCount]);

  const path = useMemo(
    () => buildPolygonPath(vertices.map(({ x, y }) => [x, y])),
    [vertices],
  );

  const pathLength = useMemo(() => {
    let len = 0;
    for (let i = 0; i < vertices.length; i++) {
      const next = vertices[(i + 1) % vertices.length];
      const dx = next.x - vertices[i].x;
      const dy = next.y - vertices[i].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }, [vertices]);

  const baseDelay = index * 0.35;

  return (
    <g>
      {/* Filled area -- fades in */}
      <motion.path
        d={path}
        fill={hexToRgba(color, 0.15)}
        stroke="none"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.7,
          delay: baseDelay + 0.3,
          ease: 'easeOut',
        }}
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      />

      {/* Outline -- draws itself */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ strokeDashoffset: pathLength, strokeDasharray: pathLength }}
        animate={{ strokeDashoffset: 0 }}
        transition={{
          duration: 1,
          delay: baseDelay,
          ease: 'easeInOut',
        }}
      />

      {/* Vertex dots */}
      {vertices.map(({ key, x, y }, vi) => (
        <motion.circle
          key={key}
          cx={x}
          cy={y}
          r={3.5}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: baseDelay + 0.6 + vi * 0.05,
            ease: 'backOut',
          }}
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
      ))}

      {/* Score value labels at each vertex */}
      {vertices.map(({ key, value, x, y, angle }) => {
        const nudge = 12;
        const nx = x + nudge * Math.cos(angle);
        const ny = y + nudge * Math.sin(angle);
        const { textAnchor } = labelAlignment(angle);

        return (
          <motion.text
            key={`score-${key}`}
            x={nx}
            y={ny}
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize={8}
            fontWeight={700}
            fill={color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: baseDelay + 0.9 }}
          >
            {value}
          </motion.text>
        );
      })}
    </g>
  );
}

/** Axis label text positioned outside the grid. */
function AxisLabels({
  axisKeys,
  axisCount,
}: {
  axisKeys: string[];
  axisCount: number;
}) {
  return (
    <g>
      {axisKeys.map((key, i) => {
        const angle = angleForIndex(i, axisCount);
        const [x, y] = pointOnCircle(
          CENTER,
          CENTER,
          MAX_RADIUS + LABEL_OFFSET,
          angle,
        );
        const { textAnchor, dx, dy } = labelAlignment(angle);
        const label = ALL_LABELS[key] ?? key;

        return (
          <motion.text
            key={key}
            x={x + dx}
            y={y + dy}
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize={9.5}
            fontWeight={500}
            fill="#4b5563"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
          >
            {label}
          </motion.text>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RadarChart({
  datasets,
  size = 280,
  showLabels = true,
}: RadarChartProps) {
  // Derive axis keys from first dataset.
  const axisKeys = useMemo(() => {
    if (!datasets.length) return [];
    return Object.keys(datasets[0].scores);
  }, [datasets]);

  const axisCount = axisKeys.length;

  if (axisCount < 3 || !datasets.length) {
    return null;
  }

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{ maxWidth: size }}
    >
      {/* Chart SVG */}
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        width="100%"
        height="auto"
        className="overflow-visible"
        role="img"
        aria-label="Radar chart comparing dimensional scores"
      >
        <GridLayer axisCount={axisCount} />

        {datasets.map((ds, idx) => (
          <DatasetPolygon
            key={ds.label}
            dataset={ds}
            axisKeys={axisKeys}
            axisCount={axisCount}
            index={idx}
          />
        ))}

        {showLabels && (
          <AxisLabels axisKeys={axisKeys} axisCount={axisCount} />
        )}
      </svg>

      {/* Legend */}
      {datasets.length > 1 && (
        <motion.div
          className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: datasets.length * 0.35 + 0.5 }}
        >
          {datasets.map((ds) => (
            <div key={ds.label} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: ds.color }}
              />
              <span className="text-xs font-medium text-gray-600">
                {ds.label}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
