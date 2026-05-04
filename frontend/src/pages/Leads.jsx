import { useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Phone, MapPin, IndianRupee, Trash2, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useLeadStore from '../store/leadStore';
import StatusBadge, { ScoreBadge } from '../components/Leads/StatusBadge';
import './Leads.css';

const STATUSES = ['', 'New', 'Contacted', 'Negotiation', 'SiteVisit', 'Closed', 'Lost'];
const SOURCES = ['', 'Facebook', '99acres', 'MagicBricks', 'Housing', 'Referral', 'Instagram', 'Direct', 'Other'];
const SCORES = ['', 'Hot', 'Warm', 'Cold', 'Unscored'];

export default function Leads() {
  const { user } = useAuthStore();
  const { leads, pagination, filters, isLoading, fetchLeads, setFilters, deleteLead } = useLeadStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) setFilters({ search });
  }, []);

  useEffect(() => { fetchLeads(pagination.page); }, [filters]);

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`Archive lead "${name}"?`)) return;
    const r = await deleteLead(id);
    r.success ? toast.success('Lead archived') : toast.error('Failed');
  };

  const handleSearch = useCallback((e) => {
    setFilters({ search: e.target.value });
  }, []);

  const exportToCSV = () => {
    if (user?.plan === 'free') {
      toast.error('CSV Export requires the Pro plan!', { icon: '✨' });
      return;
    }
    
    if (leads.length === 0) {
      toast.error('No leads to export');
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Property Type', 'Budget (Lakhs)', 'Location', 'Status', 'Source', 'Lead Score', 'Created At'];
    
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => {
        return [
          `"${lead.name || ''}"`,
          `"${lead.phone || ''}"`,
          `"${lead.email || ''}"`,
          `"${lead.propertyType || ''}"`,
          lead.budget || 0,
          `"${lead.location || ''}"`,
          `"${lead.status || ''}"`,
          `"${lead.source || ''}"`,
          lead.leadScore || 0,
          `"${new Date(lead.createdAt).toLocaleDateString('en-IN')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported successfully!');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Leads</h1>
          <p className="text-secondary text-sm mt-2">{pagination.total} total leads</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="leads-filters glass-card mb-6">
        <div className="filter-search">
          <Search size={16} className="filter-icon" />
          <input
            type="text"
            placeholder="Search by name, phone, location..."
            className="filter-input"
            value={filters.search}
            onChange={handleSearch}
            id="leads-search"
          />
        </div>

        <div className="filter-selects">
          <select className="form-select filter-select" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} id="filter-status">
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Status'}</option>)}
          </select>
          <select className="form-select filter-select" value={filters.source} onChange={(e) => setFilters({ source: e.target.value })} id="filter-source">
            {SOURCES.map((s) => <option key={s} value={s}>{s || 'All Sources'}</option>)}
          </select>
          <select className="form-select filter-select" value={filters.leadScore} onChange={(e) => setFilters({ leadScore: e.target.value })} id="filter-score">
            {SCORES.map((s) => <option key={s} value={s}>{s || 'All Scores'}</option>)}
          </select>
        </div>
      </div>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="grid grid-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 190 }} />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="empty-state glass-card p-8">
          <span className="empty-state-icon">🔍</span>
          <h3>No leads found</h3>
          <p>Try adjusting filters or add a new lead</p>
          <button className="btn btn-primary" onClick={() => navigate('/leads/add')}><Plus size={16} /> Add Lead</button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-3">
            {leads.map((lead, i) => (
              <motion.div
                key={lead._id}
                className="lead-card glass-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/leads/${lead._id}`)}
              >
                <div className="lead-card-header">
                  <div className="avatar">{lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-width-0">
                    <p className="font-semibold text-primary truncate">{lead.name}</p>
                    <div className="flex items-center gap-1 text-secondary text-xs">
                      <Phone size={11} /> <span>{lead.phone}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={lead.status} />
                    <ScoreBadge score={lead.leadScore} />
                  </div>
                </div>

                <div className="lead-card-body">
                  <div className="lead-info-row">
                    {user?.role === 'admin' && lead.agent && (
                      <span className="lead-info-pill" style={{backgroundColor: 'var(--primary)', color: 'white'}}>
                        👤 {lead.agent.name || 'Unknown Agent'}
                      </span>
                    )}
                    <span className="lead-info-pill">🏠 {lead.propertyType}</span>
                    {lead.budget > 0 && <span className="lead-info-pill"><IndianRupee size={11} />{lead.budget}L</span>}
                    {lead.source && <span className="lead-info-pill">{lead.source}</span>}
                  </div>
                  {lead.location && (
                    <div className="flex items-center gap-1 text-secondary text-xs">
                      <MapPin size={11} /> {lead.location}
                    </div>
                  )}
                  {lead.followUpDate && (
                    <div className="lead-followup">
                      🔔 Follow-up: {new Date(lead.followUpDate).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>

                <div className="lead-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm flex-1" onClick={() => navigate(`/leads/${lead._id}`)}>
                    <Eye size={14} /> View
                  </button>
                  <a
                    href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}?text=Hi ${lead.name}, `}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success btn-sm"
                    title="Open WhatsApp"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={(e) => handleDelete(lead._id, lead.name, e)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="leads-pagination">
          <button className="btn btn-secondary btn-sm" disabled={pagination.page === 1} onClick={() => fetchLeads(pagination.page - 1)}>
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-secondary text-sm">Page {pagination.page} of {pagination.pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={pagination.page === pagination.pages} onClick={() => fetchLeads(pagination.page + 1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
