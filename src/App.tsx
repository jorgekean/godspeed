import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import './App.css'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'sonner'
import { NotFound } from './components/layout/NotFound'

// Layouts
import AppLayout from './components/layout/AppLayout' // <-- Import the new layout here

// Import the page components
import Dashboard from './pages/Dashboard'
import CreateExam from './pages/CreateExamPage'
import Help from './pages/Help'
import EditExam from './pages/EditExamPage'
import SectionsPage from './pages/SectionPage'
import StudentsPage from './pages/StudentsPage'
import PeriodsPage from './pages/PeriodsPage'
import SubjectsPage from './pages/SubjectsPage'
import GradeLevelsPage from './pages/GradeLevelsPage'
import TemplatesPage from './pages/TemplatesPage'
import GlobalScannerPage from './pages/GlobalScannerPage'
import LandingPage from './pages/LandingPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import AccountPage from './pages/AccountPage'
import ExamResultsPage from './pages/ExamResultsPage'
import SmartScannerPage from './pages/SmartScannerPage'
import NoticesPage from './pages/NoticesPage'
import UserManualPage from './pages/UserManualPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return null; // Or a loading spinner

  if (!currentUser) {
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <ConfirmProvider>
        <AuthProvider>
          <SyncProvider>
            {/* Set the basename so React Router handles the Vite subpath automatically */}
            <BrowserRouter basename="">
              <Toaster position="top-center" richColors theme="system" />

              <Routes>

                <Route path="/landing" element={<LandingPage />} />

                {/* ========================================== */}
                {/* 1. CORE LAYOUT ROUTES (With Bottom Nav / Sidebar) */}
                {/* ========================================== */}
                <Route element={<AppLayout />}>
                  {/* Publicly accessible documentation */}
                  <Route path="/help" element={<Help />} />
                  <Route path="/manual" element={<UserManualPage />} />
                  <Route path="/notices" element={<NoticesPage />} />

                  {/* Protected core app routes */}
                  <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/sections" element={<SectionsPage />} />
                    <Route path="/students" element={<StudentsPage />} />
                    <Route path="/periods" element={<PeriodsPage />} />
                    <Route path="/subjects" element={<SubjectsPage />} />
                    <Route path="/grades" element={<GradeLevelsPage />} />
                    <Route path="/templates" element={<TemplatesPage />} />
                    <Route path="/account" element={<AccountPage />} />
                  </Route>
                </Route>

                {/* ========================================== */}
                {/* 2. FULL SCREEN ROUTES (No Navigation Bars) */}
                {/* ========================================== */}
                {/* The rapid key importer / exam creation screen */}
                <Route path="/create" element={<ProtectedRoute><CreateExam /></ProtectedRoute>} />

                {/* Exam Editing */}
                <Route path="/edit/:examId" element={<ProtectedRoute><EditExam /></ProtectedRoute>} />

                <Route path="/exams/:examId/results" element={<ProtectedRoute><ExamResultsPage /></ProtectedRoute>} />

                {/* The scanner view, utilizing dynamic routing to fetch the correct exam key */}
                <Route path="/scan/:examId" element={<ProtectedRoute><SmartScannerPage /></ProtectedRoute>} />
                <Route path="/scan" element={<ProtectedRoute><GlobalScannerPage /></ProtectedRoute>} />

                {/* Catch-all for 404s */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SyncProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ThemeProvider>
  )
}

export default App