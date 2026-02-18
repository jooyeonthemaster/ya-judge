'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, UserCheck, Eye, UserMinus, Zap, Handshake, User, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import type { StakeholderMap, Stakeholder, StakeholderRelationship } from '@/types/verdict';

interface RelationshipMapProps {
  stakeholderMap: StakeholderMap;
  highlightPerson?: string;
}

// ── Constants ───────────────────────────────────────────────────────

const PADDING = 80; // 노드가 잘리지 않도록 충분한 패딩

const ROLE_RADIUS: Record<Stakeholder['role'], number> =
  { primary: 38, secondary: 28, witness: 22, mentioned: 22 };

const ROLE_FILL: Record<Stakeholder['role'], string> =
  { primary: '#1e293b', secondary: '#475569', witness: '#94a3b8', mentioned: '#cbd5e1' };

const ROLE_TEXT: Record<Stakeholder['role'], string> =
  { primary: '#fff', secondary: '#fff', witness: '#fff', mentioned: '#334155' };

const ROLE_LABEL: Record<Stakeholder['role'], string> =
  { primary: '당사자', secondary: '관계자', witness: '목격자', mentioned: '언급됨' };

const QUALITY_COLOR: Record<StakeholderRelationship['quality'], string> =
  { positive: '#22c55e', neutral: '#9ca3af', negative: '#ef4444', complicated: '#eab308' };

const TYPE_ICON_LABEL: Record<StakeholderRelationship['type'], string> =
  { romantic: '연인', family: '가족', friend: '친구', colleague: '동료', acquaintance: '지인', conflict: '갈등' };

const FONT: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', pointerEvents: 'none' };

// ── Safe layout: 모든 노드를 viewBox 안에 배치 ──────────────────────

interface NodePos { x: number; y: number }

function computeLayout(stakeholders: Stakeholder[], w: number, h: number): Map<string, NodePos> {
  const pos = new Map<string, NodePos>();
  const cx = w / 2;
  const cy = h / 2;
  const pri = stakeholders.filter(s => s.role === 'primary');
  const sec = stakeholders.filter(s => s.role === 'secondary');
  const rest = stakeholders.filter(s => s.role === 'witness' || s.role === 'mentioned');

  // primary: 중앙에 가로 배치
  if (pri.length === 1) {
    pos.set(pri[0].id, { x: cx, y: cy });
  } else if (pri.length === 2) {
    const gap = Math.min(140, (w - PADDING * 2) * 0.35);
    pos.set(pri[0].id, { x: cx - gap, y: cy });
    pos.set(pri[1].id, { x: cx + gap, y: cy });
  } else if (pri.length > 0) {
    const r = Math.min(80, (Math.min(w, h) - PADDING * 2) * 0.2);
    placeCircular(pri, cx, cy, r, pos);
  }

  // secondary: 좀 더 바깥 원
  if (sec.length > 0) {
    const r = Math.min(130, (Math.min(w, h) - PADDING * 2) * 0.35);
    const offset = pri.length === 2 ? -Math.PI / 2 : 0;
    placeCircular(sec, cx, cy, r, pos, offset);
  }

  // rest: 가장 바깥 원
  if (rest.length > 0) {
    const r = Math.min(170, (Math.min(w, h) - PADDING * 2) * 0.45);
    const offset = (pri.length + sec.length) * 0.4;
    placeCircular(rest, cx, cy, r, pos, -Math.PI / 2 + offset);
  }

  // 안전: 모든 노드가 viewBox 내에 있도록 보정
  clampPositions(pos, stakeholders, w, h);

  return pos;
}

function placeCircular(items: Stakeholder[], cx: number, cy: number, r: number, pos: Map<string, NodePos>, off = -Math.PI / 2) {
  items.forEach((s, i) => {
    const a = off + (2 * Math.PI * i) / items.length;
    pos.set(s.id, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  });
}

function clampPositions(pos: Map<string, NodePos>, stakeholders: Stakeholder[], w: number, h: number) {
  stakeholders.forEach(s => {
    const p = pos.get(s.id);
    if (!p) return;
    const r = ROLE_RADIUS[s.role];
    const margin = r + 36; // 노드 반지름 + 이름 라벨 공간
    p.x = Math.max(margin, Math.min(w - margin, p.x));
    p.y = Math.max(margin, Math.min(h - margin - 10, p.y));
  });
}

// ── Line style helpers ──────────────────────────────────────────────

function getStrokeDash(type: StakeholderRelationship['type'], q: StakeholderRelationship['quality']): string {
  if (q === 'complicated') return '8 4';
  if (type === 'romantic') return '6 4';
  if (type === 'friend') return '3 3';
  return 'none';
}

function getStrokeWidth(type: StakeholderRelationship['type']): number {
  return { conflict: 3, romantic: 2.5, family: 2.5, friend: 2, colleague: 1.5, acquaintance: 1 }[type] ?? 1.5;
}

// ── Sub-components ──────────────────────────────────────────────────

function ConnectionIcon({ type, x, y }: { type: StakeholderRelationship['type']; x: number; y: number }) {
  const s = 14;
  const t = `translate(${x - s / 2}, ${y - s / 2})`;
  if (type === 'romantic')
    return <g transform={t} style={{ color: '#ef4444' }}><Heart width={s} height={s} fill="#ef4444" strokeWidth={0} /></g>;
  if (type === 'conflict')
    return <g transform={t} style={{ color: '#ef4444' }}><Zap width={s} height={s} fill="#fbbf24" strokeWidth={1.5} /></g>;
  if (type === 'family')
    return <g transform={t} style={{ color: '#22c55e' }}><Handshake width={s} height={s} strokeWidth={1.5} /></g>;
  return null;
}

// ── Detail Panel (replaces SVG tooltip) ─────────────────────────────

function DetailPanel({ person, onClose }: { person: Stakeholder; onClose: () => void }) {
  const involvement = person.involvementLevel;
  const barColor = involvement >= 70 ? 'bg-red-500' : involvement >= 40 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-700"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="font-bold text-sm leading-tight">{person.name}</div>
          <div className="text-slate-400 text-xs mt-0.5">{person.relationship} ({ROLE_LABEL[person.role]})</div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white p-0.5 -mr-1 -mt-1 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-slate-300 text-xs leading-relaxed mb-3 break-keep">
        {person.description}
      </p>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">관여도</span>
          <span className="text-xs font-bold text-blue-400">{involvement}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${involvement}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Zoom/Pan Controls ───────────────────────────────────────────────

function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: {
  zoom: number; onZoomIn: () => void; onZoomOut: () => void; onReset: () => void;
}) {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
      <button onClick={onZoomIn} disabled={zoom >= 2.5}
        className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm disabled:opacity-30 transition-colors"
        aria-label="확대">
        <ZoomIn className="w-4 h-4 text-gray-700" />
      </button>
      <button onClick={onZoomOut} disabled={zoom <= 0.8}
        className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm disabled:opacity-30 transition-colors"
        aria-label="축소">
        <ZoomOut className="w-4 h-4 text-gray-700" />
      </button>
      <button onClick={onReset}
        className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm transition-colors"
        aria-label="초기화">
        <Maximize2 className="w-3.5 h-3.5 text-gray-700" />
      </button>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export default function RelationshipMap({ stakeholderMap, highlightPerson }: RelationshipMapProps) {
  const { stakeholders, relationships } = stakeholderMap;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPerson = stakeholders.find(s => s.id === selectedId);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const svgW = 500;
  const svgH = 380;

  const positions = useMemo(() => computeLayout(stakeholders, svgW, svgH), [stakeholders, svgW, svgH]);

  const handleClick = useCallback((id: string) => {
    setSelectedId(p => (p === id ? null : id));
  }, []);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(2.5, z + 0.3)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.8, z - 0.3)), []);
  const handleReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // Mouse drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('g[role="button"]')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pan]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch pinch-to-zoom
  const lastTouchDist = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastTouchDist.current;
      setZoom(z => Math.max(0.8, Math.min(2.5, z * scale)));
      lastTouchDist.current = dist;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
  }, []);

  // Mouse wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.8, Math.min(2.5, z + delta)));
  }, []);

  if (stakeholders.length === 0) {
    return <div className="flex items-center justify-center py-12 text-gray-400 text-sm">이해관계자 정보가 없습니다.</div>;
  }

  return (
    <div className="w-full space-y-3">
      {/* Map Container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl select-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #f8fafc 0%, #e2e8f0 100%)',
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          minHeight: 280,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} />

        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto"
          style={{
            minHeight: 260,
            maxHeight: 420,
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          role="img"
          aria-label="이해관계자 관계도"
        >
          <defs>
            <filter id="rm-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
            </filter>
            <filter id="rm-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Connection lines */}
          <g>
            {relationships.map((rel, idx) => {
              const from = positions.get(rel.from);
              const to = positions.get(rel.to);
              if (!from || !to) return null;
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const color = QUALITY_COLOR[rel.quality];
              const dash = getStrokeDash(rel.type, rel.quality);
              const w = getStrokeWidth(rel.type);
              const dim = selectedId && rel.from !== selectedId && rel.to !== selectedId;

              return (
                <g key={`rel-${idx}`}>
                  <motion.line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={color} strokeWidth={w}
                    strokeDasharray={dash === 'none' ? undefined : dash}
                    strokeLinecap="round"
                    opacity={dim ? 0.15 : 0.8}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 + idx * 0.06, ease: 'easeOut' }}
                  />
                  {/* Relation type label on line */}
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: dim ? 0.15 : 1 }}
                    transition={{ delay: 0.6 + idx * 0.06 }}
                  >
                    <ConnectionIcon type={rel.type} x={mx} y={my} />
                    <rect x={mx - 14} y={my + 8} width={28} height={14} rx={4}
                      fill="white" fillOpacity={0.85} stroke={color} strokeWidth={0.5} />
                    <text x={mx} y={my + 16} textAnchor="middle" dominantBaseline="central"
                      fill={color} fontSize={8} fontWeight={600} style={FONT}>
                      {TYPE_ICON_LABEL[rel.type]}
                    </text>
                  </motion.g>
                </g>
              );
            })}
          </g>

          {/* Stakeholder nodes */}
          <g>
            {stakeholders.map((s, idx) => {
              const p = positions.get(s.id);
              if (!p) return null;
              const r = ROLE_RADIUS[s.role];
              const hl = highlightPerson === s.id;
              const active = selectedId === s.id;
              const dim = selectedId !== null && !active;
              const circ = 2 * Math.PI * (r + 3);
              const isPrimary = s.role === 'primary';

              return (
                <motion.g
                  key={s.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: dim ? 0.35 : 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.08, type: 'spring', stiffness: 200, damping: 18 }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(s.id)}
                  role="button" tabIndex={0}
                  aria-label={`${s.name} - ${s.relationship} (${ROLE_LABEL[s.role]})`}
                >
                  {/* Highlight ring */}
                  {(hl || active) && (
                    <motion.circle cx={p.x} cy={p.y} r={r + 7} fill="none"
                      stroke="#3b82f6" strokeWidth={2.5}
                      filter={hl ? 'url(#rm-glow)' : undefined}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={hl ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                      transition={hl ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }} />
                  )}

                  {/* Involvement ring (background) */}
                  <circle cx={p.x} cy={p.y} r={r + 3} fill="none" stroke="#e2e8f0" strokeWidth={2.5} />
                  {/* Involvement ring (progress) */}
                  <circle cx={p.x} cy={p.y} r={r + 3} fill="none"
                    stroke={s.involvementLevel >= 70 ? '#ef4444' : s.involvementLevel >= 40 ? '#f59e0b' : '#22c55e'}
                    strokeWidth={2.5}
                    strokeDasharray={`${(s.involvementLevel / 100) * circ} ${circ}`}
                    strokeLinecap="round" transform={`rotate(-90, ${p.x}, ${p.y})`} />

                  {/* Main circle */}
                  <circle cx={p.x} cy={p.y} r={r} fill={ROLE_FILL[s.role]} filter="url(#rm-shadow)"
                    stroke={isPrimary ? '#0f172a' : '#94a3b8'} strokeWidth={isPrimary ? 2.5 : 1} />

                  {/* Name initial */}
                  <text x={p.x} y={p.y + 1}
                    textAnchor="middle" dominantBaseline="central" fill={ROLE_TEXT[s.role]}
                    fontSize={isPrimary ? 20 : s.role === 'secondary' ? 14 : 11}
                    fontWeight={700} style={FONT}>
                    {s.name.length <= 2 ? s.name : s.name.charAt(0)}
                  </text>

                  {/* Name label below */}
                  <text x={p.x} y={p.y + r + 16}
                    textAnchor="middle" dominantBaseline="central" fill="#334155"
                    fontSize={isPrimary ? 12 : 10} fontWeight={600} style={FONT}>
                    {s.name}
                  </text>

                  {/* Role badge */}
                  <rect x={p.x - 14} y={p.y + r + 22} width={28} height={12} rx={4}
                    fill={ROLE_FILL[s.role]} fillOpacity={0.15} />
                  <text x={p.x} y={p.y + r + 29}
                    textAnchor="middle" dominantBaseline="central" fill="#64748b"
                    fontSize={7} fontWeight={500} style={FONT}>
                    {ROLE_LABEL[s.role]}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </svg>

        {/* Zoom indicator */}
        {zoom !== 1 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-white text-[10px] font-mono">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>

      {/* Detail Panel (HTML, outside SVG - no text clipping) */}
      <AnimatePresence>
        {selectedPerson && (
          <DetailPanel
            key={selectedPerson.id}
            person={selectedPerson}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>

      {/* Compact Legend */}
      <CompactLegend />

      {/* Hint */}
      <p className="text-center text-[10px] text-gray-400 -mt-1">
        노드를 탭하여 상세 정보 확인 | 드래그로 이동 | 핀치/스크롤로 확대
      </p>
    </div>
  );
}

// ── Compact Legend ───────────────────────────────────────────────────

function CompactLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-1">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between py-1.5 px-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className="font-medium">범례</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-400">▾</motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-2 pb-2">
              <div>
                <div className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">관계</div>
                <div className="space-y-1">
                  {[
                    { label: '연인', color: '#ef4444', dash: '4 3', icon: <Heart className="w-3 h-3 text-red-500 fill-red-500" /> },
                    { label: '가족', color: '#22c55e', dash: '', icon: <Handshake className="w-3 h-3 text-green-500" /> },
                    { label: '친구', color: '#3b82f6', dash: '3 3', icon: <User className="w-3 h-3 text-blue-500" /> },
                    { label: '갈등', color: '#ef4444', dash: '', icon: <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> },
                  ].map(it => (
                    <div key={it.label} className="flex items-center gap-1.5">
                      <svg width={20} height={10}><line x1={0} y1={5} x2={20} y2={5} stroke={it.color} strokeWidth={2}
                        strokeDasharray={it.dash || undefined} strokeLinecap="round" /></svg>
                      {it.icon}
                      <span className="text-[11px] text-gray-600">{it.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">상태</div>
                <div className="space-y-1">
                  {[
                    { l: '긍정적', c: '#22c55e' }, { l: '중립', c: '#9ca3af' },
                    { l: '부정적', c: '#ef4444' }, { l: '복잡', c: '#eab308' },
                  ].map(it => (
                    <div key={it.l} className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: it.c }} />
                      <span className="text-[11px] text-gray-600">{it.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
