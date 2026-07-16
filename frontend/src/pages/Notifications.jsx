import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, CheckSquare, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { selectCurrentUser } from '../store/authSlice';
import { setNotifications, selectNotifications, markRead, markAllRead } from '../store/notificationSlice';
import api from '../services/api';

export const Notifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const [loading, setLoading] = useState(true);
  const [localNotifications, setLocalNotifications] = useState([]);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications?limit=50')
      .then((res) => {
        if (res.data?.success) {
          setLocalNotifications(res.data.data.notifications);
          dispatch(setNotifications(res.data.data.notifications));
        }
      })
      .catch((err) => console.error('Error fetching notifications:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      dispatch(markRead(id));
      setLocalNotifications((prev) => 
        prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
      );
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

  const getIconColor = (type) => {
    if (type.startsWith('event')) return 'hsl(var(--accent-primary))';
    if (type.startsWith('internship')) return 'hsl(var(--accent-secondary))';
    if (type.startsWith('application')) return 'hsl(var(--success))';
    return 'hsl(var(--text-muted))';
  };

  return (
    <div style={{ padding: '3rem 6rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="radial-bg"></div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Notification <span className="gradient-text">Center</span> 🔔
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            Keep track of campus events and applications updates in real-time
          </p>
        </div>

        {localNotifications.some((n) => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.85rem', gap: '0.35rem' }}
          >
            <CheckSquare size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="glass-card" style={{ border: '1px solid var(--glass-border)', padding: '2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : localNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
            <Bell size={42} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {localNotifications.map((notif) => (
              <div 
                key={notif._id}
                onClick={() => handleMarkAsRead(notif._id, notif.link)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: notif.isRead ? 'hsl(var(--bg-secondary) / 0.2)' : 'hsl(var(--bg-secondary) / 0.8)',
                  border: notif.isRead ? '1px solid var(--glass-border)' : '1px solid hsl(var(--accent-primary) / 0.25)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: notif.isRead ? 'none' : '0 4px 12px hsl(var(--accent-primary) / 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = 'hsl(var(--accent-primary) / 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = notif.isRead ? 'var(--glass-border)' : 'hsl(var(--accent-primary) / 0.25)';
                }}
              >
                {/* Accent Icon indicator */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getIconColor(notif.type),
                  marginTop: '6px',
                  boxShadow: `0 0 8px ${getIconColor(notif.type)}`
                }}></div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: notif.isRead ? 500 : 700 }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {notif.message}
                  </p>
                </div>

                {notif.link && (
                  <ArrowRight size={16} style={{ color: 'hsl(var(--text-muted))', alignSelf: 'center' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
