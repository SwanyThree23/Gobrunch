import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Feed from './pages/Feed';
import VideoPlayer from './pages/VideoPlayer';
import LiveRooms from './pages/LiveRooms';
import Room from './pages/Room';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import SharedContent from './pages/SharedContent';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Feed />} />
        <Route path="video/:id" element={<VideoPlayer />} />
        <Route path="live" element={<LiveRooms />} />
        <Route path="room/:id" element={<Room />} />
        <Route path="user/:username" element={<Profile />} />
        <Route path="share/:token" element={<SharedContent />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
