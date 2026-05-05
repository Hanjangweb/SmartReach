import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Zap, Crown, User, ShieldCheck, Mail, Calendar, Edit2, Filter, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import './AdminDashboard.css';

const PLAN_COLORS = { free: '#94a3b8', pro: '#6366f1', advanced: '#f59e0b' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'plans', 'leaderboard', 'support'
  const [supportConversations, setSupportConversations] = useState([]);
  const [selectedSupportUserId, setSelectedSupportUserId] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'support') fetchSupportConversations();
  }, [activeTab]);

  const fetchSupportConversations = async () => {
    try {
      const res = await api.get('/support/admin/conversations');
      setSupportConversations(res.data.conversations || []);
    } catch { toast.error('Failed to load support inbox'); }
  };

  const selectConversation = async (userId) => {
    setSelectedSupportUserId(userId);
    try {
      const res = await api.get(`/support/admin/messages/${userId}`);
      setSupportMessages(res.data.messages || []);
      setSupportConversations(prev => prev.map(c => c._id === userId ? { ...c, unreadCount: 0 } : c));
    } catch { toast.error('Failed to load messages'); }
  };

  const sendSupportReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const res = await api.post(`/support/admin/messages/${selectedSupportUserId}`, { content: replyText });
      setSupportMessages(prev => [...prev, res.data.message]);
      setReplyText('');
    } catch { toast.error('Failed to send reply'); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, pRes, lRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/plans'),
        api.get('/admin/leaderboard')
      ]);
      setStats(sRes.data.stats);
      setUsers(uRes.data.users);
      setPlans(pRes.data.plans || []);
      setLeaderboard(lRes.data.leaderboard || []);
    } catch { toast.error('Failed to load admin data'); }
    setLoading(false);
  };

  const updatePlanRole = async (userId, plan) => {
    try {
      await api.post(`/admin/users/${userId}/plan`, { plan });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, plan } : u));
      toast.success(`Plan updated to ${plan}`);
    } catch { toast.error('Failed to update plan'); }
  };

  const updatePlanDetails = async (planId, data) => {
    try {
      const res = await api.put(`/plans/${planId}`, data);
      setPlans((prev) => prev.map((p) => p._id === planId ? res.data.plan : p));
      toast.success('Plan details saved!');
    } catch { toast.error('Failed to save plan details'); }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="p-8"><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <div className="admin-container">
      <div className="page-header">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-indigo flex-shrink-0" size={24} />
            <h1 className="page-title">Platform Administration</h1>
          </div>
          <p className="page-subtitle text-secondary">Manage users and track platform growth</p>
        </div>
      </div>

      <div className="tab-scroll">
        <button
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Users &amp; Stats
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('leaderboard')}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Team Leaderboard
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'plans' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('plans')}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Manage Plans
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'support' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('support')}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Support Inbox
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Stats Cards */}
      <div className="grid admin-stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="glass-card p-4 stat-card">
          <div className="flex items-start justify-between gap-2">
            <span className="stat-label">Total Users</span>
            <Users size={14} className="text-indigo flex-shrink-0" />
          </div>
          <span className="stat-value">{stats?.totalUsers}</span>
        </div>
        <div className="glass-card p-4 stat-card">
          <div className="flex items-start justify-between gap-2">
            <span className="stat-label">Total Leads</span>
            <Zap size={14} className="text-amber flex-shrink-0" />
          </div>
          <span className="stat-value">{stats?.totalLeads}</span>
        </div>
        <div className="glass-card p-4 stat-card">
          <div className="flex items-start justify-between gap-2">
            <span className="stat-label">Pro Users</span>
            <Crown size={14} className="text-indigo flex-shrink-0" />
          </div>
          <span className="stat-value">{stats?.proUsers}</span>
        </div>
        <div className="glass-card p-4 stat-card">
          <div className="flex items-start justify-between gap-2">
            <span className="stat-label">Est. Revenue</span>
            <DollarSign size={14} className="text-emerald flex-shrink-0" />
          </div>
          <span className="stat-value">₹{stats?.revenueEstimate}</span>
        </div>
      </div>

      {/* User Management */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="flex items-center gap-2 m-0"><User size={18} /> User Management</h3>
          <div className="filter-search w-full sm:max-w-md">
            <Filter size={14} className="filter-icon" />
            <input
              className="filter-input"
              placeholder="Search by name or email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Agency</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', minWidth: 28 }}>
                        {user.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email"><Mail size={10} /> {user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge text-xs" style={{ background: `${PLAN_COLORS[user.plan]}20`, color: PLAN_COLORS[user.plan], borderColor: `${PLAN_COLORS[user.plan]}40` }}>
                      {user.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-xs text-secondary">{user.agency || '—'}</td>
                  <td className="text-xs text-muted">
                    <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(user.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-xs text-xs"
                      value={user.plan}
                      onChange={(e) => updatePlanRole(user._id, e.target.value)}
                      style={{ width: 'auto', minWidth: 90 }}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="p-8 text-center text-muted text-sm">No users found matching your search</div>}
        </div>
      </div>
      </>
      ) : activeTab === 'leaderboard' ? (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Crown size={20} className="text-amber" />
            <h3 className="section-title">Agent Performance Leaderboard</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agent</th>
                  <th>Leads</th>
                  <th>Deals</th>
                  <th>Rate</th>
                  <th>Pipeline</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((lb, index) => (
                  <tr key={lb._id}>
                    <td>
                      <div className="leader-rank" style={{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--text-muted)' }}>
                        #{index + 1}
                      </div>
                    </td>
                    <td>
                      <div className="agent-name">{lb.agentName}</div>
                      <div className="text-xs text-muted">{lb.agentEmail}</div>
                    </td>
                    <td className="font-medium text-sm">{lb.totalLeads}</td>
                    <td className="agent-deals">{lb.closedDeals}</td>
                    <td className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="leader-rate">{lb.conversionRate}%</span>
                        <div className="score-bar-track" style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                          <div className="score-bar-fill" style={{ width: `${Math.min(lb.conversionRate, 100)}%`, height: '100%', background: '#10b981' }} />
                        </div>
                      </div>
                    </td>
                    <td className="agent-pipeline">₹{lb.activePipelineValue}L</td>
                    <td className="agent-revenue">₹{lb.totalClosedValue}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaderboard.length === 0 && <div className="p-8 text-center text-muted">No agent performance data yet</div>}
          </div>
        </div>
      ) : activeTab === 'support' ? (
        <div className="glass-card support-panel" style={{ minHeight: 600 }}>
          {/* Sidebar */}
          <div className="support-sidebar">
            <div className="p-4 border-b border-border font-semibold flex items-center justify-between">
              <span>Conversations</span>
              <span className="badge bg-primary text-white">{supportConversations.length}</span>
            </div>
            {supportConversations.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No support tickets found</div>
            ) : (
              supportConversations.map(conv => (
                <div 
                  key={conv._id} 
                  className={`support-conversation-item ${selectedSupportUserId === conv._id ? 'selected' : ''}`}
                  onClick={() => selectConversation(conv._id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{conv.userInfo.name}</span>
                    {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount} new</span>}
                  </div>
                  <div className="text-xs text-muted mb-2">{conv.userInfo.email} • {conv.userInfo.plan.toUpperCase()}</div>
                  <div className="message-preview">{conv.latestMessage?.content}</div>
                </div>
              ))
            )}
          </div>
          
          {/* Chat Area */}
          <div className="support-chat-area">
            {!selectedSupportUserId ? (
              <div className="flex-1 flex items-center justify-center text-muted">Select a conversation to view and reply</div>
            ) : (
              <>
                <div className="support-messages-panel">
                  {supportMessages.map(msg => (
                    <div key={msg._id} className={`message-bubble ${msg.isFromAdmin ? 'message-admin' : 'message-user'}`}>
                      {msg.content}
                      <span className="message-meta">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <form className="support-reply-form" onSubmit={sendSupportReply}>
                  <input 
                    type="text" 
                    className="form-input flex-1 text-sm" 
                    placeholder="Type your reply to the user..." 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!replyText.trim()}>Reply</button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="plans-manage-grid grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {plans.map(plan => (
            <div key={plan._id} className="glass-card p-6 plan-card">
              <div className="plan-header">
                <h3 className="plan-name" style={{ color: plan.color }}>{plan.name}</h3>
                <span className="badge" style={{ background: `${plan.color}20`, color: plan.color }}>{plan.planId}</span>
              </div>
              
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" className="form-input" value={plan.price} onChange={(e) => {
                  const updated = plans.map(p => p._id === plan._id ? { ...p, price: Number(e.target.value) } : p);
                  setPlans(updated);
                }} />
              </div>

              <div className="form-group">
                <label>Lead Limit (Empty = Unlimited)</label>
                <input type="number" className="form-input" value={plan.leadLimit || ''} onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  const updated = plans.map(p => p._id === plan._id ? { ...p, leadLimit: val } : p);
                  setPlans(updated);
                }} />
              </div>

              <div className="form-group">
                <label>Features (Comma separated)</label>
                <textarea className="form-input" rows={4} value={plan.features.join(', ')} onChange={(e) => {
                  const feats = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  const updated = plans.map(p => p._id === plan._id ? { ...p, features: feats } : p);
                  setPlans(updated);
                }} />
              </div>

              <button className="btn btn-primary mt-auto" onClick={() => updatePlanDetails(plan._id, plan)}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
