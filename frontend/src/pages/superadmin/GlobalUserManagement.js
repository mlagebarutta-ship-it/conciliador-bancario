import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  Shield,
  User,
  Building2,
  Key,
  Ban,
  Check
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export default function GlobalUserManagement() {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTenant, setFilterTenant] = useState('all');
  const [filterPerfil, setFilterPerfil] = useState('all');
  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, tenantsRes] = await Promise.all([
        axios.get(`${API}/superadmin/usuarios`, { headers: getAuthHeader() }),
        axios.get(`${API}/superadmin/tenants`, { headers: getAuthHeader() })
      ]);
      setUsers(usersRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const response = await axios.put(
        `${API}/superadmin/usuarios/${user.id}/toggle-status`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success(response.data.message);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      await axios.put(
        `${API}/superadmin/usuarios/${resetPasswordModal.id}/reset-password?nova_senha=${encodeURIComponent(newPassword)}`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success('Senha resetada com sucesso');
      setResetPasswordModal(null);
      setNewPassword('');
    } catch (error) {
      toast.error('Erro ao resetar senha');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.tenant_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTenant = filterTenant === 'all' || user.tenant_id === filterTenant;
    const matchesPerfil = filterPerfil === 'all' || user.perfil === filterPerfil;
    return matchesSearch && matchesTenant && matchesPerfil;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.perfil === 'admin_tenant').length,
    colaboradores: users.filter(u => u.perfil === 'colaborador').length,
    ativos: users.filter(u => u.status === 'ativo').length
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Usuários da Plataforma</h1>
        <p className="text-slate-400">Visualize e gerencie todos os usuários de todos os escritórios</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Users className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Total de Usuários</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.admins}</p>
              <p className="text-xs text-slate-500">Admins de Escritório</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <User className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.colaboradores}</p>
              <p className="text-xs text-slate-500">Colaboradores</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Check className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.ativos}</p>
              <p className="text-xs text-slate-500">Ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou escritório..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#13141F] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={filterTenant}
          onChange={(e) => setFilterTenant(e.target.value)}
          className="h-10 px-4 rounded-lg bg-[#13141F] border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">Todos os escritórios</option>
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
        <select
          value={filterPerfil}
          onChange={(e) => setFilterPerfil(e.target.value)}
          className="h-10 px-4 rounded-lg bg-[#13141F] border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">Todos os perfis</option>
          <option value="admin_tenant">Admin do Escritório</option>
          <option value="colaborador">Colaborador</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b border-white/5 bg-black/20">
                <th className="text-left py-3 px-4 font-medium">Usuário</th>
                <th className="text-left py-3 px-4 font-medium">Escritório</th>
                <th className="text-left py-3 px-4 font-medium">Perfil</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.perfil === 'admin_tenant' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-indigo-500/20 text-indigo-400'
                      }`}>
                        {user.perfil === 'admin_tenant' ? <Shield size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.nome}</p>
                        <p className="text-slate-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Building2 size={14} className="text-slate-500" />
                      <span className="text-sm">{user.tenant_nome || '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.perfil === 'admin_tenant'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {user.perfil === 'admin_tenant' ? 'Admin' : 'Colaborador'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                        user.status === 'ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setResetPasswordModal(user)}
                        className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-600/10 rounded-lg transition-colors"
                        title="Resetar Senha"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === 'ativo'
                            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-600/10'
                            : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/10'
                        }`}
                        title={user.status === 'ativo' ? 'Bloquear' : 'Desbloquear'}
                      >
                        {user.status === 'ativo' ? <Ban size={16} /> : <Check size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Reset Password */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">Resetar Senha</h2>
            <p className="text-slate-400 text-sm mb-6">
              Definir nova senha para <span className="text-white">{resetPasswordModal.nome}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setResetPasswordModal(null); setNewPassword(''); }}
                  className="flex-1 h-10 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetPassword}
                  className="flex-1 h-10 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 transition-all"
                >
                  Resetar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
