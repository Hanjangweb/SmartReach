import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Home, CheckCircle2, IndianRupee } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

// Standalone public landing page
export default function PublicProperty() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', email: '', requirement: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // We use standard axios since api.js might attach auth headers, though it's fine
    // But we are on a public route. Let's use the env URL.
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    axios.get(`${url}/public/properties/${id}`)
      .then(r => setProperty(r.data.property))
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error('Name and Phone are required');
    
    setSubmitting(true);
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${url}/public/leads`, {
        ...form,
        propertyId: property._id,
        agentId: property.agent._id
      });
      setSubmitted(true);
      toast.success('Your inquiry has been sent!');
    } catch (err) {
      toast.error('Failed to submit inquiry. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]"><span className="spinner" /></div>;
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white p-4 text-center">
        <div>
          <h1 className="text-3xl mb-4 text-emerald">Property Unavailable</h1>
          <p className="text-muted">This property is no longer available or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-emerald/30 selection:text-emerald">
      <Toaster position="top-center" toastOptions={{ className: 'glass-card', style: { background: 'rgba(20,20,30,0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-white/[0.02] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-emerald/20 flex items-center justify-center text-emerald">
              <Home size={18} />
            </span>
            {property.agent.agency || 'Real Estate Agency'}
          </div>
          <a href={`tel:${property.agent.phone}`} className="flex items-center gap-2 text-sm font-medium bg-emerald/10 text-emerald px-4 py-2 rounded-full hover:bg-emerald/20 transition-colors">
            <Phone size={14} /> Contact Agent
          </a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left: Property Details */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block px-3 py-1 bg-emerald/10 text-emerald text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                {property.type} for Sale
              </span>
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-4">{property.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-muted">
                <div className="flex items-center gap-2 text-lg"><MapPin size={18}/> {property.location}</div>
                <div className="flex items-center gap-2 text-2xl font-bold text-white"><IndianRupee size={22}/> {property.price} Lakhs</div>
              </div>
            </motion.div>

            {/* Images placeholder (since we don't have real image uploads yet) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="w-full aspect-video bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-muted"
            >
              <Home size={48} className="mb-4 opacity-50" />
              <p>Property Image Gallery</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-xl font-bold mb-4">About this property</h3>
              <div className="text-muted leading-relaxed whitespace-pre-wrap p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                {property.description}
              </div>
            </motion.div>
          </div>

          {/* Right: Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6"
            style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
          >
            {/* Agent Profile */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
                {property.agent.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm text-muted">Listed by</div>
                <div className="font-bold">{property.agent.name}</div>
              </div>
            </div>

            {submitted ? (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald/20 text-emerald rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Request Sent!</h3>
                <p className="text-muted text-sm">{property.agent.name} will contact you shortly.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">Interested?</h3>
                <p className="text-sm text-muted mb-6">Leave your details and the agent will get back to you immediately.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/50 transition-all" placeholder="Your Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div>
                    <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/50 transition-all" placeholder="Phone Number *" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div>
                    <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/50 transition-all" placeholder="Email Address (Optional)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div>
                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/50 transition-all resize-none" placeholder="Message or specific requirements..." rows={3} value={form.requirement} onChange={e => setForm({...form, requirement: e.target.value})} />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-emerald text-black font-bold rounded-xl py-3.5 hover:bg-emerald/90 transition-colors flex items-center justify-center gap-2">
                    {submitting ? <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Request Callback'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
