import { create } from 'zustand';
import api from '../lib/api';

const useLeadStore = create((set, get) => ({
  leads: [],
  currentLead: null,
  pagination: { total: 0, page: 1, pages: 1 },
  filters: { status: '', source: '', leadScore: '', search: '' },
  isLoading: false,
  error: null,

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  fetchLeads: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.status) params.append('status', filters.status);
      if (filters.source) params.append('source', filters.source);
      if (filters.leadScore) params.append('leadScore', filters.leadScore);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/leads?${params}`);
      set({ leads: res.data.leads, pagination: res.data.pagination, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to fetch leads' });
    }
  },

  fetchLead: async (id) => {
    set({ isLoading: true, error: null, currentLead: null });
    try {
      const res = await api.get(`/leads/${id}`);
      set({ currentLead: res.data.lead, isLoading: false });
      return res.data.lead;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Lead not found' });
      return null;
    }
  },

  createLead: async (data) => {
    try {
      const res = await api.post('/leads', data);
      set((state) => ({ leads: [res.data.lead, ...state.leads] }));
      return { success: true, lead: res.data.lead };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to create lead' };
    }
  },

  updateLead: async (id, data) => {
    try {
      const res = await api.put(`/leads/${id}`, data);
      set((state) => ({
        leads: state.leads.map((l) => (l._id === id ? res.data.lead : l)),
        currentLead: state.currentLead?._id === id ? res.data.lead : state.currentLead,
      }));
      return { success: true, lead: res.data.lead };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update lead' };
    }
  },

  updateLeadStatus: async (id, status) => {
    try {
      const res = await api.put(`/leads/${id}/status`, { status });
      set((state) => ({
        leads: state.leads.map((l) => (l._id === id ? res.data.lead : l)),
        currentLead: state.currentLead?._id === id ? res.data.lead : state.currentLead,
      }));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },

  deleteLead: async (id) => {
    try {
      await api.delete(`/leads/${id}`);
      set((state) => ({ leads: state.leads.filter((l) => l._id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },

  clearCurrentLead: () => set({ currentLead: null }),
}));

export default useLeadStore;
