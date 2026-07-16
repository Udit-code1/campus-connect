import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Shield, Users, CheckCircle, XCircle, FileText, ChevronRight, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';

export const AdminPanel = () => {
  const user = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState('events'); // events, internships
  const [pendingEvents, setPendingEvents] = useState([]);
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state for posting internships
  const [postData, setPostData] = useState({
    company: '',
    role: '',
    description: '',
    stipendAmount: 0,
    stipendPaid: true,
    duration: '',
    skills: '',
    deadline: '',
    location: '',
    type: 'onsite',
  });

  const [submittingInternship, setSubmittingInternship] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const res = await api.get('/events?status=upcoming');
        if (res.data?.success) {
          // Filter only non-approved events
          const unapproved = res.data.data.events.filter((e) => !e.isApproved);
          setPendingEvents(unapproved);
        }
      } else if (activeTab === 'internships') {
        const res = await api.get('/internships');
        if (res.data?.success) {
          setInternships(res.data.data.internships);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (id) => {
    try {
      const res = await api.put(`/events/${id}`, { isApproved: true });
      if (res.data?.success) {
        setPendingEvents((prev) => prev.filter((e) => e._id !== id));
        alert('Event approved successfully and notification broadcasted!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectEvent = async (id) => {
    if (window.confirm('Are you sure you want to decline and remove this event?')) {
      try {
        await api.delete(`/events/${id}`);
        setPendingEvents((prev) => prev.filter((e) => e._id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateStatus = async (internshipId, applicantId, status) => {
    try {
      const res = await api.patch(`/internships/${internshipId}/applicants/${applicantId}`, { status });
      if (res.data?.success) {
        alert(`Application status updated to ${status}`);
        // Refresh details
        const detailsRes = await api.get(`/internships/${internshipId}`);
        if (detailsRes.data?.success) {
          setSelectedInternship(detailsRes.data.data.internship);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchApplicants = async (id) => {
    try {
      const res = await api.get(`/internships/${id}`);
      if (res.data?.success) {
        setSelectedInternship(res.data.data.internship);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setPostData({ ...postData, [e.target.name]: value });
  };

  const handlePostInternship = async (e) => {
    e.preventDefault();
    setSubmittingInternship(true);

    try {
      const payload = {
        company: postData.company,
        role: postData.role,
        description: postData.description,
        stipend: {
          amount: Number(postData.stipendAmount),
          isPaid: postData.stipendPaid,
        },
        duration: postData.duration,
        skills: postData.skills ? postData.skills.split(',').map((s) => s.trim()) : [],
        deadline: postData.deadline,
        location: postData.location,
        type: postData.type,
      };

      const res = await api.post('/internships', payload);
      if (res.data?.success) {
        alert('Internship posted successfully!');
        setPostData({
          company: '',
          role: '',
          description: '',
          stipendAmount: 0,
          stipendPaid: true,
          duration: '',
          skills: '',
          deadline: '',
          location: '',
          type: 'onsite',
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to post internship');
    } finally {
      setSubmittingInternship(false);
    }
  };

  if (user?.role !== 'college_admin') {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <Shield size={48} style={{ color: 'hsl(var(--danger))', marginBottom: '1rem' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Only College Administrators can view this panel.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 4rem', minHeight: '100vh', display: 'flex', gap: '2rem' }}>
      <div className="radial-bg"></div>

      {/* Tabs list */}
      <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          onClick={() => { setActiveTab('events'); setSelectedInternship(null); }} 
          className="btn btn-secondary"
          style={{
            justifyContent: 'flex-start',
            background: activeTab === 'events' ? 'hsl(var(--accent-primary) / 0.15)' : 'transparent',
            borderColor: activeTab === 'events' ? 'hsl(var(--accent-primary) / 0.3)' : 'transparent',
          }}
        >
          Approve Events
        </button>

        <button 
          onClick={() => { setActiveTab('internships'); }} 
          className="btn btn-secondary"
          style={{
            justifyContent: 'flex-start',
            background: activeTab === 'internships' ? 'hsl(var(--accent-primary) / 0.15)' : 'transparent',
            borderColor: activeTab === 'internships' ? 'hsl(var(--accent-primary) / 0.3)' : 'transparent',
          }}
        >
          Internships & Applicants
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {activeTab === 'events' && (
          <div className="glass-card" style={{ border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>
              Pending Event Approvals
            </h2>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner"></div></div>
            ) : pendingEvents.length === 0 ? (
              <div style={{ color: 'hsl(var(--text-muted))', padding: '2rem', textAlign: 'center' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 0.5rem', color: 'hsl(var(--success))' }} />
                <span>All events approved! No pending requests.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingEvents.map((event) => (
                  <div key={event._id} style={{
                    padding: '1.5rem',
                    background: 'hsl(var(--bg-secondary) / 0.5)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span className="badge badge-purple" style={{ fontSize: '0.6rem', marginBottom: '0.25rem' }}>
                        {event.category}
                      </span>
                      <h4 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{event.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        By {event.society} • Venue: {event.venue} • Date: {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleApproveEvent(event._id)} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                        Approve
                      </button>
                      <button onClick={() => handleRejectEvent(event._id)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'hsl(var(--danger))' }}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'internships' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedInternship ? '1fr 1fr' : '1fr', gap: '2rem' }}>
            {/* Column 1: Post Internship & List Internships */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Post form */}
              <div className="glass-card" style={{ border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Post New Role</h3>
                
                <form onSubmit={handlePostInternship} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Company Name</label>
                      <input type="text" name="company" value={postData.company} onChange={handleChange} className="form-input" required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Role Title</label>
                      <input type="text" name="role" value={postData.role} onChange={handleChange} className="form-input" required />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea name="description" value={postData.description} onChange={handleChange} className="form-input" rows={3} style={{ resize: 'vertical' }} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Stipend (INR/mo)</label>
                      <input type="number" name="stipendAmount" value={postData.stipendAmount} onChange={handleChange} className="form-input" required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Duration</label>
                      <input type="text" name="duration" value={postData.duration} placeholder="e.g. 3 Months" onChange={handleChange} className="form-input" required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Deadline Date</label>
                      <input type="date" name="deadline" value={postData.deadline} onChange={handleChange} className="form-input" required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Type</label>
                      <select name="type" value={postData.type} onChange={handleChange} className="form-input">
                        <option value="remote">Remote</option>
                        <option value="onsite">Onsite</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Location</label>
                      <input type="text" name="location" value={postData.location} placeholder="e.g. Bangalore" onChange={handleChange} className="form-input" required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Skills Required (Comma Separated)</label>
                      <input type="text" name="skills" value={postData.skills} placeholder="e.g. Node, React" onChange={handleChange} className="form-input" />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submittingInternship}>
                    {submittingInternship ? 'Posting...' : 'Post Listing'}
                  </button>
                </form>
              </div>

              {/* List of active listings */}
              <div className="glass-card" style={{ border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Active Listings</h3>
                {loading ? (
                  <div className="spinner"></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {internships.map((intern) => (
                      <div 
                        key={intern._id}
                        onClick={() => handleFetchApplicants(intern._id)}
                        style={{
                          padding: '12px 16px',
                          background: 'hsl(var(--bg-secondary) / 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{intern.company}</span>
                          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{intern.role}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--accent-secondary))' }}>
                          <span>{intern.applicants?.length || 0} applicants</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Applicants manager details (Conditional) */}
            {selectedInternship && (
              <div className="glass-card" style={{ border: '1px solid var(--glass-border)', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.35rem' }}>{selectedInternship.role}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{selectedInternship.company}</span>
                  </div>
                  <button onClick={() => setSelectedInternship(null)} className="btn btn-text" style={{ fontSize: '0.75rem' }}>Close</button>
                </div>

                {selectedInternship.applicants?.length === 0 ? (
                  <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '2rem 0' }}>No applicants yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedInternship.applicants?.map((app) => (
                      <div key={app.user?._id || app._id} style={{
                        padding: '1rem',
                        background: 'hsl(var(--bg-tertiary) / 0.4)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{app.user?.name || 'Applicant'}</span>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{app.user?.email}</span>
                          </div>

                          <span className={`badge ${app.status === 'accepted' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-purple'}`}>
                            {app.status}
                          </span>
                        </div>

                        {app.resumeUrl && (
                          <a 
                            href={app.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'fit-content', gap: '0.25rem' }}
                          >
                            <FileText size={14} /> View Resume
                          </a>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button 
                            onClick={() => handleUpdateStatus(selectedInternship._id, app.user?._id || app.user, 'accepted')}
                            className="btn btn-primary" 
                            style={{ flex: 1, padding: '6px', fontSize: '0.75rem', background: 'hsl(var(--success))' }}
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(selectedInternship._id, app.user?._id || app.user, 'shortlisted')}
                            className="btn btn-outline" 
                            style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                          >
                            Shortlist
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(selectedInternship._id, app.user?._id || app.user, 'rejected')}
                            className="btn btn-secondary" 
                            style={{ flex: 1, padding: '6px', fontSize: '0.75rem', color: 'hsl(var(--danger))' }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
