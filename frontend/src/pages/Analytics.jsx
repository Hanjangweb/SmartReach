import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Flame, MapPin, Home } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './Analytics.css';

export default function Analytics() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [funnel, setFunnel] = useState(null);
  const [conversionRate, setConversionRate] = useState(0);
  const [sourceROI, setSourceROI] = useState([]);
  const [responseTime, setResponseTime] = useState(null);
  const [propertyPerformance, setPropertyPerformance] = useState(null);
  const [hotLeads, setHotLeads] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [funnelRes, sourceRes, responseRes, propertyRes, hotRes] = await Promise.all([
        api.get('/analytics/funnel'),
        api.get('/analytics/source-roi'),
        api.get('/analytics/response-time'),
        api.get('/analytics/property-performance'),
        api.get('/analytics/hot-leads'),
      ]);

      setFunnel(funnelRes.data.funnel);
      setConversionRate(funnelRes.data.conversionRate);
      setSourceROI(sourceRes.data.sourceROI);
      setResponseTime(responseRes.data.responseTime);
      setPropertyPerformance(propertyRes.data);
      setHotLeads(hotRes.data.hotLeads);
    } catch (err) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.plan || user.plan === 'free') {
    return (
      <div className="analytics-locked">
        <div className="page-header">
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="lock-message glass-card-elevated p-8 text-center">
          <Flame size={48} className="mx-auto mb-4 text-amber" />
          <h3>Premium Feature</h3>
          <p className="text-secondary mt-2">
            Advanced analytics is available on Pro and Premium plans
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
          <h1>Analytics Dashboard</h1>
          <p className="text-secondary text-sm mt-2">
            Deep insights into your lead performance and conversion metrics
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchAnalytics}>
          ↻ Refresh
        </button>
      </div>

      {loading && <div className="loading-spinner">Loading analytics...</div>}

      {!loading && (
        <div className="analytics-grid">
          {/* Conversion Funnel */}
          {funnel && (
            <motion.div
              className="glass-card-elevated p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Target size={20} className="text-indigo" />
                <h3>Conversion Funnel</h3>
              </div>

              <div className="funnel-chart">
                {[
                  { label: 'New Leads', value: funnel.new, color: '#6366f1' },
                  { label: 'Contacted', value: funnel.contacted, color: '#8b5cf6' },
                  { label: 'Site Visit', value: funnel.siteVisit, color: '#ec4899' },
                  { label: 'Negotiation', value: funnel.negotiation, color: '#f59e0b' },
                  { label: 'Closed', value: funnel.closed, color: '#10b981' },
                ].map((stage, i) => {
                  const maxValue = funnel.new;
                  const percentage = (stage.value / maxValue) * 100;
                  return (
                    <div key={i} className="funnel-stage">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">{stage.label}</span>
                        <span className="text-xs text-muted">{stage.value}</span>
                      </div>
                      <div className="funnel-bar" style={{ width: `${percentage}%`, backgroundColor: stage.color }} />
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-secondary">Overall Conversion Rate</p>
                <p className="text-2xl font-bold text-emerald">{funnel ? `${conversionRate}%` : '0%'}</p>
              </div>
            </motion.div>
          )}

          {/* Source ROI Analysis */}
          {sourceROI.length > 0 && (
            <motion.div
              className="glass-card-elevated p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-amber" />
                <h3>Lead Source ROI</h3>
              </div>

              <div className="source-table">
                <div className="table-header">
                  <div className="col-source">Source</div>
                  <div className="col-metric">Leads</div>
                  <div className="col-metric">Contacted</div>
                  <div className="col-metric">Closed</div>
                  <div className="col-metric">Conv. Rate</div>
                </div>
                {sourceROI.map((source) => (
                  <div key={source.source} className="table-row">
                    <div className="col-source font-semibold">{source.source}</div>
                    <div className="col-metric">{source.totalLeads}</div>
                    <div className="col-metric">{source.contactedLeads}</div>
                    <div className="col-metric text-emerald font-semibold">{source.closedDeals}</div>
                    <div className="col-metric">
                      <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        {source.conversionRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Response Time */}
          {responseTime && (
            <motion.div
              className="glass-card-elevated p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Clock size={20} className="text-rose" />
                <h3>Response Time Analytics</h3>
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <p className="text-xs text-muted uppercase">Avg Response</p>
                  <p className="text-2xl font-bold">{responseTime.avgResponseTime}h</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs text-muted uppercase">Median</p>
                  <p className="text-2xl font-bold">{responseTime.medianResponseTime}h</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs text-muted uppercase">Hot Leads Avg</p>
                  <p className="text-2xl font-bold text-emerald">{responseTime.hotLeadAvgTime}h</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs text-muted uppercase">Total Tracked</p>
                  <p className="text-2xl font-bold">{responseTime.totalLeadsWithResponse}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Hot Leads */}
          {hotLeads.length > 0 && (
            <motion.div
              className="glass-card-elevated p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Flame size={20} className="text-rose" />
                <h3>🔥 Hot Leads (Priority)</h3>
              </div>

              <div className="hot-leads-list">
                {hotLeads.slice(0, 5).map((lead) => (
                  <div key={lead._id} className="hot-lead-item">
                    <div className="flex-1">
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-xs text-muted">{lead.phone}</p>
                      <p className="text-xs mt-1">
                        {lead.propertyType} • {lead.location} • ₹{lead.budget}L
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-hot">{lead.scorePercentage}% Hot</span>
                      <p className="text-xs text-muted mt-1">{lead.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              {hotLeads.length > 5 && (
                <p className="text-xs text-center text-muted mt-4">+{hotLeads.length - 5} more hot leads</p>
              )}
            </motion.div>
          )}

          {/* Property Performance */}
          {propertyPerformance && (
            <motion.div
              className="glass-card-elevated p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Home size={20} className="text-cyan" />
                <h3>Property Type Performance</h3>
              </div>

              <div className="property-table">
                <div className="table-header">
                  <div className="col-property">Type</div>
                  <div className="col-metric">Total</div>
                  <div className="col-metric">Closed</div>
                  <div className="col-metric">Close Rate</div>
                </div>
                {propertyPerformance.byPropertyType.map((prop) => (
                  <div key={prop.propertyType} className="table-row">
                    <div className="col-property font-semibold">{prop.propertyType}</div>
                    <div className="col-metric">{prop.total}</div>
                    <div className="col-metric text-emerald">{prop.closed}</div>
                    <div className="col-metric">
                      <div className="close-rate-bar">
                        <div
                          className="close-rate-fill"
                          style={{ width: `${prop.closeRate}%` }}
                        />
                        <span className="rate-text">{prop.closeRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Locations */}
          {propertyPerformance && propertyPerformance.byLocation.length > 0 && (
            <motion.div
              className="glass-card-elevated p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={20} className="text-green" />
                <h3>Top Performing Locations</h3>
              </div>

              <div className="locations-list">
                {propertyPerformance.byLocation.slice(0, 8).map((loc, i) => (
                  <div key={i} className="location-item">
                    <div className="flex-1">
                      <p className="font-semibold">{loc.location || 'Unknown'}</p>
                      <p className="text-xs text-muted">{loc.closed} deals closed</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald">{loc.closeRate}%</p>
                      <p className="text-xs text-muted">{loc.total} leads</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
