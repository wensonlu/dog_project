import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DogProvider } from './context/DogContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ForumListProvider } from './context/ForumListContext';
import { TaskProvider } from './context/TaskContext';
import PermissionRoute from './components/PermissionRoute';
import { PERMISSIONS } from './constants/permissions';
import ChatAssistant from './components/ChatAssistant';
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
import WikiCategory from './pages/WikiCategory';
import WikiSearch from './pages/WikiSearch';
import EditProfile from './pages/EditProfile';
import FollowingAuthors from './pages/FollowingAuthors';
import ContentHub from './pages/ContentHub';
import Shop from './pages/Shop';
import ShopDetail from './pages/ShopDetail';
import ShopOrder from './pages/ShopOrder';
import ChallengeCheckin from './pages/ChallengeCheckin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  const location = useLocation();
  const isHomePath = location.pathname === '/';
  const isForumListPath = location.pathname === '/forum';
  const isShopPath = location.pathname === '/shop';
  const isContentPath = location.pathname === '/content';
  const isStoriesPath = location.pathname === '/stories';
  const isProfilePath = location.pathname === '/profile';
  const [mountedTabs, setMountedTabs] = useState(() => ({
    home: isHomePath,
    forum: isForumListPath,
    shop: isShopPath,
    content: isContentPath,
    stories: isStoriesPath,
    profile: isProfilePath,
  }));

  useEffect(() => {
    if (isHomePath) {
      setMountedTabs((prev) => ({ ...prev, home: true }));
    }
    if (isForumListPath) {
      setMountedTabs((prev) => ({ ...prev, forum: true }));
    }
    if (isShopPath) {
      setMountedTabs((prev) => ({ ...prev, shop: true }));
    }
    if (isContentPath) {
      setMountedTabs((prev) => ({ ...prev, content: true }));
    }
    if (isStoriesPath) {
      setMountedTabs((prev) => ({ ...prev, stories: true }));
    }
    if (isProfilePath) {
      setMountedTabs((prev) => ({ ...prev, profile: true }));
    }
  }, [isHomePath, isForumListPath, isShopPath, isContentPath, isStoriesPath, isProfilePath]);

  return (
    <DogProvider>
      <TaskProvider>
        <ForumListProvider>
          {mountedTabs.home && (
            <div style={{ display: isHomePath ? 'block' : 'none' }}>
              <Home isActive={isHomePath} />
            </div>
          )}
          {mountedTabs.forum && (
            <div style={{ display: isForumListPath ? 'block' : 'none' }}>
              <Forum isActive={isForumListPath} />
            </div>
          )}
          {mountedTabs.shop && (
            <div style={{ display: isShopPath ? 'block' : 'none' }}>
              <Shop />
            </div>
          )}
          {mountedTabs.content && (
            <div style={{ display: isContentPath ? 'block' : 'none' }}>
              <ContentHub />
            </div>
          )}
          {mountedTabs.stories && (
            <div style={{ display: isStoriesPath ? 'block' : 'none' }}>
              <Stories isActive={isStoriesPath} />
            </div>
          )}
          {mountedTabs.profile && (
            <div style={{ display: isProfilePath ? 'block' : 'none' }}>
              <Profile />
            </div>
          )}
          <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={null} />
        <Route path="/pet/:id" element={<PetDetails />} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/messages/with/:userId" element={<PrivateRoute><MessageWith /></PrivateRoute>} />
        <Route path="/messages/:id" element={<PrivateRoute><MessageDetail /></PrivateRoute>} />
        <Route path="/profile" element={null} />
        <Route path="/profile/following" element={<PrivateRoute><FollowingAuthors /></PrivateRoute>} />
        <Route path="/application/:id" element={<PrivateRoute><Application /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
        <Route path="/forum" element={null} />
        <Route path="/forum/:id" element={<ForumDetail />} />
        <Route path="/forum/history" element={<PrivateRoute><ForumHistory /></PrivateRoute>} />
        <Route path="/forum/create" element={<PrivateRoute><CreateTopic /></PrivateRoute>} />
        <Route path="/admin" element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_ADOPTIONS}><Admin /></PermissionRoute>} />
        <Route path="/admin-submissions" element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_SUBMISSIONS}><AdminSubmissions /></PermissionRoute>} />
        <Route path="/submit-dog" element={<PrivateRoute><SubmitDog /></PrivateRoute>} />
        <Route path="/permissions-management" element={<PermissionRoute requiredPermission={PERMISSIONS.SUPER_ADMIN}><PermissionsManagement /></PermissionRoute>} />
        
        {/* 故事墙路由 */}
        <Route path="/stories" element={null} />
        <Route path="/stories/:id" element={<StoryDetail />} />

        {/* 内容合并入口 */}
        <Route path="/content" element={null} />
        
        {/* 百科路由 */}
        <Route path="/wiki" element={<Wiki />} />
        <Route path="/wiki/category/:slug" element={<WikiCategory />} />
        <Route path="/wiki/article/:slug" element={<WikiArticle />} />
        <Route path="/wiki/search" element={<WikiSearch />} />

        {/* 商城路由 */}
        <Route path="/shop" element={null} />
        <Route path="/shop/:id" element={<ShopDetail />} />
        <Route path="/shop/order" element={<ShopOrder />} />
        <Route path="/challenge/:id" element={<PrivateRoute><ChallengeCheckin /></PrivateRoute>} />

        {/* 编辑资料 */}
          <Route path="/edit-profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
        
          </Routes>
          <ChatAssistant />
        </ForumListProvider>
      </TaskProvider>
    </DogProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
