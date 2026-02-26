import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DogProvider } from './context/DogContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/pet/:id" element={<PetDetails />} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/messages/:id" element={<PrivateRoute><MessageDetail /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/application/:id" element={<PrivateRoute><Application /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
        <Route path="/forum" element={<PrivateRoute><Forum /></PrivateRoute>} />
        <Route path="/forum/:id" element={<PrivateRoute><ForumDetail /></PrivateRoute>} />
        <Route path="/forum/history" element={<PrivateRoute><ForumHistory /></PrivateRoute>} />
        <Route path="/forum/create" element={<PrivateRoute><CreateTopic /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/admin-submissions" element={<PrivateRoute><AdminSubmissions /></PrivateRoute>} />
        <Route path="/submit-dog" element={<PrivateRoute><SubmitDog /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <DogProvider>
        <AppContent />
      </DogProvider>
    </AuthProvider>
  );
}

export default App;
