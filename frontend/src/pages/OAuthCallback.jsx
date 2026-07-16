import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import axios from 'axios';

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      console.error('OAuth parameters missing');
      navigate('/login?error=oauth_failed');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // Fetch user details with the newly acquired token
    axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then((res) => {
        if (res.data?.success) {
          const user = res.data.data.user;
          // Store credentials in Redux and localStorage
          dispatch(setCredentials({ user, accessToken, refreshToken }));
          navigate('/');
        } else {
          navigate('/login?error=oauth_failed');
        }
      })
      .catch((err) => {
        console.error('OAuth validation error:', err);
        navigate('/login?error=oauth_failed');
      });
  }, [searchParams, dispatch, navigate]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      background: 'hsl(var(--bg-primary))'
    }}>
      <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
        Completing secure sign-in, please wait...
      </p>
    </div>
  );
};

export default OAuthCallback;
