import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import useSocket from './hooks/useSocket';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import EventDetail from './pages/EventDetail';
import InternshipList from './pages/InternshipList';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import PostEvent from './pages/PostEvent';
import AdminPanel from './pages/AdminPanel';

function App() {
  // Activate WebSockets for real-time notifications when logged in
  useSocket();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'hsl(var(--bg-primary))' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* Protected Routes (all authenticated users) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/internships" element={<InternshipList />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Protected Routes (Society & College Admins) */}
          <Route element={<ProtectedRoute allowedRoles={['society_admin', 'college_admin']} />}>
            <Route path="/events/post" element={<PostEvent />} />
          </Route>

          {/* Protected Routes (College Admins only) */}
          <Route element={<ProtectedRoute allowedRoles={['college_admin']} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
