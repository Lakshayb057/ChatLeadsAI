'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Check, Trash2, ShieldCheck, Database,
  Copy, Filter, RefreshCw, Layers, Calendar, User,
  Phone, Mail, Key, MessageSquare, AlertCircle, Sparkles, Wifi
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface BulkLead {
  id: number;
  session_id: string;
  wa_jid: string;
  group_jid: string | null;
  extracted_name: string | null;
  mobile: string | null;
  email: string | null;
  arn: string | null;
  confidence: number;
  lead_score: string;
  source_message: string | null;
  status: string; // 'pending' or 'added'
  created_at: string;
  owner_company: string | null;
}

interface SessionInfo {
  session_id: string;
  lead_count: number;
  owner_company: string | null;
  owner_name: string | null;
}

export default function BulkDataPage() {
  const [bulkLeads, setBulkLeads] = useState<BulkLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [statusTab, setStatusTab] = useState<'pending' | 'added'>('pending');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [availableSessions, setAvailableSessions] = useState<SessionInfo[]>([]);
  const [copiedArns, setCopiedArns] = useState<{ [key: string]: boolean }>({});
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const wsUrl = rawWsUrl.endsWith('/ws') ? rawWsUrl : `${rawWsUrl.replace(/\/$/, '')}/ws`;
  const { lastMessage } = useWebSocket(wsUrl);

  const fetchBulkLeads = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      params.append('status', statusTab);
      if (searchTerm) params.append('query', searchTerm);
      if (filterSession) params.append('session_id', filterSession);

      const res = await fetch(`${apiUrl}/contacts/bulk?${params}`, { headers });
      if (!res.ok) throw new Error();
      const data: BulkLead[] = await res.json();
      setBulkLeads(data);
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiUrl}/contacts/sessions`, { headers });
      if (res.ok) setAvailableSessions(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBulkLeads();
  }, [searchTerm, filterSession, statusTab]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (lastMessage?.event === 'bulk_lead_updated' || lastMessage?.event === 'lead_updated') {
      fetchBulkLeads();
    }
  }, [lastMessage]);

  const toggleSelectAll = () => {
    if (selectedIds.length === bulkLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bulkLeads.map((l) => l.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApproveSelected = async () => {
    if (selectedIds.length === 0) return;
    setApproving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiUrl}/contacts/bulk/approve-multiple`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bulk_ids: selectedIds })
      });

      if (!response.ok) throw new Error('Promotion failed');
      
      setSelectedIds([]);
      fetchBulkLeads();
    } catch (err) {
      console.error(err);
      alert('Failed to promote selected leads. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const handleApproveSingle = async (id: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiUrl}/contacts/bulk/${id}/approve`, {
        method: 'POST',
        headers
      });

      if (!response.ok) throw new Error('Promotion failed');
      fetchBulkLeads();
    } catch (err) {
      console.error(err);
      alert('Failed to promote lead. Please try again.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to discard these ${selectedIds.length} bulk leads?`)) return;
    setDeleting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${apiUrl}/contacts/bulk/${id}`, {
            method: 'DELETE',
            headers
          })
        )
      );

      setSelectedIds([]);
      fetchBulkLeads();
    } catch (err) {
      console.error(err);
      alert('Failed to delete some bulk leads. Please refresh and try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingle = async (id: number) => {
    if (!confirm('Are you sure you want to discard this bulk lead?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiUrl}/contacts/bulk/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) throw new Error('Delete failed');
      fetchBulkLeads();
    } catch (err) {
      console.error(err);
      alert('Failed to discard lead.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to discard all bulk leads in this view?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      params.append('status', statusTab);
      if (filterSession) params.append('session_id', filterSession);

      const response = await fetch(`${apiUrl}/contacts/bulk-all/clear?${params}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) throw new Error('Clear failed');
      fetchBulkLeads();
    } catch (err) {
      console.error(err);
      alert('Failed to clear bulk leads.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedArns((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedArns((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const selectStyle = {
    background: 'var(--bg-deep)',
    border: '1px solid var(--border-glow)',
    color: 'var(--text-secondary)',
    borderRadius: '1rem',
    padding: '0.75rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '700',
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
    width: '100%'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-8 pb-20 font-sans"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}
            >
              <Database size={16} className="md:w-5 md:h-5 text-[var(--purple-mid)]" />
            </div>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">
              Excel Vision Parser Staging
            </p>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-1 md:mb-2">
            Bulk <span className="gradient-text">Data Approval</span>
          </h1>
          <p className="text-xs md:text-sm font-bold flex flex-wrap items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <ShieldCheck size={14} className="text-emerald-600" />
            Temporary holding area for multi-lead Excel screenshots. Verify details before adding to Leads.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl w-fit" style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => {
            setStatusTab('pending');
            setSelectedIds([]);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
            statusTab === 'pending'
              ? 'bg-[var(--purple-mid)] text-white shadow-lg'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Pending ({statusTab === 'pending' ? bulkLeads.length : '...'} Active)
        </button>
        <button
          onClick={() => {
            setStatusTab('added');
            setSelectedIds([]);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
            statusTab === 'added'
              ? 'bg-[var(--purple-mid)] text-white shadow-lg'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Already Added
        </button>
      </div>

      {/* Filters & Actions Panel */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        {/* Left Side: Search and Session Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-2xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-ghost)' }} />
            <input
              type="text"
              placeholder="Search by name, phone, email, ARN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark w-full pl-12 pr-4 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all focus:ring-2 focus:ring-[var(--purple-mid)]"
            />
          </div>

          {/* Session filter */}
          <div className="relative sm:w-64">
            <Wifi size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-ghost)' }} />
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="hover:border-[var(--border-bright)] transition-colors text-xs font-bold"
              style={{ ...selectStyle, paddingLeft: '2.5rem', paddingRight: '2rem', minHeight: '44px' }}
            >
              <option value="">All Sessions</option>
              {availableSessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {s.session_id.replace(/_/g, ' ')} {s.owner_company ? `(${s.owner_company})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Batch Actions */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-wrap gap-2 items-center"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--purple-mid)] mr-2 px-3 py-1 rounded-full bg-[rgba(109,40,217,0.06)] border border-[rgba(109,40,217,0.12)]">
                {selectedIds.length} Selected
              </span>

              {statusTab === 'pending' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApproveSelected}
                  disabled={approving}
                  className="btn-primary px-5 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {approving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent"
                    />
                  ) : (
                    <Check size={14} className="stroke-[3]" />
                  )}
                  Add to Leads
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="px-5 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#dc2626' }}
              >
                {deleting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-3.5 h-3.5 rounded-full border-2 border-red-600 border-t-transparent"
                  />
                ) : (
                  <Trash2 size={14} />
                )}
                Discard
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedIds.length === 0 && bulkLeads.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClearAll}
            className="px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all self-end lg:self-center"
            style={{ background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.08)', color: '#dc2626' }}
          >
            Discard All Shown
          </motion.button>
        )}
      </div>

      {/* Leads Table Container */}
      <div
        className="w-full overflow-hidden rounded-3xl border shadow-xl"
        style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-[var(--purple-mid)] border-t-transparent"
            />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Analyzing Staged Memory...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <AlertCircle size={40} className="text-red-500" />
            <p className="text-sm font-bold text-red-500">Failed to connect to API server.</p>
            <button
              onClick={fetchBulkLeads}
              className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-[var(--purple-mid)] hover:underline flex items-center gap-2"
            >
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        ) : bulkLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'rgba(109,40,217,0.03)', border: '1px solid rgba(109,40,217,0.08)' }}
            >
              <Layers size={36} className="text-[var(--text-ghost)]" />
            </div>
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-1">
              No bulk data found
            </h3>
            <p className="text-xs max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchTerm || filterSession
                ? 'No bulk leads match the selected search terms or session filters.'
                : `There are currently no ${statusTab} bulk leads in storage. Excel screenshots with multiple leads will show up here automatically.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[10px] font-black uppercase tracking-widest" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th className="py-5 px-6 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-[var(--purple-mid)] focus:ring-[var(--purple-mid)] cursor-pointer"
                      checked={selectedIds.length === bulkLeads.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-5 px-6">Identity details</th>
                  <th className="py-5 px-6">Application Reference (ARN)</th>
                  <th className="py-5 px-6">Source Message</th>
                  <th className="py-5 px-6">Date Captured</th>
                  <th className="py-5 px-6">Confidence</th>
                  <th className="py-5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {bulkLeads.map((lead) => {
                  const hasContactInfo = (lead.mobile && lead.mobile !== 'absent') || (lead.email && lead.email !== 'absent');
                  
                  return (
                    <React.Fragment key={lead.id}>
                      <tr
                        onClick={() => setExpandedRow(expandedRow === lead.id ? null : lead.id)}
                        className={`group hover:bg-[var(--bg-hover)] transition-colors duration-200 cursor-pointer ${
                          selectedIds.includes(lead.id) ? 'bg-[rgba(109,40,217,0.02)]' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-4 px-6 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-[var(--purple-mid)] focus:ring-[var(--purple-mid)] cursor-pointer"
                            checked={selectedIds.includes(lead.id)}
                            onChange={() => toggleSelect(lead.id)}
                          />
                        </td>

                        {/* Identity */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <p className="font-black text-xs md:text-sm text-[var(--text-primary)] capitalize">
                              {lead.extracted_name && lead.extracted_name !== 'absent'
                                ? lead.extracted_name
                                : 'Unnamed Staged Lead'}
                            </p>
                            <div className="space-y-0.5">
                              {lead.mobile && lead.mobile !== 'absent' && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                                  <Phone size={10} className="text-[var(--text-ghost)]" /> {lead.mobile}
                                </span>
                              )}
                              {lead.email && lead.email !== 'absent' && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold truncate max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                                  <Mail size={10} className="text-[var(--text-ghost)]" /> {lead.email}
                                </span>
                              )}
                              {!hasContactInfo && (
                                <span className="text-[9px] font-bold text-amber-500 uppercase flex items-center gap-1">
                                  <AlertCircle size={10} /> No Contact Info
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ARN */}
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          {lead.arn && lead.arn !== 'absent' ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold tracking-wide select-all text-[var(--text-primary)] bg-[var(--bg-void)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                                {lead.arn}
                              </span>
                              <button
                                onClick={() => copyToClipboard(lead.arn!, `arn-${lead.id}`)}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-ghost)] hover:text-[var(--purple-mid)] transition-colors"
                                title="Copy ARN"
                              >
                                {copiedArns[`arn-${lead.id}`] ? (
                                  <Check size={12} className="text-emerald-500 stroke-[3]" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-ghost)] italic">
                              Absent
                            </span>
                          )}
                        </td>

                        {/* Source Message Preview */}
                        <td className="py-4 px-6 max-w-xs">
                          <p className="text-xs font-bold truncate text-[var(--text-secondary)]">
                            {lead.source_message || 'Media screenshot upload'}
                          </p>
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest mt-1 block"
                            style={{ color: 'var(--text-ghost)' }}
                          >
                            Session: {lead.session_id.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Date Captured */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                            <Calendar size={12} className="text-[var(--text-ghost)]" />
                            {new Date(lead.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>

                        {/* Confidence */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 w-12 bg-[var(--bg-void)] h-1.5 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${lead.confidence * 100}%`,
                                  background: lead.confidence > 0.8 ? '#10b981' : lead.confidence > 0.5 ? '#f59e0b' : '#ef4444'
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-black tracking-tighter" style={{ color: 'var(--text-muted)' }}>
                              {Math.round(lead.confidence * 100)}%
                            </span>
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {lead.status === 'pending' && (
                              <button
                                onClick={() => handleApproveSingle(lead.id)}
                                className="p-2 rounded-xl text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                title="Promote to standard Lead"
                              >
                                <Check size={14} className="stroke-[3]" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSingle(lead.id)}
                              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Discard Staged Lead"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable row detail */}
                      <AnimatePresence>
                        {expandedRow === lead.id && (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="px-12 py-6 border-b space-y-4" style={{ background: 'var(--bg-void)', borderColor: 'var(--border-subtle)' }}>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                    <div className="space-y-1.5">
                                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                        Metadata
                                      </p>
                                      <div className="space-y-1 font-bold">
                                        <p style={{ color: 'var(--text-secondary)' }}>ID: <span className="text-[var(--text-primary)]">{lead.id}</span></p>
                                        <p style={{ color: 'var(--text-secondary)' }}>WhatsApp JID: <span className="text-[var(--text-primary)] select-all font-mono">{lead.wa_jid}</span></p>
                                        {lead.group_jid && (
                                          <p style={{ color: 'var(--text-secondary)' }}>Group JID: <span className="text-[var(--text-primary)] select-all font-mono">{lead.group_jid}</span></p>
                                        )}
                                        <p style={{ color: 'var(--text-secondary)' }}>Owner Company: <span className="text-[var(--text-primary)]">{lead.owner_company || 'N/A'}</span></p>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                        Extraction Source Context
                                      </p>
                                      <div
                                        className="p-3 rounded-xl border font-bold font-mono text-[10px] break-words whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar"
                                        style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                                      >
                                        {lead.source_message || 'N/A (Screenshot file upload)'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
