import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, CheckCircle, Clock, Flame, Thermometer, Snowflake, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import StatusBadge from '../components/Leads/StatusBadge';
import './Dashboard.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#38bdf8', '#8b5cf6'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

function StatCard({ icon: Icon, label, value, color, index }) {
  return (
    <motion.div className="stat-card glass-card" custom={index} variants={cardVariants} initial="hidden" animate="visible">
      <div className="stat-card-icon" style={{ background: `${color}20`, color }}>
        <Icon size={22} />
      </div>
      <div className="stat-card-content">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-value">{value}</span>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const SALES_TIPS = [
  "Call your leads within 5 minutes. The odds of qualifying a lead drop 80% after just 5 minutes.",
  "Follow up at least 6 times. 80% of sales require 5 follow-up calls after the meeting.",
  "Use text messages to confirm appointments. It reduces no-shows by 40%.",
  "Don't just sell the property; sell the neighborhood, the schools, and the lifestyle.",
  "Always ask open-ended questions. 'What are you looking for?' is better than 'Do you want a 3BHK?'",
  "Your best leads are your past clients. Ask for referrals 30 days after closing.",
  "Send a quick video introduction before the site visit. It builds massive trust.",
  "Focus on the 'Why'. If you know why they are moving, you know how to close them.",
  "Keep your CRM updated daily. A messy database means lost commission.",
  "Listen 70% of the time, speak 30%. The client should be doing the talking.",
  "Don't assume their budget is fixed. Buyers often stretch their budget by 10-15% for the perfect home.",
  "Mondays and Tuesdays are historically the worst days to cold call. Try Thursday afternoons.",
  "Send a hand-written 'Thank You' note after a site visit. It instantly separates you from 99% of agents.",
  "When a client says 'Let me think about it', ask: 'What specifically do you need to think about?'",
  "Provide a comparative market analysis (CMA) even if they don't ask. It shows authority.",
  "Respond to WhatsApp messages instantly. Speed builds trust.",
  "Always have 3 alternative properties ready to show if the first one fails.",
  "Create a sense of urgency, but don't be pushy. Point out market trends and rising prices.",
  "Use the 'Feel, Felt, Found' method for handling objections.",
  "Dress 10% better than your client. It commands subconscious respect.",
  "Never bash the competition. Focus entirely on the unique value you provide.",
  "Follow up on weekends. Many buyers only have time to think about real estate on Sundays.",
  "Keep your phone charged and always carry a power bank. A dead phone is a lost deal.",
  "A 'No' today is often a 'Yes' in 6 months. Put them on a long-term drip campaign.",
  "Record your sales calls and listen back to them. It's the fastest way to improve.",
  "Before quoting a price, always build up the value of the property first.",
  "Treat every lead like a $1M buyer. The best investors often dress the most casually.",
  "Ask for the close. 'Would you like to move forward with the paperwork today?'",
  "If they go silent, send a breakup text: 'Have you given up on finding a property in Noida?'",
  "Stay positive. Real estate is a numbers game; every rejection brings you closer to a close.",
  "Your network is your net worth. Spend 1 hour a week networking with other brokers."
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        setStats(res.data.stats);
        if (res.data.stats && user?.plan !== 'free') {
          api.post('/dashboard/insight', {
            totalLeads: res.data.stats.totalLeads,
            newLeads: res.data.stats.newLeads,
            closedDeals: res.data.stats.closedLeads,
            conversionRate: res.data.stats.conversionRate
          }).then(insightRes => setInsight(insightRes.data.insight)).catch(() => {});
        } else if (user?.plan === 'free') {
          setInsight("Upgrade to Pro/Advanced to unlock AI Pipeline Insights!");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div>
      <div className="page-header"><div className="skeleton" style={{ width: 200, height: 36 }} /></div>
      <div className="grid grid-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
      </div>
      <div className="grid grid-2">
        {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}
      </div>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todaysTip = SALES_TIPS[(new Date().getDate() - 1) % SALES_TIPS.length];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-secondary text-sm mt-2">Here's your lead pipeline overview</p>
        </div>
      </div>

      <div className="grid grid-2 mb-6">
        {/* Daily Sales Tip Widget */}
        <motion.div className="glass-card p-4 border border-blue-500/20" style={{ background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05), transparent)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h4 className="text-blue-400 font-bold mb-1">Daily Agent Tip</h4>
              <p className="text-sm text-secondary leading-relaxed font-medium italic">"{todaysTip}"</p>
            </div>
          </div>
        </motion.div>

        {/* AI Insight Widget */}
        <motion.div className="glass-card p-4 border border-emerald/20" style={{ background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.01))' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald/20 flex items-center justify-center text-emerald flex-shrink-0 mt-1">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-emerald font-bold mb-1">AI Pipeline Insight</h4>
              {insight ? (
                <p className="text-sm text-secondary leading-relaxed">{insight}</p>
              ) : (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <span className="spinner w-4 h-4" /> Analyzing your pipeline...
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4 mb-6">
        <StatCard icon={Users} label="Total Leads" value={stats?.totalLeads ?? 0} color="#6366f1" index={0} />
        <StatCard icon={Clock} label="New Leads" value={stats?.newLeads ?? 0} color="#38bdf8" index={1} />
        <StatCard icon={CheckCircle} label="Closed Deals" value={stats?.closedLeads ?? 0} color="#10b981" index={2} />
        <StatCard icon={TrendingUp} label="Conversion" value={`${stats?.conversionRate ?? 0}%`} color="#f59e0b" index={3} />
      </div>

      {/* Lead Score Row */}
      <div className="grid grid-3 mb-6">
        <motion.div className="score-card glass-card hot" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
          <Flame size={28} /> <div><span className="score-num">{stats?.leadScores?.hot ?? 0}</span><span className="score-name">Hot Leads 🔥</span></div>
        </motion.div>
        <motion.div className="score-card glass-card warm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.42 }}>
          <Thermometer size={28} /> <div><span className="score-num">{stats?.leadScores?.warm ?? 0}</span><span className="score-name">Warm Leads 🌤️</span></div>
        </motion.div>
        <motion.div className="score-card glass-card cold" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.49 }}>
          <Snowflake size={28} /> <div><span className="score-num">{stats?.leadScores?.cold ?? 0}</span><span className="score-name">Cold Leads ❄️</span></div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-2 mb-6">
        {/* Monthly trend */}
        <motion.div className="glass-card p-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="mb-4">Monthly Leads</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.monthlyStats ?? []}>
              <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="closed" fill="#10b981" radius={[4, 4, 0, 0]} name="Closed" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Lead Source Pie */}
        <motion.div className="glass-card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
          <h3 className="mb-4">Lead Sources</h3>
          {stats?.sourceStats?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.sourceStats} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={80} label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {stats.sourceStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 220 }}>
              <span className="empty-state-icon">📊</span>
              <p>No data yet — add leads to see sources</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Leads */}
      <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h3>Recent Leads</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/leads')}>
            View all <ArrowRight size={14} />
          </button>
        </div>

        {stats?.recentLeads?.length ? (
          <div className="recent-leads-list">
            {stats.recentLeads.map((lead, i) => (
              <div key={lead._id} className="recent-lead-item" onClick={() => navigate(`/leads/${lead._id}`)} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="avatar" style={{ width: 38, height: 38, fontSize: '0.82rem' }}>
                  {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-width-0">
                  <p className="font-semibold text-primary truncate">{lead.name}</p>
                  <p className="text-xs text-secondary">{lead.propertyType} • {lead.location || 'No location'} • ₹{lead.budget || '?'}L</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={lead.status} />
                  <span className="text-xs text-muted">{new Date(lead.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon">🏠</span>
            <p>No leads yet</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/leads/add')}>Add your first lead</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
