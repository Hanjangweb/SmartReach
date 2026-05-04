import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building2, Phone, Save, Crown, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PayPalButtons } from '@paypal/react-paypal-js';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './Settings.css';



export default function Settings() {
  const { user, updateProfile, fetchUser, isLoading } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    agency: user?.agency || '',
    phone: user?.phone || '',
  });
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [planToUpgrade, setPlanToUpgrade] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const verifyRef = useRef(false);
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const planId = searchParams.get('plan_id');
    if (sessionId && !verifyRef.current) {
      verifyRef.current = true;
      verifyPayment(sessionId, planId);
    }
    
    api.get('/plans').then(res => setPlans(res.data.plans)).catch(console.error);
  }, [searchParams]);

  const verifyPayment = async (sessionId, planId) => {
    const t = toast.loading('Verifying your payment...');
    try {
      await api.post('/payment/verify-session', { sessionId, planId });
      await fetchUser();
      toast.success('Subscription upgraded successfully!', { id: t });
      navigate('/settings', { replace: true });
    } catch (err) {
      toast.error('Payment verification failed', { id: t });
    }
  };


  const handleUpgradeClick = (plan) => {
    setPlanToUpgrade(plan);
    setShowModal(true);
  };

  const handleRazorpayCheckout = async () => {
    setIsProcessing(true);
    try {
      const { data: { order } } = await api.post('/payment/razorpay/create-order', { planId: planToUpgrade.planId });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'SmartReach',
        description: `Upgrade to ${planToUpgrade.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payment/razorpay/verify', response);
            toast.success('Subscription upgraded successfully!');
            setShowModal(false);
            fetchUser();
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: { color: '#6366f1' },
        config: {
          display: {
            hide: [],
            sequence: ['upi', 'card', 'netbanking']
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay');
    } finally {
      setIsProcessing(false);
    }
  };

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    const r = await updateProfile(form);
    r.success ? toast.success('Profile updated!') : toast.error('Update failed');
  };


  return (
    <div>
      <div className="page-header"><h1>Settings</h1></div>

      <div className="settings-grid">
        {/* Profile */}
        <motion.div className="glass-card-elevated p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <User size={20} className="text-indigo" />
            <h3>Profile</h3>
          </div>

          {/* Avatar */}
          <div className="settings-avatar mb-6">
            <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.3rem' }}>
              {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SR'}
            </div>
            <div>
              <p className="font-semibold text-primary">{user?.name}</p>
              <p className="text-sm text-secondary">{user?.email}</p>
              <span className="badge badge-new mt-1">{user?.plan || 'free'} plan</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label"><User size={13} /> Full Name</label>
              <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} id="settings-name" />
            </div>
            <div className="form-group">
              <label className="form-label"><Building2 size={13} /> Agency / Company</label>
              <input className="form-input" value={form.agency} onChange={(e) => set('agency', e.target.value)} placeholder="Your real estate agency" id="settings-agency" />
            </div>
            <div className="form-group">
              <label className="form-label"><Phone size={13} /> Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9876543210" id="settings-phone" />
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={isLoading} id="save-profile-btn">
              {isLoading ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </motion.div>

        {/* Plans - Hidden for Admins */}
        {user?.role !== 'admin' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <Crown size={20} className="text-amber" />
              <h3>Subscription Plans</h3>
            </div>
            <div className="plans-grid">
              {plans.map((plan) => (
                <div key={plan.planId} className={`plan-card glass-card ${user?.plan === plan.planId ? 'plan-active' : ''} ${plan.popular ? 'plan-popular' : ''}`} style={{ '--plan-color': plan.color }}>
                  {plan.popular && <div className="plan-popular-badge">Most Popular</div>}
                  <div className="plan-header">
                    <h4 className="plan-name">{plan.name}</h4>
                    <div className="plan-price">₹{plan.price}/mo</div>
                    <div className="plan-leads">{plan.leadLimit ? `Up to ${plan.leadLimit} leads` : 'Unlimited leads'}</div>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((f) => <li key={f}><Zap size={12} /> {f}</li>)}
                  </ul>
                  {user?.plan === plan.planId ? (
                    <div className="btn btn-secondary btn-sm btn-full" style={{ pointerEvents: 'none' }}>✓ Current Plan</div>
                  ) : (
                    <button className="btn btn-primary btn-sm btn-full" onClick={() => handleUpgradeClick(plan)} id={`plan-${plan.planId}`}>
                      Upgrade to {plan.name}
                    </button>
                  )}

                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Checkout Modal */}
      {showModal && planToUpgrade && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div 
            className="checkout-modal glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Upgrade to {planToUpgrade.name}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="plan-summary mb-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="text-sm text-secondary">Monthly Subscription</p>
                    <p className="font-bold text-lg">{planToUpgrade.name} Plan</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo">₹{planToUpgrade.price}</p>
                </div>
              </div>

              <p className="text-sm text-secondary mb-4 font-semibold uppercase tracking-wider">Select Payment Method</p>
              
              <div className="flex flex-col gap-4">
                {/* Stripe Card/UPI */}
                <button 
                  className="payment-method-btn"
                  onClick={handleRazorpayCheckout}
                  disabled={isProcessing}
                >
                  <div className="flex items-center gap-3">
                    <div className="payment-icon card-icon">🇮🇳</div>
                    <div className="text-left">
                      <p className="font-bold">UPI / Card / NetBanking</p>
                      <p className="text-xs text-muted">Powered by Razorpay</p>
                    </div>
                  </div>
                  {isProcessing && <div className="spinner-xs" />}
                </button>

                <div className="payment-divider"><span>OR</span></div>

                {/* PayPal */}
                <div className="paypal-container">
                  <PayPalButtons
                    style={{ layout: 'horizontal', height: 50 }}
                    createOrder={async () => {
                      try {
                        const { data } = await api.post('/payment/paypal/create-order', { planId: planToUpgrade.planId });
                        return data.orderId;
                      } catch (err) {
                        toast.error('PayPal initiation failed');
                      }
                    }}
                    onApprove={async (data) => {
                      try {
                        await api.post('/payment/paypal/capture-order', { orderId: data.orderID });
                        toast.success('Subscription upgraded successfully!');
                        setShowModal(false);
                        fetchUser();
                      } catch (err) {
                        toast.error('PayPal verification failed');
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-muted mt-6 px-4">
              By completing this purchase, you agree to our Terms of Service and Privacy Policy. 
              Payments are secure and encrypted.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
