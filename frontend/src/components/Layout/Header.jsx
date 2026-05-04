import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import './Header.css';

export default function Header({ onMenuClick }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/leads?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <form className="header-search" onSubmit={handleSearch}>
          <Search size={16} className="header-search-icon" />
          <input
            type="text"
            placeholder="Search leads, phones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="header-search-input"
          />
        </form>
      </div>

      <div className="header-right">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/leads/add')}
        >
          <Plus size={16} />
          <span>Add Lead</span>
        </button>

        <button className="header-icon-btn" title="Notifications" onClick={() => navigate('/reminders')}>
          <Bell size={18} />
        </button>

        <div className="header-user" onClick={() => navigate('/settings')}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.78rem', cursor: 'pointer' }}>
            {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SR'}
          </div>
        </div>
      </div>
    </header>
  );
}
