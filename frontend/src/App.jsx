import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './context/ThemeContext'
import AppShell from './layouts/AppShell'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import RecentActivityPage from './pages/RecentActivityPage'
import SettingsPage from './pages/SettingsPage'
import SignupPage from './pages/SignupPage'
import ProjectActivityTab from './pages/project/ProjectActivityTab'
import ProjectAskTab from './pages/project/ProjectAskTab'
import ProjectNotesTab from './pages/project/ProjectNotesTab'
import ProjectSearchTab from './pages/project/ProjectSearchTab'
import ProjectSourcesTab from './pages/project/ProjectSourcesTab'
import ProjectWorkspacePage from './pages/project/ProjectWorkspacePage'

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PublicLayout>
                <LandingPage />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicLayout>
                <LoginPage />
              </PublicLayout>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicLayout>
                <SignupPage />
              </PublicLayout>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/activity" element={<RecentActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/projects/:projectId" element={<ProjectWorkspacePage />}>
                <Route path="sources" element={<ProjectSourcesTab />} />
                <Route path="search" element={<ProjectSearchTab />} />
                <Route path="ask" element={<ProjectAskTab />} />
                <Route path="notes" element={<ProjectNotesTab />} />
                <Route path="activity" element={<ProjectActivityTab />} />
                <Route index element={<Navigate to="sources" replace />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
