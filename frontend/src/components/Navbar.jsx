import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import { LogOut, Award, User, Settings, Layers, Bell, Trophy, XCircle, CheckCircle2 } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('notifications/');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user && !isAdmin) {
      fetchNotifications();
      // Poll notifications every 15 seconds
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await API.post(`notifications/${id}/read/`);
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, is_read: true } : notif))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.post('notifications/read-all/');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'QUALIFIED':
        return (
          <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 size={14} />
          </div>
        );
      case 'NOT_QUALIFIED':
        return (
          <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400">
            <XCircle size={14} />
          </div>
        );
      case 'WINNER':
        return (
          <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Trophy size={14} />
          </div>
        );
      default:
        return (
          <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400">
            <Bell size={14} />
          </div>
        );
    }
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 transition-all border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 text-2xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
            QUIZORA
          </span>
          <span className="text-white text-xs px-2 py-0.5 rounded-full bg-purple-600/40 border border-purple-500/30">
            v1.0
          </span>
        </Link>

        {/* User Stats / Controls */}
        {user ? (
          <div className="flex items-center space-x-4">
            {isAdmin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className="hidden md:flex items-center space-x-1.5 text-sm font-medium text-purple-300 hover:text-white transition"
                >
                  <Settings size={16} />
                  <span>Admin Panel</span>
                </Link>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300">
                  Organizer
                </span>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="hidden md:flex items-center space-x-1.5 text-sm font-medium text-purple-300 hover:text-white transition"
                >
                  <Layers size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/winners"
                  className="hidden md:flex items-center space-x-1.5 text-sm font-medium text-purple-300 hover:text-white transition"
                >
                  <Trophy size={16} className="text-yellow-400" />
                  <span>Winners</span>
                </Link>
                <div className="flex items-center space-x-2 text-sm text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <User size={14} className="text-purple-400" />
                  <span className="font-semibold">{user.register_no}</span>
                </div>
              </>
            )}

            {/* Notification Bell (Only for participants) */}
            {user && !isAdmin && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-purple-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300"
                  aria-label="Notifications"
                >
                  <Bell size={20} className={unreadCount > 0 ? 'animate-pulse' : ''} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-[10px] font-bold text-white shadow-lg border border-slate-900 animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-xl glass-premium overflow-hidden z-[100] shadow-2xl origin-top-right transform transition-all duration-300">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                      <div className="flex items-center space-x-2">
                        <Bell size={16} className="text-purple-400" />
                        <span className="font-bold text-sm text-slate-100">Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <Bell size={32} className="text-slate-600 mb-2 opacity-50" />
                          <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
                          <p className="text-[10px] text-slate-500 mt-1">We'll alert you when updates are available.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                            className={`p-4 hover:bg-white/5 transition cursor-pointer flex items-start space-x-3 relative ${
                              !notif.is_read ? 'bg-purple-950/10' : ''
                            }`}
                          >
                            {/* Blue dot indicator for unread */}
                            {!notif.is_read && (
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            )}
                            
                            {/* Icon based on notification type */}
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notif.notification_type)}
                            </div>
                            
                            {/* Text */}
                            <div className="flex-grow min-w-0 pl-1">
                              <p className={`text-xs font-semibold text-slate-100 ${!notif.is_read ? 'text-white font-bold' : 'text-slate-300'}`}>
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed break-words">
                                {notif.message}
                              </p>
                              <p className="text-[9px] text-slate-500 mt-1.5">
                                {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500 hover:to-red-600 hover:text-white text-red-400 border border-red-500/30 hover:border-red-500 transition-all duration-300 shadow-lg"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-5 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition"
            >
              Participant Login
            </Link>
            <Link
              to="/admin/login"
              className="px-5 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md transition"
            >
              Admin Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
