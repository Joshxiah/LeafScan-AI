/**
 * Application root for the LeafScan AI admin platform.
 *
 * Sets up:
 *   - BrowserRouter  : URL-based navigation
 *   - AuthProvider   : global sign-in state
 *   - Routes         : which component renders for which path
 *
 * Dashboard, Reports, and Farmers are real pages. The rest of the
 * sidebar links are placeholders until their phases.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { FarmersPage } from './pages/FarmersPage';
import { AgriculturistsPage } from './pages/AgriculturistsPage';
import { DetectionsPage } from './pages/DetectionsPage';
import { DiseasesPage } from './pages/DiseasesPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmers"
            element={
              <ProtectedRoute>
                <FarmersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agriculturists"
            element={
              <ProtectedRoute>
                <AgriculturistsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/detections"
            element={
              <ProtectedRoute>
                <DetectionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/diseases"
            element={
              <ProtectedRoute>
                <DiseasesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <RecommendationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Anything else goes to the dashboard, which itself
              bounces to /login when there is no session. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
