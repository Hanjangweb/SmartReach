import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus, Trash2, Edit3, ArrowRight, Save, Clock, MessageSquare, Bot } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    triggerEvent: 'LeadCreated',
    actions: [{ type: 'Wait', delayValue: 1, delayUnit: 'Days', message: '' }]
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await api.get('/automations');
      setAutomations(res.data.automations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addAction = () => {
    setForm({ ...form, actions: [...form.actions, { type: 'SendWhatsApp', delayValue: 0, delayUnit: 'Days', message: '' }] });
  };

  const removeAction = (index) => {
    const newActions = [...form.actions];
    newActions.splice(index, 1);
    setForm({ ...form, actions: newActions });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...form.actions];
    newActions[index][field] = value;
    setForm({ ...form, actions: newActions });
  };

  const saveAutomation = async () => {
    if (!form.name) return toast.error('Name is required');
    if (form.actions.length === 0) return toast.error('At least one action is required');

    try {
      await api.post('/automations', form);
      toast.success('Automation created!');
      setShowModal(false);
      fetchAutomations();
      setForm({ name: '', triggerEvent: 'LeadCreated', actions: [{ type: 'Wait', delayValue: 1, delayUnit: 'Days', message: '' }] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create automation');
    }
  };

  const deleteAutomation = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/automations/${id}`);
      toast.success('Deleted');
      fetchAutomations();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (user?.plan === 'free') {
    return (
      <div className="empty-state p-12">
        <span className="empty-state-icon">⚡</span>
        <h3>Hyper-Automation Engine</h3>
        <p className="max-w-md mx-auto mt-2">Drip campaigns, automated follow-ups, and AI re-engagement are only available on the Pro and Advanced plans.</p>
        <button className="btn btn-primary mt-4" onClick={() => window.location.href = '/settings'}>Upgrade Plan</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hyper-Automations</h1>
          <p className="text-secondary text-sm mt-2">Create rule-based drip campaigns and automated workflows.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Automation
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><span className="spinner" style={{ width: 30, height: 30, borderWidth: 3 }} /></div>
      ) : automations.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🤖</span>
          <p>No automations active. Create your first sequence!</p>
          <button className="btn btn-primary btn-sm mt-4" onClick={() => setShowModal(true)}>Create Sequence</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {automations.map(auto => (
            <motion.div key={auto._id} className="glass-card p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-primary m-0 flex items-center gap-2">
                    <Zap size={16} className="text-amber" /> {auto.name}
                  </h3>
                  <div className="text-xs text-muted mt-1">Trigger: <strong className="text-emerald">{auto.triggerEvent}</strong></div>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${auto.isActive ? 'bg-success/20 text-success' : 'bg-white/10 text-muted'}`}>
                    {auto.isActive ? 'Active' : 'Paused'}
                  </span>
                  <button className="btn btn-secondary btn-icon btn-sm text-red-400" onClick={() => deleteAutomation(auto._id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4 relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-white/10" />
                {auto.actions.map((act, i) => (
                  <div key={i} className="flex gap-3 items-start relative z-10">
                    <div className="w-8 h-8 rounded-full bg-dark border-2 border-white/10 flex items-center justify-center flex-shrink-0 text-muted">
                      {act.type === 'Wait' ? <Clock size={14} /> : act.type === 'SendWhatsApp' ? <MessageSquare size={14} className="text-success" /> : <Bot size={14} className="text-indigo" />}
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex-1">
                      <div className="font-semibold text-sm">
                        {act.type === 'Wait' ? `Wait for ${act.delayValue} ${act.delayUnit}` : act.type === 'SendWhatsApp' ? 'Send WhatsApp Template' : 'Create AI Task'}
                      </div>
                      {act.message && <div className="text-xs text-muted mt-1 truncate">{act.message}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div className="glass-card p-6 max-w-2xl w-full m-auto my-8" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <h2 className="mb-6">Build Automation Sequence</h2>
            
            <div className="form-group">
              <label className="form-label">Sequence Name</label>
              <input className="form-input" placeholder="e.g., New Lead 7-Day Drip" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Trigger</label>
              <select className="form-select" value={form.triggerEvent} onChange={e => setForm({...form, triggerEvent: e.target.value})}>
                <option value="LeadCreated">When a New Lead is Created</option>
                <option value="StatusChangedToCold">When a Lead status becomes Cold</option>
                <option value="ScoreChangedToHot">When Lead Score becomes Hot</option>
              </select>
            </div>

            <div className="mt-8 mb-4">
              <h4 className="text-primary border-b border-white/10 pb-2">Sequence Steps</h4>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              {form.actions.map((act, index) => (
                <div key={index} className="flex gap-3 items-start bg-black/20 p-4 rounded-xl border border-white/5 relative group flex-wrap">
                  <button
                    className="absolute -right-2 -top-2 w-6 h-6 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 size={12} />
                  </button>
                  
                  <div className="form-group m-0" style={{ width: 'clamp(120px, 30%, 180px)' }}>
                    <label className="text-xs text-muted">Action Type</label>
                    <select className="form-select form-select-sm" value={act.type} onChange={e => updateAction(index, 'type', e.target.value)}>
                      <option value="Wait">⏳ Wait / Delay</option>
                      <option value="SendWhatsApp">💬 Send WhatsApp</option>
                      <option value="CreateTask">✅ Create Task/Reminder</option>
                    </select>
                  </div>

                  {act.type === 'Wait' ? (
                    <div className="flex gap-2 flex-1 items-end" style={{ minWidth: 160 }}>
                      <div className="form-group m-0 flex-1">
                        <label className="text-xs text-muted">Value</label>
                        <input type="number" className="form-input form-input-sm" value={act.delayValue} onChange={e => updateAction(index, 'delayValue', e.target.value)} />
                      </div>
                      <div className="form-group m-0 flex-1">
                        <label className="text-xs text-muted">Unit</label>
                        <select className="form-select form-select-sm" value={act.delayUnit} onChange={e => updateAction(index, 'delayUnit', e.target.value)}>
                          <option value="Hours">Hours</option>
                          <option value="Days">Days</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group flex-1 m-0" style={{ minWidth: 160 }}>
                      <label className="text-xs text-muted">Message Template</label>
                      <textarea className="form-input form-input-sm min-h-[60px]" placeholder="Type your message here..." value={act.message} onChange={e => updateAction(index, 'message', e.target.value)} />
                    </div>
                  )}
                </div>
              ))}

              <button className="btn btn-secondary border border-dashed border-white/20 w-full flex justify-center py-4 text-muted hover:text-primary hover:border-white/40" onClick={addAction}>
                <Plus size={16} className="mr-2" /> Add Next Step
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAutomation}><Save size={16} /> Save Automation</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
