import { BrowserRouter, Route, Routes } from 'react-router-dom';
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
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<GuidesPage />} />
            <Route path="/guides/:id" element={<GuideDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/guides/new" element={<GuideFormPage />} />
              <Route path="/guides/:id/edit" element={<GuideFormPage />} />
              <Route path="/my-guides" element={<MyGuidesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
              <Route path="/admin" element={<AdminGuidesPage />} />
            </Route>
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
