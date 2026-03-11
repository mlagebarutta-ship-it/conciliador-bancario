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
  User,
  Globe,
  Crown
} from 'lucide-react';

export const SidebarLayout = ({ children, user, onLogout }) => {
  const isSuperAdmin = user?.perfil === 'super_admin';
  const isAdminTenant = user?.perfil === 'admin_tenant';
  const isAdmin = isAdminTenant || user?.perfil === 'administrador';
  
  // Itens de navegação para Super Admin
  const superAdminNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/superadmin/escritorios', icon: Building2, label: 'Escritórios' },
    { path: '/superadmin/usuarios', icon: Users, label: 'Usuários' },
  ];
  
  // Itens de navegação base (todos os usuários, exceto super_admin)
  const baseNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/empresas', icon: Building2, label: 'Empresas' },
    { path: '/plano-contas', icon: FileSpreadsheet, label: 'Plano de Contas' },
    { path: '/novo-processamento', icon: Upload, label: 'Novo Processamento' },
    { path: '/processamentos', icon: Calendar, label: 'Processamentos' },
    { path: '/historico', icon: History, label: 'Histórico Extratos' },
  ];
  
  // Itens apenas para administrador do escritório
  const adminNavItems = [
    { path: '/usuarios', icon: Users, label: 'Gerenciar Usuários' },
    { path: '/logs', icon: Activity, label: 'Log de Atividades' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];
  
  // Selecionar itens de navegação baseado no perfil
  let navItems = [];
  if (isSuperAdmin) {
    navItems = superAdminNavItems;
  } else {
    navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;
  }
  
  const getUserInitials = (nome) => {
    if (!nome) return 'U';
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };
  
  const getProfileLabel = (perfil) => {
    switch(perfil) {
      case 'super_admin': return 'Super Admin';
      case 'admin_tenant': return 'Administrador';
      case 'administrador': return 'Administrador';
      case 'colaborador': return 'Colaborador';
      default: return perfil;
    }
  };
  
  const getProfileColor = (perfil) => {
    switch(perfil) {
      case 'super_admin': return 'bg-gradient-to-br from-amber-500 to-orange-600';
      case 'admin_tenant': return 'bg-gradient-to-br from-purple-500 to-indigo-600';
      case 'administrador': return 'bg-gradient-to-br from-purple-500 to-indigo-600';
      default: return 'bg-gradient-to-br from-indigo-500 to-blue-600';
    }
  };
  
  const getProfileIcon = (perfil) => {
    switch(perfil) {
      case 'super_admin': return <Crown size={10} className="text-amber-400" />;
      case 'admin_tenant': return <Shield size={10} className="text-purple-400" />;
      case 'administrador': return <Shield size={10} className="text-purple-400" />;
      default: return <User size={10} className="text-indigo-400" />;
    }
  };
  
  return (
    <div className="flex h-screen">
      {/* Sidebar - Fixo na tela */}
      <aside className="w-64 bg-[#0F1016] border-r border-white/5 flex flex-col h-screen fixed left-0 top-0">
        {/* Logo - Fixo no topo */}
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <h1 className="font-heading text-xl font-bold text-white">Domínio Bridge</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isSuperAdmin ? 'Painel Super Admin' : 'Conciliação Contábil'}
          </p>
        </div>
        
        {/* Navigation - Scrollável */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => (
            <React.Fragment key={item.path + index}>
              {/* Separador antes dos itens de admin (apenas para admin de escritório) */}
              {!isSuperAdmin && isAdmin && index === baseNavItems.length && (
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
                      ? isSuperAdmin 
                        ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                        : 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]'
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
        
        {/* User Info & Logout - Fixo no rodapé */}
        <div className="p-4 border-t border-white/5 flex-shrink-0 bg-[#0F1016]">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getProfileColor(user?.perfil)}`}>
              {getUserInitials(user?.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nome || 'Usuário'}</p>
              <div className="flex items-center gap-1">
                {getProfileIcon(user?.perfil)}
                <p className="text-xs text-slate-500">{getProfileLabel(user?.perfil)}</p>
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
      
      {/* Main Content - Com margem para compensar sidebar fixa */}
      <main className="flex-1 ml-64 overflow-auto bg-[#0B0D14] min-h-screen">
        {children}
      </main>
    </div>
  );
};
