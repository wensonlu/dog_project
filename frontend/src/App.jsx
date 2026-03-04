import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DogProvider } from './context/DogContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import PermissionRoute from './components/PermissionRoute';
import { PERMISSIONS } from './constants/permissions';
import Home from './pages/Home';
import PetDetails from './pages/PetDetails';
import Messages from './pages/Messages';
import MessageDetail from './pages/MessageDetail';
import Profile from './pages/Profile';
import Application from './pages/Application';
import Favorites from './pages/Favorites';
import Forum from './pages/Forum';
import ForumDetail from './pages/ForumDetail';
import ForumHistory from './pages/ForumHistory';
import CreateTopic from './pages/CreateTopic';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import AdminSubmissions from './pages/AdminSubmissions';
import SubmitDog from './pages/SubmitDog';
import PermissionsManagement from './pages/PermissionsManagement';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <DogProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/pet/:id" element={<PetDetails />} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/messages/:id" element={<PrivateRoute><MessageDetail /></PrivateRoute>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/application/:id" element={<PrivateRoute><Application /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/:id" element={<ForumDetail />} />
        <Route path="/forum/history" element={<PrivateRoute><ForumHistory /></PrivateRoute>} />
        <Route path="/forum/create" element={<PrivateRoute><CreateTopic /></PrivateRoute>} />
        <Route path="/admin" element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_ADOPTIONS}><Admin /></PermissionRoute>} />
        <Route path="/admin-submissions" element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_SUBMISSIONS}><AdminSubmissions /></PermissionRoute>} />
        <Route path="/submit-dog" element={<PrivateRoute><SubmitDog /></PrivateRoute>} />
        <Route path="/permissions-management" element={<PermissionRoute requiredPermission={PERMISSIONS.SUPER_ADMIN}><PermissionsManagement /></PermissionRoute>} />
      </Routes>
    </DogProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
