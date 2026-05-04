import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Trash2, Mail, Phone, Crown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

export default function AgencyTeam() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const r = await api.get('/agency/team');
      setTeam(r.data.team);
    } catch (err) {
      toast.error('Failed to load team');
    }
    setLoading(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const r = await api.post('/agency/invite', inviteForm);
      setTeam([...team, r.data.user]);
      toast.success('Agent invited successfully!');
      setShowInvite(false);
      setInviteForm({ name: '', email: '', password: '', phone: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite agent');
    }
    setInviting(false);
  };

  const handleRemove = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from your agency?`)) return;
    try {
      await api.delete(`/agency/team/${id}`);
      setTeam(team.filter(t => t._id !== id));
      toast.success('Agent removed');
    } catch (err) {
      toast.error('Failed to remove agent');
    }
  };

  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return <div className="p-8">Only Agency Managers can access this page.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Agency Team</h1>
          <p className="text-secondary text-sm mt-2">Manage your agents and view team performance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <UserPlus size={16} /> Invite Agent
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center"><span className="spinner" /></div>
      ) : (
        <div className="grid grid-3">
          {team.map((agent, i) => (
            <motion.div
              key={agent._id}
              className="glass-card p-6 flex flex-col gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary m-0">{agent.name}</h4>
                    <span className="badge badge-new mt-1">Agent</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleRemove(agent._id, agent.name)}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-2 text-sm text-secondary">
                <div className="flex items-center gap-2"><Mail size={14}/> {agent.email}</div>
                <div className="flex items-center gap-2"><Phone size={14}/> {agent.phone || 'No phone'}</div>
                <div className="flex items-center gap-2 text-indigo mt-2">
                  <Crown size={14}/> Plan: <strong className="uppercase">{agent.plan}</strong>
                </div>
              </div>
            </motion.div>
          ))}
          {team.length === 0 && (
            <div className="empty-state col-span-3 p-8">
              <span className="empty-state-icon">👥</span>
              <h3>No agents yet</h3>
              <p>Invite agents to your team to start collaborating.</p>
              <button className="btn btn-primary mt-4" onClick={() => setShowInvite(true)}>Invite Agent</button>
            </div>
          )}
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
          <motion.div className="glass-card p-6 max-w-md w-full m-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <h3 className="mb-4">Invite Agent</h3>
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input required className="form-input" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input required type="email" className="form-input" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password *</label>
                <input required type="password" minLength={6} className="form-input" value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={inviteForm.phone} onChange={e => setInviteForm({...inviteForm, phone: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={inviting}>
                  {inviting ? <span className="spinner" /> : 'Send Invite'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
