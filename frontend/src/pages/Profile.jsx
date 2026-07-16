import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Settings, Heart, Briefcase, Bell, Check, Loader2, Sparkles } from 'lucide-react';
import { selectCurrentUser, updateUser } from '../store/authSlice';
import api from '../services/api';

export const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const [activeTab, setActiveTab] = useState('profile'); // profile, bookmarks, applications
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    year: user?.year || '',
    societyName: user?.societyName || '',
    skills: user?.skills?.join(', ') || '',
    interests: user?.interests?.join(', ') || '',
  });

  const [preferences, setPreferences] = useState({
    events: user?.notificationPreferences?.events ?? true,
    internships: user?.notificationPreferences?.internships ?? true,
    applications: user?.notificationPreferences?.applications ?? true,
  });

  // Bookmarks & Applications data
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [bookmarkedInternships, setBookmarkedInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        department: user.department || '',
        year: user.year || '',
        societyName: user.societyName || '',
        skills: user.skills?.join(', ') || '',
        interests: user.interests?.join(', ') || '',
      });
      setPreferences({
        events: user.notificationPreferences?.events ?? true,
        internships: user.notificationPreferences?.internships ?? true,
        applications: user.notificationPreferences?.applications ?? true,
      });
    }
  }, [user]);

  // Fetch bookmarks & applications when tabs switch
  useEffect(() => {
    if (activeTab === 'bookmarks' || activeTab === 'applications') {
      setLoadingHistory(true);
      // Fetch Bookmarks
      api.get('/users/bookmarks')
        .then((res) => {
          if (res.data?.success) {
            setBookmarkedEvents(res.data.data.events);
            setBookmarkedInternships(res.data.data.internships);
          }
        })
        .catch((err) => console.error(err));

      // Fetch Profile for updated applicationHistory
      api.get('/users/profile')
        .then((res) => {
          if (res.data?.success) {
            // Note: Application history might be populated. Let's make sure we fetch active details
            // For portfolio visual quality, let's also query all internships to link names
            const history = res.data.data.user.applicationHistory || [];
            setApplications(history);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePreferenceToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      // Split comma separated arrays
      const skillsArray = profileData.skills
        ? profileData.skills.split(',').map((s) => s.trim())
        : [];
      const interestsArray = profileData.interests
        ? profileData.interests.split(',').map((i) => i.trim())
        : [];

      const payload = {
        name: profileData.name,
        department: profileData.department,
        year: Number(profileData.year) || undefined,
        societyName: profileData.societyName,
        skills: skillsArray,
        interests: interestsArray,
        notificationPreferences: preferences,
      };

      const res = await api.put('/users/profile', payload);

      if (res.data?.success) {
        dispatch(updateUser(res.data.data.user));
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'accepted') return <span className="badge badge-success">Accepted</span>;
    if (status === 'rejected') return <span className="badge badge-danger">Rejected</span>;
    if (status === 'shortlisted') return <span className="badge badge-teal">Shortlisted</span>;
    return <span className="badge badge-purple">Applied</span>;
  };

  return (
    <div style={{ padding: '2rem 4rem', minHeight: '100vh', display: 'flex', gap: '2.5rem' }}>
      <div className="radial-bg"></div>

      {/* Left Column Tabs Selector */}
      <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('profile')} 
          className="btn btn-secondary"
          style={{
            justifyContent: 'flex-start',
            background: activeTab === 'profile' ? 'hsl(var(--accent-primary) / 0.15)' : 'transparent',
            borderColor: activeTab === 'profile' ? 'hsl(var(--accent-primary) / 0.3)' : 'transparent',
            color: activeTab === 'profile' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))'
          }}
        >
          <User size={18} /> Edit Profile
        </button>

        {user?.role === 'student' && (
          <>
            <button 
              onClick={() => setActiveTab('bookmarks')} 
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                background: activeTab === 'bookmarks' ? 'hsl(var(--accent-primary) / 0.15)' : 'transparent',
                borderColor: activeTab === 'bookmarks' ? 'hsl(var(--accent-primary) / 0.3)' : 'transparent',
                color: activeTab === 'bookmarks' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))'
              }}
            >
              <Heart size={18} /> Saved Bookmarks
            </button>

            <button 
              onClick={() => setActiveTab('applications')} 
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                background: activeTab === 'applications' ? 'hsl(var(--accent-primary) / 0.15)' : 'transparent',
                borderColor: activeTab === 'applications' ? 'hsl(var(--accent-primary) / 0.3)' : 'transparent',
                color: activeTab === 'applications' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))'
              }}
            >
              <Briefcase size={18} /> Applications Tracking
            </button>
          </>
        )}
      </div>

      {/* Right Column Container */}
      <div style={{ flex: 1 }}>
        {activeTab === 'profile' && (
          <div className="glass-card" style={{ maxWidth: '680px', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={22} style={{ color: 'hsl(var(--accent-primary))' }} /> Profile Settings
            </h2>

            {successMsg && (
              <div style={{
                background: 'hsl(var(--success) / 0.15)',
                border: '1px solid hsl(var(--success) / 0.3)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '12px',
                color: '#34d399',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Check size={16} /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={profileData.name} 
                  onChange={handleChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address (Read Only)</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  className="form-input" 
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  disabled 
                />
              </div>

              {user?.role === 'student' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      name="department" 
                      value={profileData.department} 
                      onChange={handleChange} 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Year of Study</label>
                    <select 
                      name="year" 
                      value={profileData.year} 
                      onChange={handleChange} 
                      className="form-input" 
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                  </div>
                </div>
              )}

              {user?.role === 'society_admin' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Society / Club Name</label>
                  <input 
                    type="text" 
                    name="societyName" 
                    value={profileData.societyName} 
                    onChange={handleChange} 
                    className="form-input" 
                    required 
                  />
                </div>
              )}

              {user?.role === 'student' && (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Skills (Comma Separated)</label>
                    <input 
                      type="text" 
                      name="skills" 
                      value={profileData.skills} 
                      onChange={handleChange} 
                      placeholder="e.g. React, Node.js, Python, JavaScript"
                      className="form-input" 
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Interests (Comma Separated)</label>
                    <input 
                      type="text" 
                      name="interests" 
                      value={profileData.interests} 
                      onChange={handleChange} 
                      placeholder="e.g. Web Development, AI, Sports, Music"
                      className="form-input" 
                    />
                  </div>
                </>
              )}

              {/* Notification Preferences */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={18} style={{ color: 'hsl(var(--accent-secondary))' }} /> Push Notifications
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Event Reminders</span>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>Notify me about upcoming workshops and cultural events</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.events}
                      onChange={() => handlePreferenceToggle('events')}
                      style={{ width: '20px', height: '20px', accentColor: 'hsl(var(--accent-primary))' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Career Alerts</span>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>Notify me when new internships matching my skills are posted</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.internships}
                      onChange={() => handlePreferenceToggle('internships')}
                      style={{ width: '20px', height: '20px', accentColor: 'hsl(var(--accent-primary))' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Application Status Updates</span>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>Notify me when an admin reviews my internship applications</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.applications}
                      onChange={() => handlePreferenceToggle('applications')}
                      style={{ width: '20px', height: '20px', accentColor: 'hsl(var(--accent-primary))' }}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? <Loader2 className="spinner" size={18} /> : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Bookmarked Events */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'hsl(var(--accent-primary))' }}>
                Saved Events
              </h2>
              {loadingHistory ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center' }}><Loader2 className="spinner" /></div>
              ) : bookmarkedEvents.length === 0 ? (
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>No bookmarked events.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {bookmarkedEvents.map((evt) => (
                    <div key={evt._id} className="glass-card" style={{ padding: '16px' }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.55rem', marginBottom: '0.5rem' }}>{evt.category}</span>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{evt.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>📍 {evt.venue}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bookmarked Internships */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'hsl(var(--accent-secondary))' }}>
                Saved Internships
              </h2>
              {loadingHistory ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center' }}><Loader2 className="spinner" /></div>
              ) : bookmarkedInternships.length === 0 ? (
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>No bookmarked careers.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {bookmarkedInternships.map((intern) => (
                    <div key={intern._id} className="glass-card" style={{ padding: '16px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.55rem', marginBottom: '0.5rem' }}>{intern.company}</span>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{intern.role}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>📍 {intern.location}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="glass-card" style={{ border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>
              My Applications
            </h2>

            {loadingHistory ? (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="spinner" /></div>
            ) : applications.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', padding: '2rem 0', textAlign: 'center' }}>
                You have not applied for any internships yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applications.map((app, index) => (
                  <div 
                    key={app.internship?._id || index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'hsl(var(--bg-secondary) / 0.5)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{app.internship?.role || 'Internship Role'}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        {app.internship?.company || 'Company Name'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        Applied: {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
