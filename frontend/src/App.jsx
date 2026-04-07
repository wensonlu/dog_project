import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DogProvider } from './context/DogContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ForumListProvider } from './context/ForumListContext';
import PermissionRoute from './components/PermissionRoute';
import { PERMISSIONS } from './constants/permissions';
import Home from './pages/Home';
import PetDetails from './pages/PetDetails';
import Messages from './pages/Messages';
import MessageDetail from './pages/MessageDetail';
import MessageWith from './pages/MessageWith';
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
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Wiki from './pages/Wiki';
import WikiArticle from './pages/WikiArticle';
import WikiSearch from './pages/WikiSearch';
import EditProfile from './pages/EditProfile';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <DogProvider>
      <ForumListProvider>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/pet/:id" element={<PetDetails />} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/messages/with/:userId" element={<PrivateRoute><MessageWith /></PrivateRoute>} />
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
        
        {/* 故事墙路由 */}
        <Route path="/stories" element={<Stories />} />
        <Route path="/stories/:id" element={<StoryDetail />} />
        
        {/* 百科路由 */}
        <Route path="/wiki" element={<Wiki />} />
        <Route path="/wiki/article/:slug" element={<WikiArticle />} />
        <Route path="/wiki/search" element={<WikiSearch />} />

        {/* 编辑资料 */}
        <Route path="/edit-profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
        
        </Routes>
      </ForumListProvider>
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
