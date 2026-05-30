'use client';

// ============================================================
// SwingIQ — Shot Dispersion Chart
// Renders a bird's-eye scatter plot of shot lateral vs. carry.
// Uses SVG so it works on all browsers without canvas issues.
// ============================================================

import type { DispersionStats } from '@swingiq/core';
import { cn } from '@/lib/utils';

interface Props {
  stats: DispersionStats;
  height?: number;
  className?: string;
}

const SHOT_COLORS: Record<string, string> = {
  slice: '#ef4444',
  fade: '#f97316',
  straight: '#22c55e',
  draw: '#3b82f6',
  hook: '#8b5cf6',
};

export function DispersionChart({ stats, height = 300, className }: Props) {
  if (!stats.points.length) return null;

  const width = 400;
  const padX = 40;
  const padY = 30;

  // Find axis bounds
  const laterals = stats.points.map((p) => p.lateral_offline);
  const carries = stats.points.map((p) => p.carry_distance);
  const maxLat = Math.max(Math.abs(Math.min(...laterals)), Math.abs(Math.max(...laterals)), 20);
  const carryMin = Math.min(...carries) - 10;
  const carryMax = Math.max(...carries) + 10;

  const toX = (lat: number) => padX + ((lat + maxLat) / (2 * maxLat)) * (width - 2 * padX);
  const toY = (carry: number) => padY + (1 - (carry - carryMin) / (carryMax - carryMin)) * (height - 2 * padY);

  // Target line (x=0) and mean cross
  const midX = toX(0);
  const meanX = toX(stats.mean_lateral);
  const meanY = toY(stats.mean_carry);

  // 2σ ellipse dimensions
  const ellipseRx = Math.max(4, ((stats.ellipse_width_yards / 2) / (2 * maxLat)) * (width - 2 * padX));
  const ellipseRy = Math.max(4, ((stats.ellipse_height_yards / 2) / (carryMax - carryMin)) * (height - 2 * padY));

  const gradeColor = stats.consistency_grade === 'A' ? '#22c55e' : stats.consistency_grade === 'B' ? '#3b82f6' : stats.consistency_grade === 'C' ? '#f97316' : '#ef4444';

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: height }}
        aria-label="Shot dispersion chart"
      >
        {/* Background */}
        <rect x="0" y="0" width={width} height={height} fill="#f9fafb" rx="8" />

        {/* Target line */}
        <line x1={midX} y1={padY} x2={midX} y2={height - padY} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
        <text x={midX + 3} y={padY + 10} fontSize="9" fill="#22c55e" opacity="0.8">Target</text>

        {/* 2σ dispersion ellipse */}
        <ellipse
          cx={meanX}
          cy={meanY}
          rx={ellipseRx}
          ry={ellipseRy}
          fill={`${gradeColor}18`}
          stroke={gradeColor}
          strokeWidth="1.5"
          strokeDasharray="5 3"
        />

        {/* Mean crosshair */}
        <line x1={meanX - 6} y1={meanY} x2={meanX + 6} y2={meanY} stroke={gradeColor} strokeWidth="2" />
        <line x1={meanX} y1={meanY - 6} x2={meanX} y2={meanY + 6} stroke={gradeColor} strokeWidth="2" />

        {/* Shot dots */}
        {stats.points.map((pt, i) => {
          const x = toX(pt.lateral_offline);
          const y = toY(pt.carry_distance);
          const color = SHOT_COLORS[pt.shot_shape ?? ''] ?? '#6b7280';
          return (
            <circle key={i} cx={x} cy={y} r="4" fill={color} opacity="0.75">
              <title>{`Shot ${i + 1}: ${pt.carry_distance.toFixed(0)} yds carry, ${pt.lateral_offline > 0 ? '+' : ''}${pt.lateral_offline.toFixed(0)} yds lateral`}</title>
            </circle>
          );
        })}

        {/* Axis labels */}
        <text x={padX} y={height - 5} fontSize="9" fill="#9ca3af">{`-${maxLat.toFixed(0)} yds`}</text>
        <text x={width - padX - 24} y={height - 5} fontSize="9" fill="#9ca3af">{`+${maxLat.toFixed(0)} yds`}</text>
        <text x={2} y={padY + 4} fontSize="9" fill="#9ca3af">{carryMax.toFixed(0)}</text>
        <text x={2} y={height - padY} fontSize="9" fill="#9ca3af">{carryMin.toFixed(0)}</text>

        {/* Labels */}
        <text x={width / 2} y={height - 2} fontSize="9" fill="#9ca3af" textAnchor="middle">Left ← Lateral → Right</text>
        <text x={8} y={height / 2} fontSize="9" fill="#9ca3af" transform={`rotate(-90, 8, ${height / 2})`} textAnchor="middle">Carry (yds)</text>

        {/* Grade badge */}
        <rect x={width - padX - 28} y={padY} width={28} height={18} rx="4" fill={gradeColor} />
        <text x={width - padX - 14} y={padY + 12} fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
          {stats.consistency_grade}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Slice</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Fade</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Straight</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Draw</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Hook</span>
        <span className="flex items-center gap-1"><span className="inline-block w-6 border-t-2 border-dashed border-green-500" /> Dispersion ellipse (95%)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 border-t-2 border-dashed border-green-400" /> Target line</span>
      </div>
    </div>
  );
}
