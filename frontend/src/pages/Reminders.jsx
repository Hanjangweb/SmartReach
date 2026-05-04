import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';
import './Reminders.css';

const TYPE_ICONS = { call: '📞', whatsapp: '💬', visit: '🏠', email: '✉️', general: '🔔' };

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | upcoming | done

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reminders');
      setReminders(r.data.reminders || []);
    } catch { toast.error('Failed to load reminders'); }
    setLoading(false);
  };

  const markDone = async (id) => {
    try {
      await api.put(`/reminders/${id}/done`);
      setReminders((prev) => prev.map((r) => r._id === id ? { ...r, sent: true } : r));
      toast.success('Marked as done!');
    } catch { toast.error('Failed'); }
  };

  const deleteReminder = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const filtered = reminders.filter((r) => {
    if (filter === 'upcoming') return !r.sent && new Date(r.scheduledAt) >= new Date();
    if (filter === 'done') return r.sent;
    return true;
  });

  const upcoming = reminders.filter((r) => !r.sent && new Date(r.scheduledAt) >= new Date()).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p className="text-secondary text-sm mt-2">{upcoming} upcoming follow-ups</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="reminder-filter-tabs glass-card mb-6">
        {['all', 'upcoming', 'done'].map((f) => (
          <button key={f} className={`reminder-filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} id={`reminder-filter-${f}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card p-8">
          <span className="empty-state-icon">🔔</span>
          <h3>No reminders</h3>
          <p>Go to a lead and set a follow-up reminder</p>
        </div>
      ) : (
        <div className="reminders-list">
          {filtered.map((rem, i) => {
            const isOverdue = !rem.sent && new Date(rem.scheduledAt) < new Date();
            return (
              <motion.div
                key={rem._id}
                className={`reminder-card glass-card ${rem.sent ? 'done' : ''} ${isOverdue ? 'overdue' : ''}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="reminder-icon">{TYPE_ICONS[rem.type] || '🔔'}</div>
                <div className="reminder-body">
                  <p className="reminder-message">{rem.message}</p>
                  {rem.lead && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-indigo font-semibold">{rem.lead.name}</span>
                      <span className="flex items-center gap-1 text-xs text-secondary"><Phone size={11} /> {rem.lead.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar size={12} className="text-muted" />
                    <span className={`text-xs ${isOverdue ? 'text-rose' : 'text-secondary'}`}>
                      {new Date(rem.scheduledAt).toLocaleString('en-IN')}
                      {isOverdue && ' • Overdue'}
                    </span>
                    <span className="text-xs text-muted">({formatDistanceToNow(new Date(rem.scheduledAt), { addSuffix: true })})</span>
                  </div>
                </div>
                <div className="reminder-actions">
                  {!rem.sent && (
                    <button className="btn btn-success btn-sm btn-icon" onClick={() => markDone(rem._id)} title="Mark Done" id={`mark-done-${rem._id}`}>
                      <Check size={16} />
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteReminder(rem._id)} title="Delete" id={`del-rem-${rem._id}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
