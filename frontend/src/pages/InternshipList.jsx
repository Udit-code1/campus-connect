import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Briefcase, Search, Sparkles, MapPin, DollarSign, Calendar, Heart, Shield, CheckCircle, HelpCircle } from 'lucide-react';
import { selectCurrentUser } from '../store/authSlice';
import api from '../services/api';

export const InternshipList = () => {
  const user = useSelector(selectCurrentUser);
  const isStudent = user?.role === 'student';

  const [search, setSearch] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [internships, setInternships] = useState([]);
  const [aiRecs, setAiRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(isStudent);
  const [bookmarks, setBookmarks] = useState([]);

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  // Fetch Internships
  const fetchInternships = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (skillsFilter) params.skills = skillsFilter;
    if (typeFilter) params.type = typeFilter;

    api.get('/internships', { params })
      .then((res) => {
        if (res.data?.success) {
          setInternships(res.data.data.internships);
        }
      })
      .catch((err) => console.error('Error fetching internships:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInternships();
  }, [search, skillsFilter, typeFilter]);

  // Fetch AI Career Recommendations
  useEffect(() => {
    if (isStudent) {
      setLoadingRecs(true);
      api.get('/recommendations/internships')
        .then((res) => {
          if (res.data?.success) {
            setAiRecs(res.data.data.recommendations);
          }
        })
        .catch((err) => console.error('Error fetching career recommendations:', err))
        .finally(() => setLoadingRecs(false));
    }
  }, [isStudent]);

  // Fetch Bookmarks
  useEffect(() => {
    if (user) {
      api.get('/users/bookmarks')
        .then((res) => {
          if (res.data?.success) {
            setBookmarks(res.data.data.internships.map((i) => i._id));
          }
        })
        .catch((err) => console.error('Error fetching bookmarks:', err));
    }
  }, [user]);

  const handleBookmark = async (id) => {
    const isBookmarked = bookmarks.includes(id);
    try {
      if (isBookmarked) {
        await api.delete(`/users/bookmarks/internship/${id}`);
        setBookmarks((prev) => prev.filter((b) => b !== id));
      } else {
        await api.post(`/users/bookmarks/internship/${id}`);
        setBookmarks((prev) => [...prev, id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyClick = (internship) => {
    setSelectedInternship(internship);
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmittingApply(true);
    try {
      const res = await api.post(`/internships/${selectedInternship._id}/apply`, {
        resumeUrl,
      });

      if (res.data?.success) {
        alert('Application submitted successfully!');
        setApplyModalOpen(false);
        setResumeUrl('');
        fetchInternships(); // refresh list
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmittingApply(false);
    }
  };

  const isApplied = (internship) => {
    // Check if the user is in the applicants list (or check user profile applicationHistory)
    return user?.applicationHistory?.some(
      (app) => app.internship === internship._id
    );
  };

  return (
    <div style={{ padding: '2rem 4rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="radial-bg"></div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Career <span className="gradient-text">Opportunities</span> 💼
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            Find internships and application options customized to your skills
          </p>
        </div>

        {user?.role === 'college_admin' && (
          <Link to="/admin" className="btn btn-primary">
            Post Internship
          </Link>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────
          AI RECOMMENDED ROLES
          ──────────────────────────────────────────────────────── */}
      {isStudent && aiRecs.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'hsl(var(--accent-secondary))' }} />
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>Matched for You</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {aiRecs.slice(0, 3).map((rec) => (
              <div key={rec.itemId} className="glass-card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                borderLeft: '4px solid hsl(var(--accent-secondary))'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      {rec.internship?.company}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-secondary))', fontWeight: 800 }}>
                      {Math.round(rec.score * 100)}% Match
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{rec.internship?.role}</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '0.75rem' }}>
                    <span>📍 {rec.internship?.location}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{rec.internship?.type}</span>
                  </div>

                  <div style={{
                    background: 'hsl(var(--bg-tertiary) / 0.4)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: 'hsl(var(--text-secondary))'
                  }}>
                    ✨ {rec.reason}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--success))' }}>
                    {rec.internship?.stipend?.isPaid ? `${rec.internship.stipend.amount} ${rec.internship.stipend.currency}/mo` : 'Unpaid'}
                  </span>

                  <button 
                    onClick={() => handleApplyClick(rec.internship)} 
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────
          ALL INTERNSHIPS FEED
          ──────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>All Listings</h2>

          {/* Filters & Search */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'hsl(var(--text-muted))' }} />
              <input 
                type="text" 
                placeholder="Search company or role..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input" 
                style={{ padding: '10px 16px 10px 36px', fontSize: '0.85rem', width: '200px' }}
              />
            </div>

            <input 
              type="text" 
              placeholder="Filter by skill..." 
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
              className="form-input" 
              style={{ padding: '10px 16px', fontSize: '0.85rem', width: '150px' }}
            />

            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input"
              style={{ padding: '10px 16px', fontSize: '0.85rem', width: '130px' }}
            >
              <option value="">All Types</option>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card shimmer" style={{ height: '200px', borderRadius: 'var(--border-radius-md)' }}></div>
            ))}
          </div>
        ) : internships.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'hsl(var(--text-secondary))' }}>
            <Briefcase size={36} style={{ color: 'hsl(var(--text-muted))', marginBottom: '0.75rem' }} />
            <p>No listings matched your criteria</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {internships.map((intern) => (
              <div key={intern._id} className="glass-card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                position: 'relative'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'hsl(var(--accent-primary))' }}>
                      {intern.company}
                    </span>
                    
                    <button 
                      onClick={() => handleBookmark(intern._id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarks.includes(intern._id) ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-muted))' }}
                    >
                      <Heart size={18} fill={bookmarks.includes(intern._id) ? 'hsl(var(--accent-primary))' : 'none'} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{intern.role}</h3>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                    {intern.skills?.map((skill) => (
                      <span key={skill} className="badge badge-purple" style={{ fontSize: '0.55rem', padding: '2px 6px' }}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  <p style={{
                    fontSize: '0.8rem',
                    color: 'hsl(var(--text-secondary))',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: '0.5rem 0'
                  }}>
                    {intern.description}
                  </p>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: 'hsl(var(--text-muted))',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem'
                  }}>
                    <span>📍 {intern.location} ({intern.type})</span>
                    <span style={{ fontWeight: 600, color: 'hsl(var(--success))' }}>
                      {intern.stipend?.isPaid ? `${intern.stipend.amount} ${intern.stipend.currency}/mo` : 'Unpaid'}
                    </span>
                  </div>

                  {isStudent && (
                    <div style={{ marginTop: '1rem' }}>
                      {isApplied(intern) ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          background: 'hsl(var(--success) / 0.1)',
                          border: '1px solid hsl(var(--success) / 0.2)',
                          color: '#34d399',
                          padding: '10px',
                          borderRadius: 'var(--border-radius-sm)',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          <CheckCircle size={16} /> Applied
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleApplyClick(intern)} 
                          className="btn btn-primary"
                          style={{ width: '100%', height: '38px' }}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ────────────────────────────────────────────────────────
          APPLY MODAL
          ──────────────────────────────────────────────────────── */}
      {applyModalOpen && selectedInternship && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '2.5rem',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
              Apply for {selectedInternship.role}
            </h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              At {selectedInternship.company} • {selectedInternship.location}
            </p>

            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Resume Link (PDF URL)</label>
                <input 
                  type="url"
                  placeholder="https://drive.google.com/file/... or Cloudinary URL"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setApplyModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submittingApply}
                >
                  {submittingApply ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipList;
