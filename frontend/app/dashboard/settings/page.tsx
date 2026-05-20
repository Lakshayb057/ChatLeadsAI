'use client';

import React, { useState } from 'react';
import {
  Cpu, Database, User, Bell, Globe, Save,
  CheckCircle2, Zap, Shield, Activity, X
} from 'lucide-react';

function SettingsTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm w-full text-left transition-all duration-300 relative overflow-hidden ${
        active ? 'bg-[var(--bg-hover)] text-[var(--purple-mid)] border-l-[3px] border-[var(--purple-mid)]' : 'text-[var(--text-secondary)]'
      }`}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--purple-mid)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
      <span className={active ? 'text-[var(--purple-mid)]' : ''}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ProviderCard({ name, selected, desc, onClick }: { name: string; selected: boolean; desc: string; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="p-5 rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        background: selected ? 'rgba(124,58,237,0.06)' : 'var(--bg-deep)',
        border: `2px solid ${selected ? 'var(--border-bright)' : 'var(--border-subtle)'}`,
        boxShadow: selected ? 'var(--glow-purple)' : 'none',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-black text-[var(--text-primary)]">{name}</p>
        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: selected ? 'var(--purple-mid)' : 'var(--border-glow)', backgroundColor: selected ? 'var(--purple-mid)' : 'transparent' }}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  );
}

function InputField({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input type={type} defaultValue={defaultValue}
        className="input-dark w-full px-5 py-4 rounded-xl font-bold text-sm" />
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)', color: 'var(--purple-mid)' }}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black text-[var(--text-primary)]">{title}</h3>
          <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const TABS = [
  { id: 'ai', label: 'AI Engine', icon: <Cpu size={18} /> },
  { id: 'database', label: 'Database', icon: <Database size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'api', label: 'API & Webhooks', icon: <Globe size={18} /> },
  { id: 'account', label: 'Account', icon: <User size={18} /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('ai');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }, 1800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
            <Zap size={18} className="text-[var(--purple-mid)]" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">Platform Controls</p>
        </div>
        <h2 className="text-5xl font-black tracking-tight text-[var(--text-primary)]">
          System <span className="gradient-text">Settings</span>
        </h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar Tabs */}
        <div className="glass-card rounded-3xl p-4 h-fit space-y-1">
          {TABS.map(tab => (
            <SettingsTab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">

          {activeTab === 'ai' && (
            <>
              <SectionCard icon={<Cpu size={22} />} title="AI Intelligence Engine" subtitle="Configure local or cloud processing">
                <div className="space-y-3">
                  <ProviderCard
                    name="Groq LPU (Cloud)" selected={selectedProvider === 'groq'}
                    desc="Llama 4 Scout • High-speed Extraction"
                    onClick={() => setSelectedProvider('groq')}
                  />
                  <ProviderCard
                    name="Gemini Vision (Cloud)" selected={selectedProvider === 'gemini'}
                    desc="Gemini 2.5 Flash • Multi-modal Vision"
                    onClick={() => setSelectedProvider('gemini')}
                  />
                </div>
                <div className="p-5 rounded-2xl flex items-center gap-4"
                  style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Engine Status: Optimal</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-secondary)' }}>AI responding in 420ms avg.</p>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === 'database' && (
            <SectionCard icon={<Database size={22} />} title="Database & Persistence" subtitle="PostgreSQL connection health">
              <div className="p-5 rounded-2xl flex items-center justify-between"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Active Database</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">ChatLeadsAI @ localhost:5432</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                  style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', color: '#059669' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[['Tables', '8'], ['Records', '2,847'], ['Size', '12 MB']].map(([k, v]) => (
                  <div key={k} className="p-4 rounded-2xl text-center"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                    <p className="text-xl font-black text-[var(--text-primary)]">{v}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-secondary)' }}>{k}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === 'notifications' && (
            <SectionCard icon={<Bell size={22} />} title="Notification Preferences" subtitle="Configure alerts and webhooks">
              {[
                ['New Lead Captured', 'Notify when a new contact is extracted', true],
                ['Hot Lead Alert', 'Priority alert for high-intent leads', true],
                ['Session Disconnected', 'Alert when a WhatsApp session drops', false],
                ['Daily Summary', 'Receive daily performance digest', false],
              ].map(([title, desc, enabled]) => (
                <div key={String(title)} className="flex items-center justify-between p-5 rounded-2xl"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <p className="text-sm font-black text-[var(--text-primary)]">{String(title)}</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{String(desc)}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300`}
                    style={{ background: enabled ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'var(--border-subtle)', border: `1px solid ${enabled ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`, boxShadow: enabled ? 'var(--glow-purple)' : 'none' }}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300`}
                      style={{ left: enabled ? '24px' : '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
              ))}
            </SectionCard>
          )}

          {activeTab === 'api' && (
            <SectionCard icon={<Globe size={22} />} title="API & Webhooks" subtitle="Configure external integrations">
              <InputField label="Webhook URL" defaultValue="https://your-endpoint.com/webhook" />
              <InputField label="API Key" defaultValue="cl_live_••••••••••••••••" type="password" />
              <div className="p-5 rounded-2xl space-y-3"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Webhook Events</p>
                {['lead.created', 'lead.scored', 'session.connected', 'session.disconnected'].map(e => (
                  <div key={e} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--purple-mid)]" />
                    <code className="text-xs font-bold text-[var(--purple-mid)]">{e}</code>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === 'account' && (
            <SectionCard icon={<User size={22} />} title="Account Settings" subtitle="Manage your profile and credentials">
              <div className="flex items-center gap-5 p-5 rounded-2xl"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: 'var(--glow-purple)' }}>
                  L
                </div>
                <div>
                  <p className="text-lg font-black text-[var(--text-primary)]">Lakshay</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>admin@chatleads.ai</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg mt-2 text-[10px] font-black uppercase tracking-widest"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)', color: 'var(--purple-mid)' }}>
                    <Shield size={10} /> System Admin
                  </div>
                </div>
              </div>
              <InputField label="Display Name" defaultValue="Lakshay" />
              <InputField label="Email Address" defaultValue="admin@chatleads.ai" type="email" />
              <InputField label="New Password" defaultValue="" type="password" />
            </SectionCard>
          )}

          {/* Save Bar */}
          <div className="flex justify-end gap-3 pt-2">
            <button className="px-8 py-4 rounded-2xl font-black text-sm transition-all"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-2 disabled:opacity-70">
              {saved ? (
                <><CheckCircle2 size={16} /> Saved!</>
              ) : saving ? (
                <><Activity size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Preferences</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
