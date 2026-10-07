import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { GuidesPage } from './pages/GuidesPage';
import { GuideDetailPage } from './pages/GuideDetailPage';
import { GuideFormPage } from './pages/GuideFormPage';
import { MyGuidesPage } from './pages/MyGuidesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminGuidesPage } from './pages/AdminGuidesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { HousingPage } from './pages/HousingPage';
import { CoursesPage } from './pages/CoursesPage';
import { ForumPage } from './pages/ForumPage';
import { ForumThreadPage } from './pages/ForumThreadPage';
import { ForumThreadFormPage } from './pages/ForumThreadFormPage';
import './App.css';

function AppShell() {
  const location = useLocation();
  const hideNav = location.pathname === '/onboarding';

  return (
    <>
      {!hideNav && <Navbar />}
      <main className="app-content">
        <Routes>
          <Route path="/" element={<GuidesPage />} />
          <Route path="/guides/:id" element={<GuideDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* reading the forum is public on the backend; posting needs a login */}
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:id" element={<ForumThreadPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/guides/new" element={<GuideFormPage />} />
            <Route path="/guides/:id/edit" element={<GuideFormPage />} />
            <Route path="/my-guides" element={<MyGuidesPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/housing" element={<HousingPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/forum/new" element={<ForumThreadFormPage />} />
            <Route path="/forum/:id/edit" element={<ForumThreadFormPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route path="/admin" element={<AdminGuidesPage />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
