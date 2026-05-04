import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, UserPlus, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useLeadStore from '../store/leadStore';
import useAuthStore from '../store/authStore';
import './AIExtract.css';

const SAMPLE_TEXTS = [
  `Hi, I'm looking for a 2BHK flat in Noida Sector 62 under 70 lakh. My name is Rahul Verma and you can reach me at 9876543210. I got your number from 99acres.`,
  `Priya here - 9988776655. Want to buy 3BHK villa in Gurgaon. Budget around 1.5 crore. Saw your ad on Facebook.`,
];

export default function AIExtract() {
  const [text, setText] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
   const { createLead } = useLeadStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleExtract = async () => {
    if (user?.plan === 'free') {
      toast.error('AI Lead Extraction requires a Pro plan!', { icon: '✨' });
      return;
    }
    if (!text.trim()) { toast.error('Paste some text first'); return; }
    setLoading(true);
    setExtracted(null);
    try {
      const r = await api.post('/ai/extract', { text });
      setExtracted(r.data.extracted);
      toast.success('Lead extracted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Extraction failed');
    }
    setLoading(false);
  };

  const handleSaveLead = async () => {
    if (!extracted) return;
    setSaving(true);
    const data = {
      name: extracted.name || 'Unknown',
      phone: (extracted.phone || '').toString().replace(/\D/g, ''),
      email: extracted.email || '',
      propertyType: extracted.propertyType || 'Other',
      budget: parseFloat(extracted.budget) || 0,
      location: extracted.location || '',
      requirement: extracted.requirement || '',
      source: extracted.source || 'Direct',
      status: 'New',
    };
    const r = await createLead(data);
    setSaving(false);
    if (r.success) {
      toast.success('Lead saved!');
      navigate(`/leads/${r.lead._id}`);
    } else {
      toast.error(r.message || 'Failed to save');
    }
  };

  const update = (k, v) => setExtracted((prev) => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Lead Extractor</h1>
          <p className="text-secondary text-sm mt-2">Paste a WhatsApp message or DM — AI will extract lead info automatically</p>
        </div>
      </div>

      <div className="extract-grid">
        {/* Input */}
        <motion.div className="glass-card-elevated p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Bot size={20} className="text-indigo" />
            <h3>Paste Message</h3>
          </div>

          {/* Sample buttons */}
          <div className="sample-btns mb-4">
            <span className="text-xs text-muted">Try a sample:</span>
            {SAMPLE_TEXTS.map((s, i) => (
              <button key={i} className="btn btn-secondary btn-sm" onClick={() => setText(s)} id={`sample-${i}`}>
                Sample {i + 1}
              </button>
            ))}
          </div>

          <textarea
            className="form-textarea extract-textarea"
            placeholder={`Paste WhatsApp message, Instagram DM, or any lead text here...\n\nExample:\n"Hi, I'm looking for a 2BHK in Noida under 70L. Name is Rahul, phone 9876543210"`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            id="extract-input"
          />

          <div className="flex gap-3 mt-4">
            <button className="btn btn-primary btn-lg flex-1" onClick={handleExtract} disabled={loading || !text.trim()} id="extract-btn">
              {loading ? <><span className="spinner" /> Analyzing...</> : <><Sparkles size={18} /> Extract Lead Info</>}
            </button>
            {text && <button className="btn btn-secondary" onClick={() => { setText(''); setExtracted(null); }}>Clear</button>}
          </div>
        </motion.div>

        {/* Extracted Result */}
        {extracted && (
          <motion.div className="glass-card-elevated p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Check size={20} className="text-emerald" />
                <h3>Extracted Data</h3>
              </div>
              <span className="badge badge-closed">✓ Ready to Save</span>
            </div>

            <div className="extracted-fields">
              {[
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'location', label: 'Location', type: 'text' },
                { key: 'budget', label: 'Budget (₹ Lakhs)', type: 'number' },
                { key: 'requirement', label: 'Requirement', type: 'text' },
              ].map(({ key, label, type }) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input"
                    type={type}
                    value={extracted[key] || ''}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={`${label} not found`}
                    id={`ext-${key}`}
                  />
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select className="form-select" value={extracted.propertyType || 'Other'} onChange={(e) => update('propertyType', e.target.value)} id="ext-property">
                  {['1BHK','2BHK','3BHK','4BHK','Villa','Plot','Commercial','Other'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Source</label>
                <select className="form-select" value={extracted.source || 'Direct'} onChange={(e) => update('source', e.target.value)} id="ext-source">
                  {['Direct','Facebook','99acres','MagicBricks','Housing','Referral','Instagram','Other'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-full btn-lg mt-4" onClick={handleSaveLead} disabled={saving} id="save-extracted-btn">
              {saving ? <span className="spinner" /> : <><UserPlus size={18} /> Save as Lead</>}
            </button>
          </motion.div>
        )}

        {!extracted && !loading && (
          <motion.div className="glass-card-elevated p-6 extract-how" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 className="mb-4">How it works</h3>
            <div className="how-steps">
              <div className="how-step"><span className="how-num">1</span><p>Paste any WhatsApp message, Instagram DM, or lead inquiry text in the box</p></div>
              <div className="how-step"><span className="how-num">2</span><p>AI analyzes the text and extracts: Name, Phone, Budget, Location, Property type</p></div>
              <div className="how-step"><span className="how-num">3</span><p>Review and edit the extracted info, then save as a lead in one click</p></div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
