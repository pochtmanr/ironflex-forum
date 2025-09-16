import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ForumHome from './components/Forum/ForumHome';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Encyclopedia from './components/Pages/Encyclopedia';
import Novice from './components/Pages/Novice';
import UserProfile from './components/Profile/UserProfile';
import Settings from './components/Settings/Settings';
import ProfileSettings from './components/Settings/ProfileSettings';
import SecuritySettings from './components/Settings/SecuritySettings';
import NotificationSettings from './components/Settings/NotificationSettings';
import PrivacySettings from './components/Settings/PrivacySettings';
import CreateTopic from './components/Forum/CreateTopic';
import TopicView from './components/Forum/TopicView';
import CategoryView from './components/Forum/CategoryView';
import './App.css';
import Articles from './components/Pages/Articles';
import ArticleView from './components/Pages/ArticleView';
import Trainings from './components/Pages/Trainings';
import TrainingView from './components/Pages/TrainingView';
import AdminContent from './components/Pages/AdminContent';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App" style={{ position: 'relative', minHeight: '100%', top: '0px', padding: '0px ' }}>
          <Header />
          
          <Routes>
            <Route path="/" element={<ForumHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/encyclopedia" element={<Encyclopedia />} />
            <Route path="/enciklopediya-bodibildinga" element={<Encyclopedia />} />
            <Route path="/novichkam" element={<Novice />} />
            <Route path="/novice" element={<Novice />} />
            <Route path="/create-topic" element={<CreateTopic />} />
            <Route path="/topic/:topicId" element={<TopicView />} />
            <Route path="/category/:categoryId" element={<CategoryView />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slugOrId" element={<ArticleView />} />
            <Route path="/trainings" element={<Trainings />} />
            <Route path="/trainings/:slugOrId" element={<TrainingView />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/settings" element={<Settings />}>
              <Route index element={<ProfileSettings />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="notifications" element={<NotificationSettings />} />
              <Route path="privacy" element={<PrivacySettings />} />
            </Route>
          </Routes>
          
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;