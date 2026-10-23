import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';

// Lazy-loaded pages
const Admin            = lazy(() => import('./pages/Admin/Admin'));
const Performance      = lazy(() => import('./pages/Performance/Performance'));
const Landing          = lazy(() => import('./pages/Landing/Landing'));
const Login            = lazy(() => import('./pages/Login/Login'));
const Register         = lazy(() => import('./pages/Register/Register'));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const ResetPassword    = lazy(() => import('./pages/ResetPassword/ResetPassword'));
const Dashboard        = lazy(() => import('./pages/Dashboard/Dashboard'));
const Projects         = lazy(() => import('./pages/Projects/Projects'));
const ProjectDetails   = lazy(() => import('./pages/ProjectDetails/ProjectDetails'));
const Prediction       = lazy(() => import('./pages/Prediction/Prediction'));
const PredictionHistory = lazy(() => import('./pages/PredictionHistory/PredictionHistory'));
const PredictionDetail = lazy(() => import('./pages/PredictionHistory/PredictionDetail'));
const Analytics        = lazy(() => import('./pages/Analytics/Analytics'));
const Reports          = lazy(() => import('./pages/Reports/Reports'));
const Settings         = lazy(() => import('./pages/Settings/Settings'));
const About            = lazy(() => import('./pages/About/About'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <LoadingSpinner size="lg" />
  </div>
);

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/"                      element={<Landing />} />
            <Route path="/login"                 element={<Login />} />
            <Route path="/register"              element={<Register />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected */}
            <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects"     element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
            <Route path="/prediction"   element={<ProtectedRoute><Prediction /></ProtectedRoute>} />
            <Route path="/predictions"  element={<ProtectedRoute><PredictionHistory /></ProtectedRoute>} />
            <Route path="/predictions/:id" element={<ProtectedRoute><PredictionDetail /></ProtectedRoute>} />
            <Route path="/analytics"    element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/reports"      element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/about"        element={<ProtectedRoute><About /></ProtectedRoute>} />
            <Route path="/performance"  element={<ProtectedRoute><Performance /></ProtectedRoute>} />
            <Route path="/admin"        element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
