'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Zap,
  Users,
  Smartphone,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ChevronRight,
  User,
  Activity,
  Wifi,
  WifiOff,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface Stats {
  summary: { total_leads: number; active_fleet: number; hot_ratio: number };
  scoring: { hot: number; warm: number; cold: number };
  fleet: Array<{ name: string; leads: number }>;
  recent: Array<{ id: number; name: string; score: string; time: string; session: string; message?: string }>;
}

/* ─── Animated Number ───────────────────────────────────── */
function AnimatedNumber({ value }: { value: string | number }) {
  const [display, setDisplay] = useState(0);
  const numVal = parseInt(String(value), 10) || 0;

  useEffect(() => {
    let frame = 0;
    const total = 45;
    const timer = setInterval(() => {
      frame++;
      setDisplay(Math.round((frame / total) * numVal));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [numVal]);

  return <>{display}</>;
}

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ title, value, label, icon, gradient, glowColor, trend }: any) {
  return (
    <div className="glass-card glass-card-hover card-3d rounded-3xl p-8 relative overflow-hidden group">
      {/* Glow bg */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent)` }} />

      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative"
        style={{ background: gradient, boxShadow: `0 8px 24px ${glowColor}40` }}>
        <div className="absolute inset-0 rounded-2xl opacity-30"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)' }} />
        <span className="text-white relative z-10">{icon}</span>
      </div>

      {/* Value */}
    <div className="mb-2 flex items-end gap-3">
      <h4 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </h4>
    </div>

    <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-secondary)' }}>{label}</p>

      {/* Trend */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest"
        style={{ background: `${glowColor}15`, border: `1px solid ${glowColor}30`, color: glowColor }}>
        <TrendingUp size={10} />
        {trend}
      </div>
    </div>
  );
}

/* ─── Distribution Row ──────────────────────────────────── */
function DistributionRow({ label, count, total, gradient, glowColor }: any) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), 300);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-black text-[var(--text-primary)]">{count}</span>
    </div>
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(124,58,237,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, background: gradient, boxShadow: `0 0 8px ${glowColor}60` }}
      />
    </div>
    <p className="text-[10px] font-bold" style={{ color: 'var(--text-ghost)' }}>
        {percent.toFixed(1)}% of total
      </p>
    </div>
  );
}

/* ─── Bar Chart ─────────────────────────────────────────── */
function FleetBar({ session, maxLeads, index }: { session: { name: string; leads: number }; maxLeads: number; index: number }) {
  const [height, setHeight] = useState(0);
  const targetHeight = maxLeads > 0 ? (session.leads / maxLeads) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => setHeight(targetHeight), 200 + index * 80);
    return () => clearTimeout(timer);
  }, [targetHeight, index]);

  return (
    <div className="flex-1 flex flex-col items-center gap-3 group/bar">
      <div className="w-full relative flex items-end justify-center" style={{ minHeight: '180px' }}>
        <div className="relative w-full max-w-[48px]">
          {/* Tooltip */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black text-white opacity-0 group-hover/bar:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-10"
            style={{ background: 'rgba(124,58,237,0.9)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            {session.leads} leads
          </div>
          {/* Bar */}
          <div
            className="w-full rounded-t-xl transition-all duration-700 ease-out relative overflow-hidden"
            style={{
              height: `${height}%`,
              minHeight: session.leads > 0 ? '8px' : '0',
              maxHeight: '180px',
              background: 'linear-gradient(180deg, rgba(139,92,246,0.9) 0%, rgba(109,40,217,0.6) 100%)',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 0 20px rgba(139,92,246,0.3)',
            }}>
            <div className="absolute inset-x-0 top-0 h-8 opacity-30"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)' }} />
          </div>
        </div>
      </div>
    <p className="text-[9px] font-black uppercase tracking-widest text-center truncate w-full"
      style={{ color: 'var(--text-muted)' }}>
      {session.name}
    </p>
    </div>
  );
}

/* ─── Activity Feed Item ────────────────────────────────── */
function FeedItem({ item, index }: { item: any; index: number }) {
  const isHot = item.score === 'Hot';
  const isWarm = item.score === 'Warm';

  return (
    <div
      className="flex items-center gap-5 p-5 rounded-2xl transition-all duration-500 group cursor-pointer animate-fade-in"
      style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border-subtle)',
        animationDelay: `${index * 0.08}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.borderColor = 'var(--border-glow)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--bg-deep)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}>

      {/* Avatar */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative ${
        isHot ? '' : ''
      }`} style={{
        background: isHot
          ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))'
          : isWarm
          ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.08))'
          : 'var(--bg-hover)',
        border: isHot ? '1px solid rgba(245,158,11,0.3)' : isWarm ? '1px solid var(--border-bright)' : '1px solid var(--border-glow)',
      }}>
        <User size={20} className={isHot ? 'text-yellow-500' : isWarm ? 'text-[var(--purple-mid)]' : 'text-[var(--text-ghost)]'} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-black text-[var(--text-primary)] text-sm truncate group-hover:text-[var(--purple-mid)] transition-colors">
          {item.name}
        </h4>
        <p className="text-[10px] font-bold flex items-center gap-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          <Clock size={10} />
          {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--text-ghost)' }} />
          <span className="text-[var(--purple-mid)] uppercase tracking-widest">via {item.session.replace('_', ' ')}</span>
        </p>
        {item.message && (
          <p className="text-[11px] italic mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
            "{item.message}"
          </p>
        )}
      </div>

      {/* Score */}
      <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 ${
        isHot ? 'badge-hot' : isWarm ? 'badge-warm' : 'badge-cold'
      }`}>
        {item.score}
      </div>

      {/* Arrow */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0"
        style={{ background: 'var(--bg-hover)', color: 'var(--purple-mid)' }}>
        <ArrowUpRight size={16} />
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiUrl = rawApiUrl.replace(/\/$/, '');
  const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const wsUrl = rawWsUrl.endsWith('/ws') ? rawWsUrl : `${rawWsUrl.replace(/\/$/, '')}/ws`;
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  const fetchStats = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${apiUrl}/stats/overview`, { headers });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        // Non-auth error: leave loading=false, stats=null → spinner stays
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (lastMessage && (lastMessage.event === 'lead_updated' || lastMessage.event === 'session_updated')) {
      fetchStats();
    }
  }, [lastMessage]);

  if (loading || !stats) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-8">
        {/* Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-spin"
            style={{ border: '3px solid rgba(139,92,246,0.1)', borderTopColor: '#8b5cf6' }} />
          <div className="absolute inset-3 rounded-full animate-spin"
            style={{ border: '2px solid rgba(139,92,246,0.05)', borderBottomColor: '#a78bfa', animationDirection: 'reverse', animationDuration: '0.7s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={18} className="text-purple-500" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-[var(--text-primary)] font-black text-lg">Initializing War Room</p>
          <p className="text-xs font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Syncing intelligence pipeline...
          </p>
        </div>
      </div>
    );
  }

  const maxLeads = Math.max(...(stats.fleet ?? []).map(f => f.leads), 1);

  return (
    <div className="space-y-8 pb-20 animate-fade-in">

      {/* ── Header ── */}
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
            <Sparkles size={16} className="text-[var(--purple-mid)]" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">System Command</p>
        </div>
        <h2 className="text-5xl font-black tracking-tight text-[var(--text-primary)] mb-2">
          Intelligence <span className="gradient-text">War Room</span>
        </h2>
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            Real-time oversight of your automated lead generation fleet.
          </p>
        </div>

        {/* Connection status */}
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all`}
          style={isConnected ? {
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#34d399',
          } : {
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}>
          {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          Fleet: {isConnected ? 'Operational' : 'Offline'}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Intelligence"
          value={stats.summary.total_leads}
          label="Leads Captured"
          icon={<Users size={24} />}
          gradient="linear-gradient(135deg, #7c3aed, #5b21b6)"
          glowColor="#8b5cf6"
          trend="+12% today"
        />
        <StatCard
          title="Active Fleet"
          value={stats.summary.active_fleet}
          label="Connected Devices"
          icon={<Smartphone size={24} />}
          gradient="linear-gradient(135deg, #059669, #047857)"
          glowColor="#10b981"
          trend="Live Sync"
        />
        <StatCard
          title="Conversion Heat"
          value={`${stats.summary.hot_ratio}%`}
          label="Hot Lead Ratio"
          icon={<Zap size={24} />}
          gradient="linear-gradient(135deg, #d97706, #92400e)"
          glowColor="#f59e0b"
          trend="Action Required"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Fleet Performance Chart */}
        <div className="xl:col-span-2 glass-card rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-1">Fleet Performance</h3>
              <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                Leads generated per WhatsApp session
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'var(--bg-hover)', color: 'var(--purple-mid)' }}>
              <BarChart2 size={20} />
            </div>
          </div>

          <div className="flex-1 flex items-end gap-4 px-2" style={{ minHeight: '220px' }}>
            {stats.fleet.length > 0 ? (
              stats.fleet.map((session, i) => (
                <FleetBar key={i} session={session} maxLeads={maxLeads} index={i} />
              ))
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                   style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <Smartphone size={28} style={{ color: 'var(--text-ghost)' }} />
                </div>
                <p className="text-sm font-bold italic" style={{ color: 'var(--text-ghost)' }}>
                  No sessions connected yet...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quality Mix */}
        <div className="glass-card rounded-3xl p-8 flex flex-col">
          <h3 className="text-xl font-black text-[var(--text-primary)] mb-1">Quality Mix</h3>
          <p className="text-xs font-bold mb-8" style={{ color: 'var(--text-secondary)' }}>Lead scoring distribution</p>

          <div className="flex-1 flex flex-col justify-center space-y-7">
            <DistributionRow
              label="🔥 Hot Leads"
              count={stats.scoring.hot}
              total={stats.summary.total_leads}
              gradient="linear-gradient(90deg, #f59e0b, #ef4444)"
              glowColor="#f59e0b"
            />
            <DistributionRow
              label="⚡ Warm Leads"
              count={stats.scoring.warm}
              total={stats.summary.total_leads}
              gradient="linear-gradient(90deg, #8b5cf6, #6d28d9)"
              glowColor="#8b5cf6"
            />
            <DistributionRow
              label="❄️ Cold Leads"
              count={stats.scoring.cold}
              total={stats.summary.total_leads}
              gradient="linear-gradient(90deg, #b3acd8, #5c538a)"
              glowColor="#7c3aed"
            />
          </div>

          {/* Insight */}
          <div className="mt-8 p-5 rounded-2xl"
             style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(124,58,237,0.1)' }}>
                <TrendingUp size={18} className="text-[var(--purple-mid)]" />
              </div>
              <div>
                <p className="text-xs font-black text-[var(--purple-mid)]">Growth Detected</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  High performance signals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Activity Feed ── */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-1">Live Activity Feed</h3>
            <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              Real-time extractions across your fleet
            </p>
          </div>
          <a href="/dashboard/leads"
             className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
             style={{ background: 'var(--bg-hover)', color: 'var(--purple-mid)', border: '1px solid var(--border-glow)' }}
             onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-subtle)'; }}
             onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}>
            View All <ChevronRight size={12} />
          </a>
        </div>

        <div className="space-y-3">
          {stats.recent.length > 0 ? (
            stats.recent.map((item, i) => (
              <FeedItem key={i} item={item} index={i} />
            ))
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                 style={{ background: 'var(--bg-hover)', border: '1px dashed var(--border-glow)' }}>
                <Activity size={28} style={{ color: 'var(--text-ghost)' }} />
              </div>
              <p className="font-black text-[var(--text-primary)] mb-2">No Recent Activity</p>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                Awaiting first lead extraction...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
