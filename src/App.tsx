import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'sonner'
import { NotFound } from './components/layout/NotFound'

// Import the new page components (adjust paths if necessary)
import Dashboard from './pages/Dashboard'
import CreateExam from './pages/CreateExamPage'
import ScannerPage from './pages/ScannerPage'

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <ConfirmProvider>
        {/* Set the basename so React Router handles the Vite subpath automatically */}
        <BrowserRouter basename="/godspeed">
          <Toaster position="top-center" richColors theme="system" />

          <Routes>
            {/* The main dashboard listing all exams */}
            <Route path="/" element={<Dashboard />} />

            {/* The rapid key importer / exam creation screen */}
            <Route path="/create" element={<CreateExam />} />

            {/* The scanner view, utilizing dynamic routing to fetch the correct exam key */}
            <Route path="/scan/:examId" element={<ScannerPage />} />

            {/* Catch-all for 404s */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ThemeProvider>
  )
}

export default App