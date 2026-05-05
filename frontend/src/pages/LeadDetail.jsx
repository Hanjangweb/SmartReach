import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, MapPin, Edit3, MessageSquare, Bot, Copy,
  Bell, Star, Calendar, Send, ExternalLink, Zap, Home, Search, Mic, Link, Cloud, FileText, Download, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useLeadStore from '../store/leadStore';
import StatusBadge, { ScoreBadge } from '../components/Leads/StatusBadge';
import api from '../lib/api';
import './LeadDetail.css';

const STATUSES = ['New', 'Contacted', 'Negotiation', 'SiteVisit', 'Closed', 'Lost'];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentLead: lead, isLoading, fetchLead, updateLeadStatus } = useLeadStore();
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [tab, setTab] = useState('notes'); // notes | ai | insight | reminder | properties
  const [agents, setAgents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealForm, setDealForm] = useState({ saleValue: '', commissionRate: 2, agentSplit: 50 });

  // Reminder state
  const [reminder, setReminder] = useState({ message: '', scheduledAt: '', type: 'call' });
  const [savingReminder, setSavingReminder] = useState(false);

  // Documents state
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    fetchLead(id);
    api.get(`/leads/${id}/notes`).then((r) => setNotes(r.data.notes || [])).catch(() => {});
    if (user?.role === 'admin') {
      api.get('/admin/users').then((r) => setAgents(r.data.users || [])).catch(() => {});
    }
  }, [id, user]);

    if (tab === 'properties' && properties.length === 0) {
      setLoadingProps(true);
      api.get('/properties').then(r => setProperties(r.data.properties || [])).finally(() => setLoadingProps(false));
    }
    if (tab === 'ai-matches' && matches.length === 0) {
      fetchMatches();
    }
    if (tab === 'templates' && templates.length === 0) {
      setLoadingTemplates(true);
      api.get('/templates').then(r => setTemplates(r.data.templates || [])).finally(() => setLoadingTemplates(false));
    }
  }, [tab]);

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      const r = await api.get(`/leads/${id}/matches`);
      setMatches(r.data.matches || []);
      if (r.data.matches?.length > 0) toast.success('Found best matches!');
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response.data.message || 'Advanced Plan Required for AI Matcher', { icon: '✨' });
      } else {
        toast.error('Failed to load AI matches');
      }
    }
    setLoadingMatches(false);
  };

  const suggestProperty = async (prop) => {
    const message = `Hi ${lead?.name},\nI thought you might be interested in this property based on your requirements:\n\n*${prop.title}*\nLocation: ${prop.location}\nPrice: ₹${prop.price} Lakhs\nType: ${prop.type}\n\nLet me know if you'd like to schedule a site visit!`;
    
    try {
      await api.post(`/leads/${id}/notes`, {
        content: `Suggested property: ${prop.title} (₹${prop.price}L)`,
        type: 'manual'
      });
      fetchLead(id);
      api.get(`/leads/${id}/notes`).then((r) => setNotes(r.data.notes || [])).catch(() => {});
      toast.success('Property suggested and recorded!');
      
      const url = `https://wa.me/${lead?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to record suggestion');
    }
  };

  const handleStatusChange = async (status) => {
    if (status === 'Closed') {
      setShowDealModal(true);
      return;
    }
    const r = await updateLeadStatus(id, status);
    if (r.success) toast.success(`Status → ${status}`);
  };

  const submitDeal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deals', {
        lead: id,
        saleValue: Number(dealForm.saleValue),
        commissionRate: Number(dealForm.commissionRate),
        agentSplit: Number(dealForm.agentSplit)
      });
      
      const r = await updateLeadStatus(id, 'Closed');
      if (r.success) toast.success('Deal closed and commission logged! 🎉');
      
      await api.post(`/leads/${id}/notes`, {
        content: `[System] Deal closed! Sale Value: ₹${dealForm.saleValue}L, Commission: ${dealForm.commissionRate}%, Agent Split: ${dealForm.agentSplit}%`,
        type: 'system'
      });
      
      fetchLead(id);
      api.get(`/leads/${id}/notes`).then((r) => setNotes(r.data.notes || [])).catch(() => {});
      setShowDealModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close deal');
    }
  };

  const handleAssign = async (agentId) => {
    try {
      await api.put(`/leads/${id}/assign`, { agentId });
      toast.success('Lead reassigned');
      fetchLead(id);
      api.get(`/leads/${id}/notes`).then((r) => setNotes(r.data.notes || [])).catch(() => {});
    } catch {
      toast.error('Failed to reassign lead');
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const r = await api.post(`/leads/${id}/notes`, { content: noteText });
      setNotes([r.data.note, ...notes]);
      setNoteText('');
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
    setAddingNote(false);
  };

  const generateAI = async (customPrompt = '') => {
    if (user?.plan === 'free') {
      toast.error('AI Replies are only available on the Pro plan!', { icon: '👑' });
      setTab('ai');
      return;
    }
    setAiLoading(true);
    setTab('ai');
    try {
      const r = await api.post('/ai/reply', { leadId: id, customPrompt });
      setAiReply(r.data.reply);
      toast.success('AI reply generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI service unavailable');
    }
    setAiLoading(false);
  };

  const generateInsight = async () => {
    if (user?.plan === 'free') {
      toast.error('AI Insights are only available on the Pro plan!', { icon: '👑' });
      setTab('insight');
      return;
    }
    setInsightLoading(true);
    setTab('insight');
    try {
      const r = await api.post('/ai/insight', { leadId: id });
      setInsight(r.data.insight);
      toast.success('AI insight generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI service unavailable');
    }
    setInsightLoading(false);
  };

  const scoreLead = async () => {
    if (user?.plan === 'free') {
      toast.error('Lead Scoring is a Pro feature!', { icon: '🔥' });
      return;
    }
    setScoreLoading(true);
    try {
      const r = await api.post('/ai/score', { leadId: id });
      await fetchLead(id);
      toast.success(`Scored: ${r.data.score} (${r.data.percentage}%)`);
    } catch { toast.error('Scoring failed'); }
    setScoreLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const saveReminder = async () => {
    if (!reminder.message.trim() || !reminder.scheduledAt) { toast.error('Fill reminder details'); return; }
    setSavingReminder(true);
    try {
      await api.post('/reminders', { ...reminder, leadId: id });
      toast.success('Reminder set!');
      setReminder({ message: '', scheduledAt: '', type: 'call' });
    } catch { toast.error('Failed to set reminder'); }
    setSavingReminder(false);
  };

  const handleVoiceCall = async () => {
    if (user?.plan !== 'advanced' && user?.role !== 'admin') {
      toast.error('AI Voice Calling requires the Advanced plan!', { icon: '✨' });
      return;
    }
    const t = toast.loading('Initiating AI Voice Call...');
    try {
      await api.post(`/voice/call/${id}`);
      toast.success('AI Call initiated! Transcript will appear in notes shortly.', { id: t });
    } catch (err) {
      toast.error('Failed to initiate AI call', { id: t });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (user?.plan === 'free') {
      toast.error('Cloud Document Storage is a Pro feature!', { icon: '☁️' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    setUploadingDoc(true);
    const t = toast.loading('Uploading document to cloud...');
    try {
      await api.post(`/drive/upload/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchLead(id);
      toast.success('Document uploaded securely.', { id: t });
    } catch (err) {
      toast.error('Upload failed.', { id: t });
    }
    setUploadingDoc(false);
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/drive/document/${id}/${docId}`);
      await fetchLead(id);
      toast.success('Document removed');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  if (isLoading || !lead) return (
    <div>
      <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 200, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 300 }} />
    </div>
  );

  const waPhone = `91${lead.phone?.replace(/\D/g, '')}`;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${lead.name}, `)}`;
  const bookingUrl = `${window.location.origin}/book/${id}`;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('/leads')}><ArrowLeft size={18} /></button>
          <div>
            <h1>{lead.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={lead.status} />
              <ScoreBadge score={lead.leadScore} />
              {lead.source && <span className="badge badge-new">{lead.source}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate(`/leads/edit/${id}`)}><Edit3 size={16} /> Edit</button>
          <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <button className="btn btn-primary" onClick={handleVoiceCall} title="AI Voice Call (Pre-qualify Lead)">
            <Mic size={16} /> AI Call
          </button>
        </div>
      </div>

      <div className="lead-detail-grid">
        {/* Left: Lead Info */}
        <div className="flex flex-col gap-4">
          {/* Info Card */}
          <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="mb-4">Lead Information</h3>
            <div className="lead-info-grid">
              {user?.role === 'admin' ? (
                <div className="info-row" style={{ alignItems: 'center' }}>
                  <span className="info-icon">👤</span>
                  <div className="w-full">
                    <span className="info-label">Assigned Agent</span>
                    <select 
                      className="form-select form-select-sm mt-1" 
                      value={lead.agent?._id || ''} 
                      onChange={(e) => handleAssign(e.target.value)}
                    >
                      <option value="" disabled>Select Agent</option>
                      {agents.map(a => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                lead.agent && <InfoRow icon={<span>👤</span>} label="Agent" value={lead.agent.name || 'Unknown'} />
              )}
              <InfoRow icon={<Phone size={15} />} label="Phone" value={lead.phone} />
              {lead.email && <InfoRow icon={<span>✉️</span>} label="Email" value={lead.email} />}
              <InfoRow icon={<span>🏠</span>} label="Property" value={lead.propertyType} />
              {lead.budget > 0 && <InfoRow icon={<span>₹</span>} label="Budget" value={`₹${lead.budget} Lakhs`} />}
              {lead.location && <InfoRow icon={<MapPin size={15} />} label="Location" value={lead.location} />}
              {lead.requirement && <InfoRow icon={<span>📋</span>} label="Requirement" value={lead.requirement} />}
              {lead.followUpDate && <InfoRow icon={<Calendar size={15} />} label="Follow-up" value={new Date(lead.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
            </div>
          </motion.div>

          {/* Status Update */}
          <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="mb-4">Update Status</h3>
            <div className="status-btns">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${lead.status === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleStatusChange(s)}
                  id={`status-${s.toLowerCase()}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>

          {/* AI Score */}
          <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-4">
              <h3>Lead Score</h3>
              <ScoreBadge score={lead.leadScore} />
            </div>
            {lead.scorePercentage > 0 && (
              <div className="score-bar-wrap">
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{ width: `${lead.scorePercentage}%` }} />
                </div>
                <span className="text-sm font-semibold">{lead.scorePercentage}%</span>
              </div>
            )}
            <button className="btn btn-secondary btn-sm mt-4" onClick={scoreLead} disabled={scoreLoading}>
              {scoreLoading ? <span className="spinner" /> : <><Zap size={14} /> Score with AI</>}
            </button>
          </motion.div>

          {/* Site Visit Card */}
          <motion.div className="glass-card p-6 border border-emerald/20" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent)' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-emerald" />
              <h3 className="text-emerald m-0">Site Visit Tracking</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-xs text-muted mb-1">Current Status</div>
                  <div className="font-semibold">{lead.siteVisitStatus !== 'None' ? lead.siteVisitStatus : 'Not Scheduled'}</div>
                </div>
                {lead.siteVisitDate && (
                  <div className="text-right">
                    <div className="text-xs text-muted mb-1">Scheduled For</div>
                    <div className="font-semibold text-primary">{new Date(lead.siteVisitDate).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-muted mb-2 block">Client Booking Link</label>
                <div className="flex gap-2" style={{ minWidth: 0 }}>
                  <input className="form-input text-xs bg-white/5 font-mono" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} readOnly value={bookingUrl} />
                  <button className="btn btn-secondary btn-icon" style={{ flexShrink: 0 }} onClick={() => copyToClipboard(bookingUrl)} title="Copy Booking Link">
                    <Copy size={14} />
                  </button>
                  <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${lead.name}, you can pick a time for your site visit using this link: ${bookingUrl}`)}`} target="_blank" rel="noreferrer" className="btn btn-success btn-icon" style={{ flexShrink: 0 }} title="Send Link via WA">
                    <Send size={14} />
                  </a>
                </div>
                <p className="text-[11px] text-muted mt-2 leading-tight">Send this link to the lead. When they select a time, it will automatically update their status and schedule the visit.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Tabs */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="detail-tabs">
            <button className={`detail-tab ${tab === 'notes' ? 'active' : ''}`} onClick={() => setTab('notes')} id="tab-notes">
              <MessageSquare size={16} /> <span className="tab-label">Notes ({notes.length})</span>
            </button>
            <button className={`detail-tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')} id="tab-ai">
              <Bot size={16} /> <span className="tab-label">AI Reply</span>
            </button>
            <button className={`detail-tab ${tab === 'insight' ? 'active' : ''}`} onClick={() => setTab('insight')} id="tab-insight">
              <Zap size={16} /> <span className="tab-label">Insight</span>
            </button>
            <button className={`detail-tab ${tab === 'properties' ? 'active' : ''}`} onClick={() => setTab('properties')} id="tab-properties">
              <Home size={16} /> <span className="tab-label">Catalog</span>
            </button>
            <button className={`detail-tab ${tab === 'ai-matches' ? 'active' : ''}`} onClick={() => setTab('ai-matches')} id="tab-ai-matches">
              <Search size={16} /> <span className="tab-label">AI Match</span>
            </button>
            <button className={`detail-tab ${tab === 'reminder' ? 'active' : ''}`} onClick={() => setTab('reminder')} id="tab-reminder">
              <Bell size={16} /> <span className="tab-label">Remind</span>
            </button>
            <button className={`detail-tab ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')} id="tab-templates">
              <FileText size={16} /> <span className="tab-label">Templates</span>
            </button>
            <button className={`detail-tab ${tab === 'documents' ? 'active' : ''}`} onClick={() => setTab('documents')} id="tab-documents">
              <Cloud size={16} /> <span className="tab-label">Docs</span>
            </button>
          </div>

          <div className="detail-tab-content">
            {/* Notes Tab */}
            {tab === 'notes' && (
              <div className="flex flex-col gap-4">
                <div className="note-compose">
                  <textarea
                    className="form-textarea"
                    placeholder="Add a note, call log, or observation..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    id="note-input"
                  />
                  <button className="btn btn-primary btn-sm" onClick={addNote} disabled={addingNote || !noteText.trim()} id="add-note-btn">
                    {addingNote ? <span className="spinner" /> : <><Send size={14} /> Add Note</>}
                  </button>
                </div>
                <div className="notes-list">
                  {notes.length === 0 ? (
                    <div className="empty-state"><span className="empty-state-icon">📝</span><p>No notes yet</p></div>
                  ) : notes.map((note) => (
                    <div key={note._id} className={`note-item ${note.type}`}>
                      <div className="note-meta">
                        <span className="note-type-badge">{note.type === 'ai' ? '🤖 AI' : note.type === 'call' ? '📞 Call' : '📝 Note'}</span>
                        <span className="text-xs text-muted">{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="note-content">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Reply Tab */}
            {tab === 'ai' && (
              <div className="flex flex-col gap-4">
                <div className="ai-prompt-row">
                  <input
                    className="form-input flex-1"
                    placeholder="Custom instruction (optional): 'Mention price drop' or 'Schedule site visit'"
                    id="ai-custom-prompt"
                  />
                  <button className="btn btn-primary" onClick={() => generateAI(document.getElementById('ai-custom-prompt').value)} disabled={aiLoading} id="generate-ai-btn">
                    {aiLoading ? <span className="spinner" /> : <><Bot size={16} /> Generate</>}
                  </button>
                </div>

                {aiReply ? (
                  <div className="ai-reply-card">
                    <div className="ai-reply-header">
                      <span className="text-sm font-semibold text-indigo">🤖 AI Generated Reply</span>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(aiReply)} id="copy-ai-btn">
                          <Copy size={13} /> Copy
                        </button>
                        <a
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(aiReply)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-success btn-sm"
                          id="send-wa-btn"
                        >
                          <ExternalLink size={13} /> Send on WhatsApp
                        </a>
                      </div>
                    </div>
                    <p className="ai-reply-text">{aiReply}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => generateAI()}>🔄 Regenerate</button>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-state-icon">🤖</span>
                    <p>Click "Generate" to create a personalized AI reply based on this lead's profile</p>
                  </div>
                )}
              </div>
            )}

            {/* Insight Tab */}
            {tab === 'insight' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-indigo font-semibold flex items-center gap-2"><Zap size={16}/> Strategic Insight</h4>
                  <button className="btn btn-primary btn-sm" onClick={generateInsight} disabled={insightLoading}>
                    {insightLoading ? <span className="spinner" /> : <><Bot size={14} /> Generate Insight</>}
                  </button>
                </div>
                {insight ? (
                  <div className="ai-reply-card">
                    <p className="ai-reply-text">{insight}</p>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-state-icon">💡</span>
                    <p>Get AI-powered recommendations for the next best action with this lead.</p>
                  </div>
                )}
              </div>
            )}

            {/* Properties Tab */}
            {tab === 'properties' && (
              <div className="flex flex-col gap-4">
                <h4 className="text-primary font-semibold flex items-center gap-2"><Home size={16}/> Property Catalog</h4>
                {loadingProps ? (
                  <div className="p-4 text-center text-muted">Loading catalog...</div>
                ) : properties.length === 0 ? (
                  <div className="empty-state p-4">No properties available in catalog.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {properties.map(prop => (
                      <div key={prop._id} className="glass-card p-3 flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div>
                          <div className="font-semibold text-sm">{prop.title}</div>
                          <div className="text-xs text-muted">{prop.location} • ₹{prop.price}L • {prop.type}</div>
                        </div>
                        <button className="btn btn-primary btn-sm px-3 py-1 text-xs" onClick={() => suggestProperty(prop)}>
                          <MessageSquare size={12} /> Suggest
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Matches Tab */}
            {tab === 'ai-matches' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-emerald font-semibold flex items-center gap-2"><Search size={16}/> Top AI Matches</h4>
                  <button className="btn btn-secondary btn-sm" onClick={fetchMatches} disabled={loadingMatches}>
                    <Zap size={14} /> Re-scan
                  </button>
                </div>
                {loadingMatches ? (
                  <div className="p-8 flex flex-col items-center justify-center gap-3">
                    <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                    <p className="text-sm text-muted">AI is analyzing catalog & lead preferences...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="empty-state p-4">
                    <span className="empty-state-icon">🤖</span>
                    <p>No highly suitable matches found or you need the Advanced Plan.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {matches.map((match, idx) => (
                      <div key={match.propertyId} className="glass-card p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: idx === 0 ? '1px solid var(--emerald)' : undefined }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              {idx === 0 && <span className="badge bg-emerald/20 text-emerald border border-emerald/30">#1 Best Match</span>}
                              <h5 className="font-bold text-primary m-0">{match.property.title}</h5>
                            </div>
                            <div className="text-xs text-muted mt-1">{match.property.location} • ₹{match.property.price}L • {match.property.type}</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-emerald">{match.score}%</span>
                            <span className="text-[10px] text-muted uppercase tracking-wide">Match Score</span>
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm">
                          <span className="font-semibold text-amber mr-2">Why it fits:</span>
                          {match.reason}
                        </div>
                        <div className="flex justify-end mt-1">
                          <button className="btn btn-primary btn-sm" onClick={() => suggestProperty(match.property)}>
                            <MessageSquare size={13} /> Suggest to Lead
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reminder Tab */}
            {tab === 'reminder' && (
              <div className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Reminder Message</label>
                  <input className="form-input" placeholder="Follow up on 3BHK requirement in Noida" value={reminder.message} onChange={(e) => setReminder({ ...reminder, message: e.target.value })} id="reminder-message" />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Date & Time</label>
                    <input className="form-input" type="datetime-local" value={reminder.scheduledAt} onChange={(e) => setReminder({ ...reminder, scheduledAt: e.target.value })} id="reminder-datetime" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={reminder.type} onChange={(e) => setReminder({ ...reminder, type: e.target.value })} id="reminder-type">
                      {['call', 'whatsapp', 'visit', 'email', 'general'].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={saveReminder} disabled={savingReminder} id="save-reminder-btn">
                  {savingReminder ? <span className="spinner" /> : <><Bell size={16} /> Set Reminder</>}
                </button>
              </div>
            )}

            {/* Templates Tab */}
            {tab === 'templates' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-primary font-semibold flex items-center gap-2"><FileText size={16}/> Message Templates</h4>
                </div>
                {loadingTemplates ? (
                  <div className="p-4 text-center text-muted">Loading templates...</div>
                ) : templates.length === 0 ? (
                  <div className="empty-state p-4">
                    <span className="empty-state-icon">📝</span>
                    <p>No templates found. Create some in the Templates menu!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {templates.map(template => {
                      let previewText = template.content
                        .replace(/{{name}}/g, lead.name || 'Client')
                        .replace(/{{location}}/g, lead.location || 'your area')
                        .replace(/{{property}}/g, lead.propertyType || 'property')
                        .replace(/{{budget}}/g, lead.budget ? `₹${lead.budget}L` : 'your budget')
                        .replace(/{{phone}}/g, lead.phone || '');
                        
                      return (
                        <div key={template._id} className="glass-card p-4 flex flex-col gap-2 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-semibold text-sm text-primary">{template.name}</div>
                            <span className="badge badge-new">{template.category}</span>
                          </div>
                          <div className="text-sm text-muted whitespace-pre-wrap p-3 bg-black/20 rounded border border-white/5">
                            {previewText}
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(previewText)}>
                              <Copy size={14} /> Copy
                            </button>
                            <a 
                              href={`https://wa.me/91${lead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(previewText)}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-success btn-sm"
                            >
                              <Send size={14} /> Send via WA
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {tab === 'documents' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-blue-400 font-semibold flex items-center gap-2"><Cloud size={16}/> Cloud Storage</h4>
                  <div>
                    <input 
                      type="file" 
                      id="doc-upload" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                      disabled={uploadingDoc}
                    />
                    <label htmlFor="doc-upload" className={`btn btn-primary btn-sm ${uploadingDoc ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      {uploadingDoc ? <span className="spinner" /> : <><FileText size={14} /> Upload File</>}
                    </label>
                  </div>
                </div>

                {!lead.documents || lead.documents.length === 0 ? (
                  <div className="empty-state p-6">
                    <span className="empty-state-icon">☁️</span>
                    <p>No documents uploaded yet. Securely store contracts, IDs, and property docs here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {lead.documents.map((doc) => (
                      <div key={doc._id} className="glass-card p-3 flex justify-between items-center bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                            <FileText size={14} />
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-sm truncate">{doc.name}</div>
                            <div className="text-xs text-muted">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-icon btn-sm text-blue-400" title="Download">
                            <Download size={14} />
                          </a>
                          <button className="btn btn-secondary btn-icon btn-sm text-red-400" onClick={() => handleDeleteDocument(doc._id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Deal Modal */}
      {showDealModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
          <motion.div className="glass-card p-6 max-w-md w-full m-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <h3 className="mb-2 text-emerald">🎉 Close Deal</h3>
            <p className="text-sm text-muted mb-6">Enter the financial details to track commission and agency revenue.</p>
            
            <form onSubmit={submitDeal} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Final Sale Value (in Lakhs) *</label>
                <input required type="number" step="0.1" className="form-input" placeholder="e.g. 75.5" value={dealForm.saleValue} onChange={e => setDealForm({...dealForm, saleValue: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Agency Comm. % *</label>
                  <input required type="number" step="0.1" className="form-input" value={dealForm.commissionRate} onChange={e => setDealForm({...dealForm, commissionRate: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Agent Split % *</label>
                  <input required type="number" step="1" className="form-input" value={dealForm.agentSplit} onChange={e => setDealForm({...dealForm, agentSplit: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowDealModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" style={{ background: '#10b981', borderColor: '#10b981' }}>Confirm Deal</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="info-row">
      <span className="info-icon">{icon}</span>
      <div>
        <span className="info-label">{label}</span>
        <span className="info-value">{value}</span>
      </div>
    </div>
  );
}
