import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogIn, UserPlus, KeyRound, Mail, Sparkles, User, GraduationCap, Compass } from 'lucide-react';
import { setCredentials, selectIsAuthenticated } from '../store/authSlice';
import api from '../services/api';

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [searchParams] = useSearchParams();

  // Mode state: 'login' or 'register'
  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    year: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOAuth = () => {
    // Redirect browser to google oauth flow
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      
      let payload;
      if (isRegister) {
        payload = { ...formData };
        if (payload.role !== 'student') {
          delete payload.department;
          delete payload.year;
        }
        if (payload.role !== 'society_admin') {
          delete payload.societyName;
        }
      } else {
        payload = { email: formData.email, password: formData.password };
      }
      
      const response = await api.post(endpoint, payload);

      if (response.data?.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        dispatch(setCredentials({ user, accessToken, refreshToken }));
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && validationErrors.length > 0) {
        setErrorMsg(validationErrors.map(e => `${e.field}: ${e.message}`).join(', '));
      } else {
        setErrorMsg(err.response?.data?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Background Gradient */}
      <div className="radial-bg"></div>

      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '480px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '3rem'
      }}>
        {/* Title / Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 className="gradient-text-sec" style={{
            fontSize: '2rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            marginBottom: '0.5rem'
          }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            {isRegister ? 'Join the college campus connector network' : 'Connect with campus events and career opportunities'}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'hsl(var(--danger) / 0.15)',
            border: '1px solid hsl(var(--danger) / 0.3)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '12px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isRegister && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'hsl(var(--text-muted))' }} />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe" 
                  className="form-input" 
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">College Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'hsl(var(--text-muted))' }} />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@college.edu" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'hsl(var(--text-muted))' }} />
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          {isRegister && (
            <>
              {/* Role Select */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Register As</label>
                <div style={{ position: 'relative' }}>
                  <Compass size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'hsl(var(--text-muted))' }} />
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-input"
                    style={{ paddingLeft: '44px', appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    <option value="student">Student</option>
                    <option value="society_admin">Society Admin</option>
                    <option value="college_admin">College Admin</option>
                  </select>
                </div>
              </div>

              {formData.role === 'student' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g. Computer Science" 
                      className="form-input" 
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Year of Study</label>
                    <select 
                      name="year"
                      value={formData.year}
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

              {formData.role === 'society_admin' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Society / Club Name</label>
                  <input 
                    type="text" 
                    name="societyName"
                    value={formData.societyName || ''}
                    onChange={handleChange}
                    placeholder="e.g. Coding Society" 
                    className="form-input" 
                    required
                  />
                </div>
              )}
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', height: '48px', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            ) : isRegister ? (
              <>
                <UserPlus size={18} /> Register
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            margin: '0.5rem 0',
            color: 'hsl(var(--text-muted))',
            fontSize: '0.8rem'
          }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--glass-border)' }} />
            <span>OR</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          </div>

          {/* Google OAuth Login Button */}
          <button 
            type="button"
            onClick={handleOAuth}
            className="btn btn-secondary"
            style={{ width: '100%', height: '48px' }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '6px' }} viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.483 0-6.321-2.838-6.321-6.321s2.838-6.321 6.321-6.321c1.556 0 2.977.568 4.092 1.503l3.053-3.053C18.91 2.215 15.79 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.897 0 10.87-4.223 10.87-11.24 0-.668-.073-1.36-.205-1.955H12.24z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'hsl(var(--text-secondary))' }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button 
            onClick={() => setIsRegister(!isRegister)}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--accent-secondary))',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Sign In' : 'Register now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
