import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SidebarLayout } from './components/SidebarLayout';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import ChartOfAccounts from './pages/ChartOfAccounts';
import NewProcessing from './pages/NewProcessing';
import History from './pages/History';
import StatementDetails from './pages/StatementDetails';
import Settings from './pages/Settings';
import AccountingProcesses from './pages/AccountingProcesses';
// import OFXConverter from './pages/OFXConverter'; // STANDBY - Módulo desativado temporariamente
import './App.css';

function App() {
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
        <SidebarLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/empresas" element={<Companies />} />
            <Route path="/plano-contas" element={<ChartOfAccounts />} />
            <Route path="/novo-processamento" element={<NewProcessing />} />
            {/* <Route path="/conversor-ofx" element={<OFXConverter />} /> */} {/* STANDBY */}
            <Route path="/historico" element={<History />} />
            <Route path="/historico/:id" element={<StatementDetails />} />
            <Route path="/processamentos" element={<AccountingProcesses />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Routes>
        </SidebarLayout>
      </BrowserRouter>
    </div>
  );
}

export default App;