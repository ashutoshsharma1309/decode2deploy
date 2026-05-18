import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import DashboardLayout from "./components/ui/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import Settings from "./pages/Settings";
import Repos from "./pages/Repos";
import RepoHealth from "./pages/RepoHealth";
import CommitDiff from "./pages/CommitDiff";
import Complexity from "./pages/Complexity";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import ErrorBoundary from "./components/ui/ErrorBoundary";

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route
                path="/dashboard"
                element={<Navigate to="/dashboard/repos" replace />}
              />
              <Route
                path="/dashboard/repos"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Repos />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/repo-health"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <RepoHealth />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/repo-health/:repoId"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <RepoHealth />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/commit-diff/:repoId/:sha"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <CommitDiff />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/complexity"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Complexity />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Settings />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <VercelAnalytics />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
