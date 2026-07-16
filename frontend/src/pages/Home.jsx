import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Briefcase, Award, TrendingUp, Search, Bell, AlertTriangle } from 'lucide-react';
import { selectCurrentUser } from '../store/authSlice';
import api from '../services/api';

export const Home = () => {
  const user = useSelector(selectCurrentUser);
  const isStudent = user?.role === 'student';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(isStudent);

  // Fetch events
  useEffect(() => {
    setLoadingEvents(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;

    api.get('/events', { params })
      .then((res) => {
        if (res.data?.success) {
          setEvents(res.data.data.events);
        }
      })
      .catch((err) => console.error('Error fetching events:', err))
      .finally(() => setLoadingEvents(false));
  }, [search, category]);

  // Fetch recommendations for students
  useEffect(() => {
    if (isStudent) {
      setLoadingRecs(true);
      api.get('/recommendations/events')
        .then((res) => {
          if (res.data?.success) {
            setRecommendations(res.data.data.recommendations);
          }
        })
        .catch((err) => console.error('Error fetching recommendations:', err))
        .finally(() => setLoadingRecs(false));
    }
  }, [isStudent, user]);

  return (
    <div style={{ padding: '2rem 4rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Background Gradient */}
      <div className="radial-bg"></div>

      {/* Greeting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Hello, <span className="gradient-text-sec">{user?.name}</span> 👋
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>
            {user?.role === 'college_admin' ? 'Manage your campus career listings and approvals' :
             user?.role === 'society_admin' ? `Manage events for ${user?.societyName || 'your club'}` :
             'Here are your recommendations and upcoming campus happenings'}
          </p>
        </div>
        
        {isStudent && user && !user.isProfileComplete && (
          <Link to="/profile" className="glass-card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '10px 16px',
            borderColor: 'hsl(var(--warning) / 0.4)',
            background: 'hsl(var(--warning) / 0.05)',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={18} style={{ color: 'hsl(var(--warning))' }} />
            <div>
              <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Complete your profile</span>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>Add skills & interests for smart recommendations</p>
            </div>
          </Link>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────
          AI RECOMMENDATIONS SECTION (STUDENTS ONLY)
          ──────────────────────────────────────────────────────── */}
      {isStudent && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'hsl(var(--accent-secondary))' }} />
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>Personalized Recommendations</h2>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginLeft: '0.5rem' }}>AI-Powered</span>
          </div>

          {loadingRecs ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card shimmer" style={{ height: '180px', borderRadius: 'var(--border-radius-md)' }}></div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-secondary))' }}>
              <Award size={36} style={{ color: 'hsl(var(--text-muted))', marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.95rem' }}>No personalized recommendations yet.</p>
              <Link to="/profile" style={{ color: 'hsl(var(--accent-secondary))', textDecoration: 'underline', fontSize: '0.85rem', marginTop: '0.25rem', display: 'inline-block' }}>
                Complete your interests profile to enable matching.
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec.itemId} className="glass-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Subtle Background Glow */}
                  <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'hsl(var(--accent-primary) / 0.15)',
                    filter: 'blur(30px)',
                    zIndex: -1
                  }}></div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.6rem' }}>
                        {rec.event ? 'Event' : 'Career'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-secondary))', fontWeight: 700 }}>
                        {Math.round(rec.score * 100)}% Match
                      </span>
                    </div>
                    
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                      {rec.event ? rec.event.title : rec.internship?.role}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                      {rec.event ? `By ${rec.event.society}` : `At ${rec.internship?.company}`}
                    </p>
                  </div>

                  <div style={{
                    background: 'hsl(var(--bg-tertiary) / 0.4)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    border: '1px solid var(--glass-border)',
                    color: 'hsl(var(--text-secondary))'
                  }}>
                    ✨ {rec.reason}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <Link 
                      to={rec.event ? `/events/${rec.itemId}` : `/internships`}
                      className="btn btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────
          UNIFIED CAMPUS FEED SECTION (ALL ROLES)
          ──────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} style={{ color: 'hsl(var(--accent-primary))' }} />
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>Campus Events Feed</h2>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'hsl(var(--text-muted))' }} />
              <input 
                type="text" 
                placeholder="Search events..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input" 
                style={{ padding: '10px 16px 10px 36px', fontSize: '0.85rem', width: '200px' }}
              />
            </div>

            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input"
              style={{ padding: '10px 16px', fontSize: '0.85rem', width: '150px' }}
            >
              <option value="">All Categories</option>
              <option value="technical">Technical</option>
              <option value="cultural">Cultural</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="sports">Sports</option>
            </select>

            {user?.role !== 'student' && (
              <Link to="/events/post" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                Post Event
              </Link>
            )}
          </div>
        </div>

        {loadingEvents ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="glass-card shimmer" style={{ height: '220px', borderRadius: 'var(--border-radius-md)' }}></div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'hsl(var(--text-secondary))' }}>
            <Calendar size={36} style={{ color: 'hsl(var(--text-muted))', marginBottom: '0.75rem' }} />
            <p>No events match your criteria</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {events.map((event) => (
              <Link to={`/events/${event._id}`} key={event._id} className="glass-card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '240px',
                padding: '20px'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-teal" style={{ fontSize: '0.6rem' }}>{event.category}</span>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {event.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                    By {event.society}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                    <span>📍 {event.venue}</span>
                    <span>👤 {event.registrationCount || 0} RSVPs</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
