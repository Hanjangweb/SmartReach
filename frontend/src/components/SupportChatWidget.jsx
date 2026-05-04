import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Headset } from 'lucide-react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './SupportChatWidget.css';

export default function SupportChatWidget() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Only show for paid users (non-admin)
  const isEligible = user && user.plan !== 'free' && user.role !== 'admin';

  useEffect(() => {
    if (!isEligible) return;

    // Connect to Socket.IO
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Listen for replies from admin
    newSocket.on(`support_reply_${user._id}`, (data) => {
      setMessages((prev) => [...prev, data.message]);
      if (!isOpen) {
        // Optional: show a toast notification here if chat is closed
      }
    });

    return () => newSocket.close();
  }, [user, isEligible, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchMessages();
    }
    scrollToBottom();
  }, [isOpen, messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/support/messages');
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load support messages', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(''); // optimistic clear

    try {
      const res = await api.post('/support/messages', { content: messageText });
      setMessages((prev) => [...prev, res.data.message]);
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(messageText); // revert on failure
    }
  };

  if (!isEligible) return null;

  return (
    <div className="support-chat-wrapper">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="support-chat-window"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="support-chat-header">
              <div className="support-chat-title">
                <Headset size={18} className="text-primary" />
                <span>Premium Support</span>
              </div>
              <button className="support-chat-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="support-chat-messages">
              {messages.length === 0 ? (
                <div className="text-center text-muted text-sm mt-8 opacity-70">
                  <Headset size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Welcome to Premium Support.</p>
                  <p>How can we help you today?</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id} className={`support-message ${msg.isFromAdmin ? 'admin' : 'user'}`}>
                    {msg.content}
                    <span className="support-message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="support-chat-input-area" onSubmit={handleSend}>
              <input
                type="text"
                className="support-chat-input"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="support-chat-send" disabled={!newMessage.trim()}>
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button className="support-chat-button" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
