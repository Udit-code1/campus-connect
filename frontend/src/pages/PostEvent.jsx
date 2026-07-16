import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Tag, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { selectCurrentUser } from '../store/authSlice';
import api from '../services/api';

export const PostEvent = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    society: user?.societyName || '',
    date: '',
    endDate: '',
    venue: '',
    category: 'technical',
    tags: '',
    maxCapacity: 0,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        maxCapacity: Number(formData.maxCapacity) || 0,
      };

      const res = await api.post('/events', payload);
      if (res.data?.success) {
        alert('Event submitted successfully! It is pending approval by college admin.');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem 6rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="radial-bg"></div>

      {/* Back Link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Feed
        </Link>
      </div>

      <div className="glass-card" style={{ border: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
          Post Campus Event
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginBottom: '2rem' }}>
          Submit details for approval by the college administrator
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Event Title</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="e.g. Annual Tech Symposium 2026" 
              className="form-input" 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Society / Organizing Body</label>
              <input 
                type="text" 
                name="society" 
                value={formData.society} 
                onChange={handleChange} 
                placeholder="e.g. Coding Society" 
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                className="form-input"
              >
                <option value="technical">Technical</option>
                <option value="cultural">Cultural</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="sports">Sports</option>
                <option value="social">Social/Cause</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Describe the event, eligibility, key events, and contact details..." 
              className="form-input" 
              rows={5} 
              style={{ resize: 'vertical' }}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Start Date & Time</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'hsl(var(--text-muted))' }} />
                <input 
                  type="datetime-local" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange} 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">End Date & Time (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'hsl(var(--text-muted))' }} />
                <input 
                  type="datetime-local" 
                  name="endDate" 
                  value={formData.endDate} 
                  onChange={handleChange} 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Venue Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'hsl(var(--text-muted))' }} />
                <input 
                  type="text" 
                  name="venue" 
                  value={formData.venue} 
                  onChange={handleChange} 
                  placeholder="e.g. Auditorium Hall C" 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Maximum Attendee Capacity (0 for Unlimited)</label>
              <div style={{ position: 'relative' }}>
                <Users size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'hsl(var(--text-muted))' }} />
                <input 
                  type="number" 
                  name="maxCapacity" 
                  value={formData.maxCapacity} 
                  onChange={handleChange} 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  min="0"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Tags (Comma Separated)</label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'hsl(var(--text-muted))' }} />
              <input 
                type="text" 
                name="tags" 
                value={formData.tags} 
                onChange={handleChange} 
                placeholder="e.g. coding, hackathon, webdev, competition" 
                className="form-input" 
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', height: '44px', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" size={18} /> : 'Submit Event Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostEvent;
