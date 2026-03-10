import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SidebarLayout } from './components/SidebarLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import ChartOfAccounts from './pages/ChartOfAccounts';
import NewProcessing from './pages/NewProcessing';
import History from './pages/History';
import StatementDetails from './pages/StatementDetails';
import Settings from './pages/Settings';
import AccountingProcesses from './pages/AccountingProcesses';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';
import './App.css';

// Componente para proteger rotas
const ProtectedRoute = ({ children, user, requiredRole }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.perfil !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token salvo
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#13141F',
            color: '#F8FAFC',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      />
      <BrowserRouter>
        {!user ? (
          // Rotas públicas - Landing Page com Login
          <Routes>
            <Route path="/login" element={<LandingPage onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          // Rotas protegidas - Sistema
          <SidebarLayout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/empresas" element={<Companies user={user} />} />
              <Route path="/plano-contas" element={<ChartOfAccounts user={user} />} />
              <Route path="/novo-processamento" element={<NewProcessing user={user} />} />
              <Route path="/historico" element={<History user={user} />} />
              <Route path="/historico/:id" element={<StatementDetails user={user} />} />
              <Route path="/processamentos" element={<AccountingProcesses user={user} />} />
              
              {/* Rotas apenas para Administrador */}
              <Route 
                path="/usuarios" 
                element={
                  <ProtectedRoute user={user} requiredRole="administrador">
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/logs" 
                element={
                  <ProtectedRoute user={user} requiredRole="administrador">
                    <ActivityLogs />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuracoes" 
                element={
                  <ProtectedRoute user={user} requiredRole="administrador">
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SidebarLayout>
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;
