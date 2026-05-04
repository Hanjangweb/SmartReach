import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, User, Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', agency: '' });
  const [showPass, setShowPass] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const result = await register(form);
    if (result.success) {
      toast.success('Account created! Welcome to SmartReach 🚀');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="auth-bg">
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <motion.div
        className="auth-card glass-card-elevated"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={24} /></div>
          <span className="auth-logo-text">SmartReach</span>
        </div>

        <div className="auth-header">
          <h1>Create account</h1>
          <p>Start closing more deals with AI assistance</p>
        </div>

        {/* Plan pills */}
        <div className="auth-plan-badge">
          <span>🎉 Free plan — 20 leads included</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <input type="text" className="form-input input-with-icon" placeholder="Rajesh Sharma" value={form.name} onChange={(e) => set('name', e.target.value)} required id="reg-name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input type="email" className="form-input input-with-icon" placeholder="rajesh@agency.com" value={form.email} onChange={(e) => set('email', e.target.value)} required id="reg-email" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Agency / Company (optional)</label>
            <div className="input-icon-wrap">
              <Building2 size={16} className="input-icon" />
              <input type="text" className="form-input input-with-icon" placeholder="Sharma Real Estate" value={form.agency} onChange={(e) => set('agency', e.target.value)} id="reg-agency" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} className="form-input input-with-icon" placeholder="Min 6 characters" value={form.password} onChange={(e) => set('password', e.target.value)} required id="reg-password" />
              <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading} id="reg-submit">
            {isLoading ? <span className="spinner" /> : <><span>Create Free Account</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
