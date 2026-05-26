'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLOR_MAP: Record<string, { icon: string; glow: string }> = {
  blue:   { icon: '#60a5fa', glow: 'rgba(96,165,250,.15)'  },
  green:  { icon: '#34d399', glow: 'rgba(52,211,153,.15)'  },
  amber:  { icon: '#fbbf24', glow: 'rgba(251,191,36,.15)'  },
  purple: { icon: '#a78bfa', glow: 'rgba(167,139,250,.15)' },
  pink:   { icon: '#f472b6', glow: 'rgba(244,114,182,.15)' },
  red:    { icon: '#f87171', glow: 'rgba(248,113,113,.15)' },
};

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  trend?: 'up' | 'down';
  delta?: string;
}

export function StatsCard({ title, value, icon: Icon, color = 'purple', trend, delta }: StatsCardProps) {
  const { icon: iconColor, glow } = COLOR_MAP[color] ?? COLOR_MAP.purple;

  return (
    <div
      className="wm-stat"
      style={{ transition: 'all .25s' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: glow,
          border: `0.5px solid ${iconColor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor,
        }}>
          <Icon size={18} aria-hidden />
        </div>

        {(trend || delta) && (
          <span style={{
            fontSize: '.72rem',
            color: trend === 'down' ? '#f87171' : '#34d399',
            display: 'flex', alignItems: 'center', gap: 3,
            background: trend === 'down' ? 'rgba(248,113,113,.1)' : 'rgba(52,211,153,.1)',
            padding: '3px 8px', borderRadius: 99,
          }}>
            {trend === 'down' ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
            {delta ?? (trend === 'up' ? 'Up' : 'Down')}
          </span>
        )}
      </div>

      {/* Value */}
      <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4, lineHeight: 1 }}>
        {value}
      </div>

      {/* Label */}
      <div style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.5)', letterSpacing: '.01em' }}>
        {title}
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${iconColor}55, transparent)`,
        borderRadius: '0 0 14px 14px',
      }} />
    </div>
  );
}