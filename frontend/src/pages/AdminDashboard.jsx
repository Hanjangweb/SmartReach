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
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo" size={24} />
            <h1>Platform Administration</h1>
          </div>
          <p className="text-secondary text-sm mt-2">Manage users and track platform growth</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <button 
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
        >
          Users & Stats
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Team Leaderboard
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'plans' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('plans')}
        >
          Manage Plans
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'support' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('support')}
        >
          Support Inbox
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Stats Cards */}
      <div className="grid grid-4 mb-8">
        <div className="glass-card p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Total Users</span>
            <Users size={16} className="text-indigo" />
          </div>
          <span className="text-2xl font-bold text-primary">{stats?.totalUsers}</span>
        </div>
        <div className="glass-card p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Total Leads</span>
            <Zap size={16} className="text-amber" />
          </div>
          <span className="text-2xl font-bold text-primary">{stats?.totalLeads}</span>
        </div>
        <div className="glass-card p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Pro Users</span>
            <Crown size={16} className="text-indigo" />
          </div>
          <span className="text-2xl font-bold text-primary">{stats?.proUsers}</span>
        </div>
        <div className="glass-card p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Est. Revenue</span>
            <DollarSign size={16} className="text-emerald" />
          </div>
          <span className="text-2xl font-bold text-primary">₹{stats?.revenueEstimate}</span>
        </div>
      </div>

      {/* User Management */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="flex items-center gap-2"><User size={18} /> User Management</h3>
          <div className="filter-search" style={{ minWidth: 300 }}>
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
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{user.name}</div>
                        <div className="text-xs text-muted flex items-center gap-1"><Mail size={10} /> {user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: `${PLAN_COLORS[user.plan]}20`, color: PLAN_COLORS[user.plan], borderColor: `${PLAN_COLORS[user.plan]}40` }}>
                      {user.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-sm text-secondary">{user.agency || '—'}</td>
                  <td className="text-sm text-muted">
                    <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(user.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-xs"
                      value={user.plan}
                      onChange={(e) => updatePlanRole(user._id, e.target.value)}
                      style={{ width: 110 }}
                    >
                      <option value="free">Set Free</option>
                      <option value="pro">Set Pro</option>
                      <option value="advanced">Set Advanced</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="p-8 text-center text-muted">No users found matching your search</div>}
        </div>
      </div>
      </>
      ) : activeTab === 'leaderboard' ? (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Crown size={20} className="text-amber" />
            <h3>Agent Performance Leaderboard</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agent</th>
                  <th>Total Leads</th>
                  <th>Closed Deals</th>
                  <th>Conversion Rate</th>
                  <th>Active Pipeline</th>
                  <th>Closed Revenue</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((lb, index) => (
                  <tr key={lb._id}>
                    <td>
                      <div className="font-bold text-lg" style={{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--text-muted)' }}>
                        #{index + 1}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-primary">{lb.agentName}</div>
                      <div className="text-xs text-muted">{lb.agentEmail}</div>
                    </td>
                    <td className="font-medium">{lb.totalLeads}</td>
                    <td className="font-bold text-emerald">{lb.closedDeals}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{lb.conversionRate}%</span>
                        <div className="score-bar-track" style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                          <div className="score-bar-fill" style={{ width: `${Math.min(lb.conversionRate, 100)}%`, height: '100%', background: '#10b981' }} />
                        </div>
                      </div>
                    </td>
                    <td className="font-medium">₹{lb.activePipelineValue}L</td>
                    <td className="font-bold text-emerald">₹{lb.totalClosedValue}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaderboard.length === 0 && <div className="p-8 text-center text-muted">No agent performance data yet</div>}
          </div>
        </div>
      ) : activeTab === 'support' ? (
        <div className="glass-card flex h-[600px] overflow-hidden" style={{ minHeight: 600 }}>
          {/* Sidebar */}
          <div className="w-1/3 border-r border-border overflow-y-auto">
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
                  className={`p-4 border-b border-border cursor-pointer transition-colors ${selectedSupportUserId === conv._id ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : 'hover:bg-white/5 border-l-4 border-l-transparent'}`}
                  onClick={() => selectConversation(conv._id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{conv.userInfo.name}</span>
                    {conv.unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{conv.unreadCount} new</span>}
                  </div>
                  <div className="text-xs text-muted mb-2">{conv.userInfo.email} • {conv.userInfo.plan.toUpperCase()}</div>
                  <div className="text-sm truncate opacity-80">{conv.latestMessage?.content}</div>
                </div>
              ))
            )}
          </div>
          
          {/* Chat Area */}
          <div className="w-2/3 flex flex-col">
            {!selectedSupportUserId ? (
              <div className="flex-1 flex items-center justify-center text-muted">Select a conversation to view and reply</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  {supportMessages.map(msg => (
                    <div key={msg._id} className={`max-w-[80%] p-3 rounded-lg ${msg.isFromAdmin ? 'bg-primary text-white self-end rounded-br-none' : 'bg-white/10 text-white self-start rounded-bl-none'}`}>
                      {msg.content}
                      <span className="text-[0.65rem] opacity-70 block mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <form className="p-4 border-t border-border flex gap-2 bg-black/20" onSubmit={sendSupportReply}>
                  <input 
                    type="text" 
                    className="form-input flex-1" 
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
        <div className="plans-manage-grid grid grid-3 gap-6">
          {plans.map(plan => (
            <div key={plan._id} className="glass-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg" style={{ color: plan.color }}>{plan.name}</h3>
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
