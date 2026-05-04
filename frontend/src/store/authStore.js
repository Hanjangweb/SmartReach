import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { token, user } = res.data;
          localStorage.setItem('sr_token', token);
          set({ user, token, isLoading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/register', data);
          const { token, user } = res.data;
          localStorage.setItem('sr_token', token);
          set({ user, token, isLoading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed';
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      logout: () => {
        localStorage.removeItem('sr_token');
        set({ user: null, token: null, error: null });
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.put('/auth/profile', data);
          set({ user: res.data.user, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message };
        }
      },

      fetchUser: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.user });
        } catch (err) {
          console.error('Failed to fetch user', err);
        }
      },



      clearError: () => set({ error: null }),
    }),
    {
      name: 'smartreach-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
