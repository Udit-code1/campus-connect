import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Users, Heart, ArrowLeft, Clock, Trash2, Edit } from 'lucide-react';
import { selectCurrentUser } from '../store/authSlice';
import api from '../services/api';
import useSocket from '../hooks/useSocket';

export const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const socket = useSocket();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvped, setRsvped] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  useEffect(() => {
    // Fetch Event Details
    setLoading(true);
    api.get(`/events/${id}`)
      .then((res) => {
        if (res.data?.success) {
          const evt = res.data.data.event;
          setEvent(evt);
          
          // Check if current user is registered
          const isRegistered = evt.registrations.some(
            (reg) => reg.user._id === user?.id || reg.user === user?.id
          );
          setRsvped(isRegistered);
        }
      })
      .catch((err) => console.error('Error fetching event:', err))
      .finally(() => setLoading(false));

    // Check Bookmark Status
    api.get('/users/bookmarks')
      .then((res) => {
        if (res.data?.success) {
          const isBookmarked = res.data.data.events.some((e) => e._id === id);
          setBookmarked(isBookmarked);
        }
      })
      .catch((err) => console.error('Error fetching bookmarks:', err));
  }, [id, user]);

  // WebSocket Live RSVP updates
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('event:join', id);

    socket.on('rsvp:update', (data) => {
      if (data.eventId === id) {
        setEvent((prev) => {
          if (!prev) return prev;
          // Dynamically adjust count matching socket broadcast
          return {
            ...prev,
            registrations: new Array(data.count).fill({ user: {} }), // mock registration list
          };
        });
      }
    });

    return () => {
      socket.emit('event:leave', id);
      socket.off('rsvp:update');
    };
  }, [socket, id]);

  const handleRsvp = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmittingRsvp(true);
    try {
      const endpoint = `/events/${id}/rsvp`;
      let res;
      if (rsvped) {
        res = await api.delete(endpoint);
      } else {
        res = await api.post(endpoint);
      }

      if (res.data?.success) {
        setRsvped(!rsvped);
        // Refresh event details to update registration list
        const detailRes = await api.get(`/events/${id}`);
        if (detailRes.data?.success) {
          setEvent(detailRes.data.data.event);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'RSVP operation failed');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleBookmark = async () => {
    try {
      if (bookmarked) {
        await api.delete(`/users/bookmarks/event/${id}`);
      } else {
        await api.post(`/users/bookmarks/event/${id}`);
      }
      setBookmarked(!bookmarked);
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/events/${id}`);
        navigate('/');
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Event Not Found</h2>
        <Link to="/" style={{ color: 'hsl(var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Feed
        </Link>
      </div>
    );
  }

  const isOwner = event.createdBy?._id === user?.id || event.createdBy === user?.id;
  const isAdmin = user?.role === 'college_admin';

  return (
    <div style={{ padding: '3rem 6rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="radial-bg"></div>

      {/* Back button */}
      <div>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Feed
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', alignItems: 'start' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Category Tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge badge-purple">{event.category}</span>
            {(isOwner || isAdmin) && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleDelete} className="btn btn-secondary" style={{ color: 'hsl(var(--danger))', padding: '8px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '2.75rem', fontFamily: 'var(--font-display)', lineHeight: '1.15' }}>
            {event.title}
          </h1>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {event.tags?.map((tag) => (
              <span key={tag} className="badge badge-teal" style={{ fontSize: '0.65rem' }}>
                #{tag}
              </span>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />

          {/* Description */}
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.15rem' }}>About this Event</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {event.description}
            </p>
          </div>
        </div>

        {/* Sidebar details box */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
            {/* Date */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Calendar size={18} style={{ color: 'hsl(var(--accent-primary))' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Date & Time</span>
                <span style={{ fontWeight: 600 }}>{new Date(event.date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Venue */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <MapPin size={18} style={{ color: 'hsl(var(--accent-primary))' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Location</span>
                <span style={{ fontWeight: 600 }}>{event.venue}</span>
              </div>
            </div>

            {/* Society Organizer */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Users size={18} style={{ color: 'hsl(var(--accent-primary))' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Organizer</span>
                <span style={{ fontWeight: 600 }}>{event.society}</span>
              </div>
            </div>

            {/* Registrations count */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Users size={18} style={{ color: 'hsl(var(--accent-primary))' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Attendees</span>
                <span style={{ fontWeight: 700, color: 'hsl(var(--accent-secondary))' }}>
                  {event.registrationCount || 0} RSVPs 
                  {event.maxCapacity > 0 ? ` / ${event.maxCapacity}` : ' (Unlimited)'}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              onClick={handleRsvp} 
              className={`btn ${rsvped ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%' }}
              disabled={submittingRsvp}
            >
              {submittingRsvp ? (
                <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
              ) : rsvped ? (
                'Cancel RSVP'
              ) : (
                'RSVP to Event'
              )}
            </button>

            <button 
              onClick={handleBookmark} 
              className={`btn btn-outline`}
              style={{ width: '100%', gap: '0.5rem' }}
            >
              <Heart size={16} fill={bookmarked ? 'hsl(var(--accent-primary))' : 'none'} style={{ color: bookmarked ? 'hsl(var(--accent-primary))' : 'inherit' }} />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
