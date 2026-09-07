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
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { FarmersPage } from './pages/FarmersPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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

          {/* Anything else goes to the dashboard, which itself
              bounces to /login when there is no session. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
