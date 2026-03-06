import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, FileSpreadsheet, Upload, History, Settings, LogOut, Calendar, RefreshCw } from 'lucide-react';

export const SidebarLayout = ({ children }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/empresas', icon: Building2, label: 'Empresas' },
    { path: '/plano-contas', icon: FileSpreadsheet, label: 'Plano de Contas' },
    { path: '/novo-processamento', icon: Upload, label: 'Novo Processamento' },
    { path: '/conversor-ofx', icon: RefreshCw, label: 'Conversor OFX' },
    { path: '/processamentos', icon: Calendar, label: 'Processamentos' },
    { path: '/historico', icon: History, label: 'Histórico Extratos' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F1016] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <h1 className="font-heading text-xl font-bold text-white">Agente Contábil</h1>
          <p className="text-xs text-slate-500 mt-1">Sistema Domínio</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Contador</p>
              <p className="text-xs text-slate-500">contador@email.com</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};