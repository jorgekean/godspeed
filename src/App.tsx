import { BrowserRouter, Route, Routes } from 'react-router-dom'
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
import ScannerPage from './pages/ScannerPage'
import Help from './pages/Help'
import EditExam from './pages/EditExamPage'
import SectionsPage from './pages/SectionPage'
import StudentsPage from './pages/StudentsPage'
import LandingPage from './pages/LandingPage'
import { AuthProvider } from './contexts/AuthContext'
import AccountPage from './pages/AccountPage'
import SmartScannerPage from './pages/SmartScannerPage'
import ExamResultsPage from './pages/ExamResultsPage'

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <ConfirmProvider>
        <AuthProvider>
          {/* Set the basename so React Router handles the Vite subpath automatically */}
          <BrowserRouter basename="">
            <Toaster position="top-center" richColors theme="system" />

            <Routes>

              <Route path="/" element={<LandingPage />} />

              {/* ========================================== */}
            /* 1. CORE LAYOUT ROUTES (With Bottom Nav / Sidebar) */
              {/* ========================================== */}
              <Route element={<AppLayout />}>
                {/* The main dashboard listing all exams */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sections" element={<SectionsPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/account" element={<AccountPage />} />
                {/* Help & Workflow guide */}
                <Route path="/help" element={<Help />} />
              </Route>

              {/* ========================================== */}
            /* 2. FULL SCREEN ROUTES (No Navigation Bars) */
              {/* ========================================== */}
              {/* The rapid key importer / exam creation screen */}
              <Route path="/create" element={<CreateExam />} />

              {/* Exam Editing */}
              <Route path="/edit/:examId" element={<EditExam />} />

              <Route path="/exams/:examId/results" element={<ExamResultsPage />} />

              {/* The scanner view, utilizing dynamic routing to fetch the correct exam key */}
              <Route path="/scan/:examId" element={<SmartScannerPage />} />

              {/* Catch-all for 404s */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ConfirmProvider>
    </ThemeProvider>
  )
}

export default App