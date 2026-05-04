import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Briefcase, TrendingUp, User, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './Deals.css';

export default function Deals() {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState([]);
  const [totals, setTotals] = useState({ totalSales: 0, totalAgencyRevenue: 0, totalAgentCommission: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deals');
      setDeals(res.data.deals);
      setTotals(res.data.totals);
    } catch (err) {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id) => {
    if (!confirm('Mark this deal commission as Paid?')) return;
    try {
      await api.put(`/deals/${id}/status`, { status: 'Paid' });
      toast.success('Deal marked as paid');
      fetchDeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update deal');
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val * 100000); // Assuming values are in Lakhs
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading financial data...</div>;

  return (
    <div className="deals-container">
      <div className="page-header">
        <div>
          <h1>Commissions & Deals</h1>
          <p className="text-secondary text-sm mt-2">Track closed deals and agency revenue</p>
        </div>
      </div>

      <div className="deals-stats-grid">
        <div className="deal-stat-card">
          <div className="flex justify-between items-center">
            <span className="deal-stat-label">Total Sales Volume</span>
            <Briefcase size={20} className="text-muted" />
          </div>
          <span className="deal-stat-value primary">{formatMoney(totals.totalSales)}</span>
        </div>
        <div className="deal-stat-card">
          <div className="flex justify-between items-center">
            <span className="deal-stat-label">Total Agency Revenue</span>
            <TrendingUp size={20} className="text-emerald" />
          </div>
          <span className="deal-stat-value success">{formatMoney(totals.totalAgencyRevenue)}</span>
        </div>
        <div className="deal-stat-card">
          <div className="flex justify-between items-center">
            <span className="deal-stat-label">Agent Commissions</span>
            <DollarSign size={20} className="text-amber" />
          </div>
          <span className="deal-stat-value warning">{formatMoney(totals.totalAgentCommission)}</span>
        </div>
      </div>

      <h3 className="mb-4">Recent Deals</h3>
      <div className="deals-table-container">
        <table className="deals-table">
          <thead>
            <tr>
              <th>Lead / Client</th>
              <th>Agent</th>
              <th>Sale Value</th>
              <th>Agency Rev</th>
              <th>Agent Com</th>
              <th>Status</th>
              {user?.role === 'admin' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted p-8">No deals closed yet. Time to hit the phones!</td>
              </tr>
            ) : deals.map((deal) => (
              <tr key={deal._id}>
                <td>
                  <div className="font-semibold">{deal.lead?.name || 'Unknown'}</div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted" />
                    <span>{deal.agent?.name || 'Unknown'}</span>
                  </div>
                </td>
                <td className="font-semibold text-primary">₹{deal.saleValue}L</td>
                <td className="font-semibold text-emerald">₹{deal.agencyRevenue}L</td>
                <td className="font-semibold text-amber">₹{deal.agentCommission}L</td>
                <td>
                  <span className={`deal-status-badge ${deal.status.toLowerCase()}`}>
                    {deal.status}
                  </span>
                </td>
                {user?.role === 'admin' && (
                  <td>
                    {deal.status === 'Pending' && (
                      <button className="btn btn-primary btn-sm" onClick={() => markAsPaid(deal._id)}>
                        <CheckCircle size={14} /> Mark Paid
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
