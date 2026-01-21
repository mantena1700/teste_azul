import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PatientProfile } from './pages/PatientProfile';
import { PatientsList } from './pages/PatientsList';
import { SessionRunner } from './pages/SessionRunner';
import { Reports } from './pages/Reports';
import { Communication } from './pages/Communication';
import { TimeClock } from './pages/TimeClock';
import { TeamManagement } from './pages/TeamManagement';
import { ActivityLibrary } from './pages/ActivityLibrary';
import { Financial } from './pages/Financial';
import { SaaSAdmin } from './pages/SaaSAdmin';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<PatientsList />} />
              <Route path="patient/:id" element={<PatientProfile />} /> {/* Dynamic Route */}
              <Route path="session" element={<SessionRunner />} />
              <Route path="activities" element={<ActivityLibrary />} />
              <Route path="reports" element={<Reports />} />
              <Route path="communication" element={<Communication />} />
              <Route path="timeclock" element={<TimeClock />} />
              <Route path="team" element={<TeamManagement />} />
              <Route path="financial" element={<Financial />} />
              <Route path="saas-admin" element={<SaaSAdmin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;