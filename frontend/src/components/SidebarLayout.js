import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  FileSpreadsheet, 
  Upload, 
  History, 
  Settings, 
  LogOut, 
  Calendar,
  Users,
  Activity,
  Shield,
  User
} from 'lucide-react';

export const SidebarLayout = ({ children, user, onLogout }) => {
  const isAdmin = user?.perfil === 'administrador';
  
  // Itens de navegação base (todos os usuários)
  const baseNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/empresas', icon: Building2, label: 'Empresas' },
    { path: '/plano-contas', icon: FileSpreadsheet, label: 'Plano de Contas' },
    { path: '/novo-processamento', icon: Upload, label: 'Novo Processamento' },
    { path: '/processamentos', icon: Calendar, label: 'Processamentos' },
    { path: '/historico', icon: History, label: 'Histórico Extratos' },
  ];
  
  // Itens apenas para administrador
  const adminNavItems = [
    { path: '/usuarios', icon: Users, label: 'Gerenciar Usuários' },
    { path: '/logs', icon: Activity, label: 'Log de Atividades' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];
  
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;
  
  const getUserInitials = (nome) => {
    if (!nome) return 'U';
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F1016] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <h1 className="font-heading text-xl font-bold text-white">Domínio Bridge</h1>
          <p className="text-xs text-slate-500 mt-1">Conciliação Contábil</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => (
            <React.Fragment key={item.path}>
              {/* Separador antes dos itens de admin */}
              {isAdmin && index === baseNavItems.length && (
                <div className="pt-4 pb-2">
                  <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Administração
                  </div>
                </div>
              )}
              <NavLink
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
            </React.Fragment>
          ))}
        </nav>
        
        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
              isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'
            }`}>
              {getUserInitials(user?.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nome || 'Usuário'}</p>
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <Shield size={10} className="text-purple-400" />
                ) : (
                  <User size={10} className="text-indigo-400" />
                )}
                <p className="text-xs text-slate-500 capitalize">{user?.perfil || 'colaborador'}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            data-testid="logout-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#0B0D14]">
        {children}
      </main>
    </div>
  );
};
