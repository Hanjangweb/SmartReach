import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { Bell, Zap, Calendar } from 'lucide-react';
import useAuthStore from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function NotificationManager() {
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to notification server');
      socket.emit('join', user.id);
    });

    // Reminder due notification
    socket.on('reminder_due', (data) => {
      toast((t) => (
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 p-2 rounded-full text-amber-500">
            <Bell size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">Follow-up Reminder!</p>
            <p className="text-xs text-secondary">{data.message}</p>
          </div>
        </div>
      ), { duration: 6000, position: 'top-right' });
    });

    // AI task completion (example)
    socket.on('ai_complete', (data) => {
      toast.success(`AI ${data.type} complete for ${data.leadName}`, { icon: <Zap size={16} className="text-indigo" /> });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  return null; // This component handles side effects only
}
