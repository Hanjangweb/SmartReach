import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './RemindersManager.css';

export default function RemindersManager() {
  const { user } = useAuthStore();
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({
    leadId: '',
    message: '',
    scheduledAt: '',
    type: 'general',
  });
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchReminders();
    fetchStats();
    fetchLeads();
  }, []);

  const fetchReminders = async (tab = activeTab) => {
    setLoading(true);
    try {
      const res = await api.get('/reminders', { params: { status: tab } });
      setReminders(res.data.reminders);
    } catch (err) {
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/reminders/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads?limit=1000&status=Contacted');
      setLeads(res.data.leads);
    } catch (err) {
      console.error('Failed to fetch leads');
    }
  };

  const handleAddReminder = async () => {
    if (!form.leadId || !form.message || !form.scheduledAt) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const res = await api.post('/reminders', form);
      setReminders([res.data.reminder, ...reminders]);
      setForm({ leadId: '', message: '', scheduledAt: '', type: 'general' });
      setShowForm(false);
      toast.success('Reminder created!');
      fetchStats();
    } catch (err) {
      toast.error('Failed to create reminder');
    }
  };

  const handleMarkDone = async (id) => {
    try {
      const res = await api.put(`/reminders/${id}/mark-done`);
      setReminders(reminders.filter((r) => r._id !== id));
      toast.success('Reminder marked as done');
      fetchStats();
    } catch (err) {
      toast.error('Failed to mark reminder');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders(reminders.filter((r) => r._id !== id));
      toast.success('Reminder deleted');
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete reminder');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchReminders(tab);
  };

  if (!user?.plan || user.plan === 'free') {
    return (
      <div className="reminders-locked">
        <div className="page-header">
          <h1>Automated Reminders</h1>
        </div>
        <div className="lock-message glass-card-elevated p-8 text-center">
          <Clock size={48} className="mx-auto mb-4 text-blue" />
          <h3>Pro Feature</h3>
          <p className="text-secondary mt-2">
            Automated reminders are available on Pro and Premium plans
          </p>
          <button className="btn btn-primary mt-4">Upgrade Now</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Automated Reminders</h1>
          <p className="text-secondary text-sm mt-2">
            Never miss a follow-up. Schedule reminders for your leads
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Reminder
        </button>
      </div>

      {/* Stats Cards */}
      <div className="reminder-stats">
        <div className="stat-card stat-pending">
          <div className="stat-icon">⏱️</div>
          <div>
            <p className="text-xs text-muted">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon">✅</div>
          <div>
            <p className="text-xs text-muted">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-icon">⚠️</div>
          <div>
            <p className="text-xs text-muted">Overdue</p>
            <p className="text-2xl font-bold text-rose">{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* Add Reminder Form */}
      {showForm && (
        <motion.div
          className="glass-card-elevated p-6 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="mb-4">Create New Reminder</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Lead *</label>
              <select
                className="form-select"
                value={form.leadId}
                onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              >
                <option value="">Select a lead...</option>
                {leads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name} - {lead.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="general">General</option>
                <option value="call">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visit">Site Visit</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Message *</label>
              <textarea
                className="form-textarea"
                placeholder="What do you need to do?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows="3"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn btn-primary" onClick={handleAddReminder}>
              Create Reminder
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setForm({ leadId: '', message: '', scheduledAt: '', type: 'general' });
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="reminder-tabs mb-6">
        {[
          { key: 'pending', label: `Pending (${stats.pending})` },
          { key: 'overdue', label: `Overdue (${stats.overdue})` },
          { key: 'completed', label: `Completed (${stats.completed})` },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="text-center py-8 text-muted">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <Clock size={48} className="mx-auto mb-4 text-muted" />
          <p className="text-secondary">No {activeTab} reminders</p>
        </div>
      ) : (
        <div className="reminders-list">
          {reminders.map((reminder) => {
            const lead = reminder.lead;
            const scheduledTime = new Date(reminder.scheduledAt);
            const isOverdue = scheduledTime < new Date() && !reminder.sent;

            return (
              <motion.div
                key={reminder._id}
                className={`reminder-card ${isOverdue ? 'overdue' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="reminder-icon">
                  {reminder.type === 'call' && '📞'}
                  {reminder.type === 'whatsapp' && '💬'}
                  {reminder.type === 'visit' && '🏢'}
                  {reminder.type === 'email' && '📧'}
                  {reminder.type === 'general' && '📋'}
                </div>

                <div className="reminder-content">
                  <div className="reminder-lead">
                    <p className="font-semibold">{lead?.name}</p>
                    <p className="text-xs text-muted">{lead?.phone}</p>
                  </div>
                  <p className="reminder-message">{reminder.message}</p>
                  <div className="reminder-meta">
                    <span className="text-xs text-muted">
                      {scheduledTime.toLocaleString()}
                    </span>
                    {isOverdue && <span className="badge badge-overdue">Overdue!</span>}
                  </div>
                </div>

                <div className="reminder-actions">
                  {!reminder.sent && (
                    <button
                      className="action-btn done-btn"
                      onClick={() => handleMarkDone(reminder._id)}
                      title="Mark as done"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(reminder._id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
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
