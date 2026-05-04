import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Copy, MessageSquare, Bot } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './Templates.css';

const CATEGORIES = [
  { id: 'first-contact', label: '👋 First Contact' },
  { id: 'follow-up', label: '📞 Follow-up' },
  { id: 'site-visit', label: '🏢 Site Visit' },
  { id: 'negotiation', label: '💬 Negotiation' },
  { id: 'close', label: '🎉 Close' },
  { id: 'loss-recovery', label: '🔄 Loss Recovery' },
];

export default function TemplatesManager() {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('first-contact');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'first-contact',
    content: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates', { params: { category: selectedCategory } });
      setTemplates(res.data.templates || []);
    } catch (err) {
      toast.error('Failed to fetch templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const generateTemplate = async () => {
    if (!form.name) {
      toast.error('Please enter a Template Name first');
      return;
    }
    
    if (user?.plan === 'free') {
      toast.error('AI Template Generation is a Pro feature!', { icon: '✨' });
      return;
    }

    setAiGenerating(true);
    try {
      const res = await api.post('/ai/generate-template', {
        name: form.name,
        category: CATEGORIES.find(c => c.id === form.category)?.label || form.category
      });
      setForm({ ...form, content: res.data.content });
      toast.success('Template generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate template');
    }
    setAiGenerating(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.content) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      if (editingId) {
        const res = await api.put(`/templates/${editingId}`, form);
        setTemplates(templates.map((t) => (t._id === editingId ? res.data.template : t)));
        toast.success('Template updated!');
      } else {
        const res = await api.post('/templates', form);
        setTemplates([...templates, res.data.template]);
        toast.success('Template created!');
      }
      setForm({ name: '', category: 'first-contact', content: '' });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      toast.error(editingId ? 'Failed to update template' : 'Failed to create template');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;

    try {
      await api.delete(`/templates/${id}`);
      setTemplates(templates.filter((t) => t._id !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const handleEdit = (template) => {
    setForm({
      name: template.name,
      category: template.category,
      content: template.content,
    });
    setEditingId(template._id);
    setShowForm(true);
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copied to clipboard!');
  };

  const systemTemplates = templates.filter((t) => t.isSystem);
  const customTemplates = templates.filter((t) => !t.isSystem && t.agent);
  const premiumTemplates = templates.filter((t) => t.isPremium);

  if (!user?.plan || user.plan === 'free') {
    return (
      <div className="templates-locked">
        <div className="page-header">
          <h1>Message Templates</h1>
        </div>
        <div className="lock-message glass-card-elevated p-8 text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-purple" />
          <h3>Pro Feature</h3>
          <p className="text-secondary mt-2">
            Premium templates are available on Pro and Premium plans
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
          <h1>Message Templates</h1>
          <p className="text-secondary text-sm mt-2">
            Create reusable message templates for faster communication
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Add Template Form */}
      {showForm && (
        <motion.div
          className="glass-card-elevated p-6 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="mb-4">{editingId ? 'Edit Template' : 'Create New Template'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., First Contact Inquiry"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">Message Content *</label>
                <button 
                  className="btn btn-sm btn-secondary text-indigo"
                  onClick={generateTemplate}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? <span className="spinner" /> : <><Bot size={14} /> Generate with AI</>}
                </button>
              </div>
              <textarea
                className="form-textarea"
                placeholder="Type your message template here... You can use {{name}}, {{property}}, {{budget}} variables"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows="6"
              />
              <p className="text-xs text-muted mt-2">
                💡 Tip: Use {'{{name}}'}, {'{{phone}}'}, {'{{property}}'}, {'{{budget}}'}, {'{{location}}'} for dynamic fields
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn btn-primary" onClick={handleSave}>
              {editingId ? 'Update Template' : 'Create Template'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm({ name: '', category: 'first-contact', content: '' });
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted">Loading templates...</div>
      ) : (
        <>
          {/* System Templates */}
          {systemTemplates.length > 0 && (
            <div className="templates-section">
              <h4 className="section-title">📌 System Templates</h4>
              <div className="templates-grid">
                {systemTemplates.map((template) => (
                  <motion.div
                    key={template._id}
                    className="template-card system"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="template-header">
                      <h4>{template.name}</h4>
                      {template.usageCount > 0 && (
                        <span className="badge">{template.usageCount} uses</span>
                      )}
                    </div>
                    <p className="template-content">{template.content}</p>
                    <div className="template-footer">
                      <button
                        className="action-btn copy-btn"
                        onClick={() => handleCopy(template.content)}
                        title="Copy"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Premium Templates */}
          {premiumTemplates.length > 0 && user.plan !== 'free' && (
            <div className="templates-section">
              <h4 className="section-title">✨ Premium Templates</h4>
              <div className="templates-grid">
                {premiumTemplates.map((template) => (
                  <motion.div
                    key={template._id}
                    className="template-card premium"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="template-header">
                      <h4>{template.name}</h4>
                      <span className="badge badge-premium">Premium</span>
                    </div>
                    <p className="template-content">{template.content}</p>
                    <div className="template-footer">
                      <button
                        className="action-btn copy-btn"
                        onClick={() => handleCopy(template.content)}
                        title="Copy"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Templates */}
          {customTemplates.length > 0 && (
            <div className="templates-section">
              <h4 className="section-title">📝 Your Custom Templates</h4>
              <div className="templates-grid">
                {customTemplates.map((template) => (
                  <motion.div
                    key={template._id}
                    className="template-card custom"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="template-header">
                      <h4>{template.name}</h4>
                    </div>
                    <p className="template-content">{template.content}</p>
                    <div className="template-footer">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(template)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn copy-btn"
                        onClick={() => handleCopy(template.content)}
                        title="Copy"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(template._id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {templates.length === 0 && (
            <div className="empty-state">
              <MessageSquare size={48} className="mx-auto mb-4 text-muted" />
              <p className="text-secondary">No templates in this category yet</p>
              {!showForm && (
                <button
                  className="btn btn-primary mt-4"
                  onClick={() => setShowForm(true)}
                >
                  Create your first template
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
