import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useLeadStore from '../store/leadStore';
import './AddLead.css';

const PROPERTY_TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Plot', 'Commercial', 'Other'];
const SOURCES = ['Direct', 'Facebook', '99acres', 'MagicBricks', 'Housing', 'Referral', 'Instagram', 'Other'];
const STATUSES = ['New', 'Contacted', 'Negotiation', 'SiteVisit', 'Closed', 'Lost'];

const EMPTY = {
  name: '', phone: '', email: '', propertyType: '2BHK', budget: '',
  location: '', requirement: '', source: 'Direct', status: 'New', followUpDate: '', tags: '',
};

export default function AddLead() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { createLead, updateLead, fetchLead } = useLeadStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      fetchLead(id).then((lead) => {
        if (lead) setForm({
          name: lead.name || '',
          phone: lead.phone || '',
          email: lead.email || '',
          propertyType: lead.propertyType || '2BHK',
          budget: lead.budget || '',
          location: lead.location || '',
          requirement: lead.requirement || '',
          source: lead.source || 'Direct',
          status: lead.status || 'New',
          followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
          tags: (lead.tags || []).join(', '),
        });
      });
    }
  }, [id]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Name and phone are required'); return; }

    setSaving(true);
    const data = {
      ...form,
      budget: Number(form.budget) || 0,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      followUpDate: form.followUpDate || null,
    };

    const result = isEdit ? await updateLead(id, data) : await createLead(data);
    setSaving(false);

    if (result.success) {
      toast.success(isEdit ? 'Lead updated!' : 'Lead added!');
      navigate(isEdit ? `/leads/${id}` : '/leads');
    } else {
      toast.error(result.message || 'Failed to save');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <h1>{isEdit ? 'Edit Lead' : 'Add New Lead'}</h1>
        </div>
      </div>

      <motion.form
        className="add-lead-form glass-card-elevated p-8"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="form-section">
          <h3 className="form-section-title">👤 Contact Information</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Rahul Kumar" value={form.name} onChange={(e) => set('name', e.target.value)} required id="lead-name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className="form-input" placeholder="9876543210" value={form.phone} onChange={(e) => set('phone', e.target.value)} required id="lead-phone" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="rahul@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} id="lead-email" />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select className="form-select" value={form.source} onChange={(e) => set('source', e.target.value)} id="lead-source">
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">🏠 Property Requirement</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select className="form-select" value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)} id="lead-property-type">
                {PROPERTY_TYPES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Budget (₹ Lakhs)</label>
              <input className="form-input" type="number" placeholder="80" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} id="lead-budget" />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Location</label>
              <input className="form-input" placeholder="Noida Sector 62" value={form.location} onChange={(e) => set('location', e.target.value)} id="lead-location" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value)} id="lead-status">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Requirement Details</label>
            <textarea className="form-textarea" placeholder="Client wants 2BHK near metro, ready to move, south facing..." value={form.requirement} onChange={(e) => set('requirement', e.target.value)} id="lead-requirement" />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">📅 Follow-up & Tags</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input className="form-input" type="date" value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} id="lead-followup-date" />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" placeholder="urgent, high-budget, NRI" value={form.tags} onChange={(e) => set('tags', e.target.value)} id="lead-tags" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving} id="lead-save-btn">
            {saving ? <span className="spinner" /> : <><Save size={18} /> {isEdit ? 'Update Lead' : 'Save Lead'}</>}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
