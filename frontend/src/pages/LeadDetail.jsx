import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, MapPin, Edit3, MessageSquare, Bot, Copy,
  Bell, Star, Calendar, Send, ExternalLink, Zap
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
  const [scoreLoading, setScoreLoading] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [tab, setTab] = useState('notes'); // notes | ai | reminder

  // Reminder state
  const [reminder, setReminder] = useState({ message: '', scheduledAt: '', type: 'call' });
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    fetchLead(id);
    api.get(`/leads/${id}/notes`).then((r) => setNotes(r.data.notes || [])).catch(() => {});
  }, [id]);

  const handleStatusChange = async (status) => {
    const r = await updateLeadStatus(id, status);
    if (r.success) toast.success(`Status → ${status}`);
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
      await api.post('/reminders', { ...reminder, lead: id });
      toast.success('Reminder set!');
      setReminder({ message: '', scheduledAt: '', type: 'call' });
    } catch { toast.error('Failed to set reminder'); }
    setSavingReminder(false);
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
        </div>
      </div>

      <div className="lead-detail-grid">
        {/* Left: Lead Info */}
        <div className="flex flex-col gap-4">
          {/* Info Card */}
          <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="mb-4">Lead Information</h3>
            <div className="lead-info-grid">
              {user?.role === 'admin' && lead.agent && (
                <InfoRow icon={<span>👤</span>} label="Agent" value={lead.agent.name || 'Unknown'} />
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
        </div>

        {/* Right: Tabs */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="detail-tabs">
            <button className={`detail-tab ${tab === 'notes' ? 'active' : ''}`} onClick={() => setTab('notes')} id="tab-notes">
              <MessageSquare size={16} /> Notes ({notes.length})
            </button>
            <button className={`detail-tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')} id="tab-ai">
              <Bot size={16} /> AI Reply
            </button>
            <button className={`detail-tab ${tab === 'reminder' ? 'active' : ''}`} onClick={() => setTab('reminder')} id="tab-reminder">
              <Bell size={16} /> Reminder
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
          </div>
        </motion.div>
      </div>
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
