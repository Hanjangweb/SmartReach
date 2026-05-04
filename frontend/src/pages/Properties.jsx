import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Edit3, Trash2, Home, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './Properties.css';

export default function Properties() {
  const { user } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    type: 'Apartment',
    price: '',
    location: '',
    description: '',
    status: 'Available',
  });

  useEffect(() => {
    fetchProperties();
  }, [filterType]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties', {
        params: { type: filterType, search }
      });
      setProperties(res.data.properties);
    } catch (err) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/properties/${editingId}`, form);
        setProperties(properties.map(p => p._id === editingId ? res.data.property : p));
        toast.success('Property updated');
      } else {
        const res = await api.post('/properties', form);
        setProperties([res.data.property, ...properties]);
        toast.success('Property added');
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save property');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setProperties(properties.filter(p => p._id !== id));
      toast.success('Property deleted');
    } catch (err) {
      toast.error('Failed to delete property');
    }
  };

  const handleEdit = (prop) => {
    setForm({
      title: prop.title,
      type: prop.type,
      price: prop.price,
      location: prop.location,
      description: prop.description,
      status: prop.status,
    });
    setEditingId(prop._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ title: '', type: 'Apartment', price: '', location: '', description: '', status: 'Available' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Property Catalog</h1>
          <p className="text-secondary text-sm mt-2">Manage your property inventory and listings</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Property
        </button>
      </div>

      {showForm && (
        <motion.div className="glass-card-elevated p-6 mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="mb-4">{editingId ? 'Edit Property' : 'Add New Property'}</h3>
          <form onSubmit={handleSave} className="form-grid">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input required type="text" className="form-input" placeholder="e.g. Luxury 3BHK in Sector 62" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {['Apartment', 'Villa', 'Plot', 'Commercial', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price (in Lakhs) *</label>
              <input required type="number" step="0.1" className="form-input" placeholder="e.g. 75.5" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input required type="text" className="form-input" placeholder="City, Area" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {['Available', 'Sold', 'Off Market'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Description *</label>
              <textarea required className="form-textarea" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
            </div>
            <div className="col-span-2 flex gap-3 mt-2">
              <button type="submit" className="btn btn-primary">{editingId ? 'Update Property' : 'Save Property'}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="flex gap-4 mb-6 flex-wrap">
        <form onSubmit={handleSearch} className="filter-search flex-1" style={{ minWidth: 250 }}>
          <Search size={16} className="filter-icon" />
          <input type="text" className="filter-input" placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} />
        </form>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted" />
          <select className="form-select form-select-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {['Apartment', 'Villa', 'Plot', 'Commercial'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">Loading properties...</div>
      ) : (
        <div className="properties-grid">
          {properties.map(prop => (
            <motion.div key={prop._id} className="property-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="property-image">
                {prop.images?.length > 0 ? (
                  <img src={prop.images[0]} alt={prop.title} />
                ) : (
                  <div className="flex flex-col items-center opacity-50"><Home size={32} /><span>No Image</span></div>
                )}
                <span className={`property-status ${prop.status.toLowerCase().replace(' ', '-')}`}>{prop.status}</span>
              </div>
              <div className="property-content">
                <h3 className="property-title">{prop.title}</h3>
                <p className="property-location"><MapPin size={14} /> {prop.location}</p>
                <div className="property-price">₹{prop.price} Lakhs</div>
                
                <div className="property-footer">
                  <span className="property-type">{prop.type}</span>
                  {(prop.agent?._id === user?._id || user?.role === 'admin') && (
                    <div className="flex gap-2">
                      <button className="action-btn edit-btn" onClick={() => handleEdit(prop)}><Edit3 size={16} /></button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(prop._id)}><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted border border-dashed border-border rounded-lg">
              <Home size={48} className="mx-auto mb-4 opacity-50" />
              <p>No properties found. Add your first listing!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
