import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, LogOut, User, BookOpen, Briefcase, Calendar, Shield, Menu, X, Settings } from 'lucide-react';
import { logout, selectCurrentUser } from '../store/authSlice';
import api from '../services/api';
import { setNotifications, selectUnreadCount, markRead, markAllRead } from '../store/notificationSlice';

export const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const unreadCount = useSelector(selectUnreadCount);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState([]);
  const notifRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (notifDropdownOpen && user) {
      api.get('/notifications?limit=5')
        .then((res) => {
          if (res.data?.success) {
            setLocalNotifications(res.data.data.notifications);
            dispatch(setNotifications(res.data.data.notifications));
          }
        })
        .catch((err) => console.error('Error fetching notifications:', err));
    }
  }, [notifDropdownOpen, user, dispatch]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      dispatch(markRead(id));
      setNotifDropdownOpen(false);
      if (link) navigate(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      dispatch(markAllRead());
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      borderBottom: '1px solid var(--glass-border)'
    }}>
      {/* Logo & Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, hsl(var(--accent-primary)) 0%, hsl(var(--accent-secondary)) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          color: 'white',
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          boxShadow: '0 0 15px hsl(var(--accent-primary) / 0.4)'
        }}>
          C
        </div>
        <span className="gradient-text" style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.5rem',
          letterSpacing: '-0.03em'
        }}>
          CampusConnect
        </span>
      </Link>

      {/* Navigation Links - Desktop */}
      {user && (
        <div className="nav-links-desktop" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" className={`btn btn-text ${isActive('/') ? 'active-link' : ''}`} style={{
            color: isActive('/') ? 'hsl(var(--accent-secondary))' : 'hsl(var(--text-secondary))'
          }}>
            <BookOpen size={18} /> Feed
          </Link>
          <Link to="/events" className={`btn btn-text ${isActive('/events') ? 'active-link' : ''}`} style={{
            color: isActive('/events') ? 'hsl(var(--accent-secondary))' : 'hsl(var(--text-secondary))'
          }}>
            <Calendar size={18} /> Events
          </Link>
          <Link to="/internships" className={`btn btn-text ${isActive('/internships') ? 'active-link' : ''}`} style={{
            color: isActive('/internships') ? 'hsl(var(--accent-secondary))' : 'hsl(var(--text-secondary))'
          }}>
            <Briefcase size={18} /> Careers
          </Link>
          {user.role === 'college_admin' && (
            <Link to="/admin" className={`btn btn-text ${isActive('/admin') ? 'active-link' : ''}`} style={{
              color: isActive('/admin') ? 'hsl(var(--accent-secondary))' : 'hsl(var(--text-secondary))'
            }}>
              <Shield size={18} /> Admin Panel
            </Link>
          )}
        </div>
      )}

      {/* Right side widgets (Notifications & User Controls) */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Notification Bell Dropdown */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="btn btn-secondary" 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                padding: 0,
                position: 'relative'
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: 'hsl(var(--danger))',
                  color: 'white',
                  borderRadius: '50%',
                  minWidth: '20px',
                  height: '20px',
                  padding: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px hsl(var(--danger) / 0.5)',
                  animation: 'pulse 2s infinite'
                }}>
                  {unreadCount}
                </div>
              )}
            </button>

            {/* Notification Dropdown List */}
            {notifDropdownOpen && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: '55px',
                right: 0,
                width: '320px',
                borderRadius: 'var(--border-radius-md)',
                padding: '12px',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                zIndex: 100
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'hsl(var(--accent-secondary))', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {localNotifications.length === 0 ? (
                    <div style={{ color: 'hsl(var(--text-muted))', padding: '16px', textAlign: 'center', fontSize: '0.85rem' }}>
                      No new notifications
                    </div>
                  ) : (
                    localNotifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        onClick={() => handleMarkAsRead(notif._id, notif.link)}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          background: notif.isRead ? 'transparent' : 'hsl(var(--bg-tertiary) / 0.4)',
                          cursor: 'pointer',
                          transition: 'var(--transition-fast)',
                          borderLeft: notif.isRead ? '3px solid transparent' : '3px solid hsl(var(--accent-primary))'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--bg-tertiary) / 0.7)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'hsl(var(--bg-tertiary) / 0.4)'}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>{notif.title}</div>
                        <div style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.75rem', lineHeight: '1.2' }}>{notif.message}</div>
                        <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.65rem', marginTop: '4px' }}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link 
                  to="/notifications" 
                  onClick={() => setNotifDropdownOpen(false)}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '8px',
                    fontSize: '0.8rem',
                    color: 'hsl(var(--accent-primary))',
                    fontWeight: 600,
                    marginTop: '8px',
                    borderTop: '1px solid var(--glass-border)'
                  }}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>

          {/* User Profile avatar + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="avatar" 
                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid hsl(var(--accent-primary))' }} 
                />
              ) : (
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'hsl(var(--bg-tertiary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  border: '2px solid hsl(var(--accent-primary) / 0.5)'
                }}>
                  <User size={18} />
                </div>
              )}
            </Link>
            <button 
              onClick={handleLogout}
              className="btn btn-secondary" 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                padding: 0
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary">
            Sign In
          </Link>
          <Link to="/login?register=true" className="btn btn-primary">
            Register
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
