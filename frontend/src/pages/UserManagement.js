import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  User,
  X,
  Check,
  Building2,
  Link,
  Unlink,
  Eye,
  EyeOff,
  Search,
  Filter
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerfil, setFilterPerfil] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'colaborador',
    status: 'ativo'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, companiesRes] = await Promise.all([
        api.get(`/usuarios`, { headers: getAuthHeader() }),
        api.get(`/companies`, { headers: getAuthHeader() })
      ]);
      setUsers(usersRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Atualizar usuário
        const updateData = { ...formData };
        if (!updateData.senha) delete updateData.senha; // Não enviar senha vazia
        
        await api.put(`/usuarios/${editingUser.id}`, updateData, { headers: getAuthHeader() });
        toast.success('Usuário atualizado com sucesso');
      } else {
        // Criar usuário
        await api.post(`/usuarios`, formData, { headers: getAuthHeader() });
        toast.success('Usuário criado com sucesso');
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao salvar usuário';
      toast.error(message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      perfil: user.perfil,
      status: user.status
    });
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${user.nome}"?`)) return;
    
    try {
      await api.delete(`/usuarios/${user.id}`, { headers: getAuthHeader() });
      toast.success('Usuário excluído');
      loadData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao excluir usuário';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      await api.put(`/usuarios/${user.id}`, { status: newStatus }, { headers: getAuthHeader() });
      toast.success(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'desativado'}`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const openCompanyModal = async (user) => {
    try {
      const response = await api.get(`/usuarios/${user.id}`, { headers: getAuthHeader() });
      setSelectedUser(response.data);
      setShowCompanyModal(true);
    } catch (error) {
      toast.error('Erro ao carregar dados do usuário');
    }
  };

  const handleLinkCompany = async (empresaId) => {
    try {
      await api.post(`/usuarios/${selectedUser.id}/empresas?empresa_id=${empresaId}`, {}, { headers: getAuthHeader() });
      toast.success('Empresa vinculada');
      
      // Recarregar dados do usuário
      const response = await api.get(`/usuarios/${selectedUser.id}`, { headers: getAuthHeader() });
      setSelectedUser(response.data);
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao vincular empresa';
      toast.error(message);
    }
  };

  const handleUnlinkCompany = async (empresaId) => {
    try {
      await api.delete(`/usuarios/${selectedUser.id}/empresas/${empresaId}`, { headers: getAuthHeader() });
      toast.success('Vínculo removido');
      
      // Recarregar dados do usuário
      const response = await api.get(`/usuarios/${selectedUser.id}`, { headers: getAuthHeader() });
      setSelectedUser(response.data);
    } catch (error) {
      toast.error('Erro ao remover vínculo');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      perfil: 'colaborador',
      status: 'ativo'
    });
    setEditingUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerfil = filterPerfil === 'all' || user.perfil === filterPerfil;
    return matchesSearch && matchesPerfil;
  });

  const linkedCompanyIds = selectedUser?.empresas_vinculadas?.map(e => e.id) || [];
  const availableCompanies = companies.filter(c => !linkedCompanyIds.includes(c.id));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Gerenciar Usuários</h1>
          <p className="text-slate-400">Controle de acesso e permissões do sistema</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          data-testid="novo-usuario-btn"
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Users className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.length}</p>
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
              <p className="text-2xl font-bold text-white">{users.filter(u => u.perfil === 'administrador').length}</p>
              <p className="text-xs text-slate-500">Administradores</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <User className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.perfil === 'colaborador').length}</p>
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
              <p className="text-2xl font-bold text-white">{users.filter(u => u.status === 'ativo').length}</p>
              <p className="text-xs text-slate-500">Ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#13141F] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={filterPerfil}
          onChange={(e) => setFilterPerfil(e.target.value)}
          className="h-10 px-4 rounded-lg bg-[#13141F] border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">Todos os perfis</option>
          <option value="administrador">Administradores</option>
          <option value="colaborador">Colaboradores</option>
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
                <th className="text-left py-3 px-4 font-medium">Perfil</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Data de Criação</th>
                <th className="text-right py-3 px-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  data-testid={`user-row-${user.id}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.perfil === 'administrador' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-indigo-500/20 text-indigo-400'
                      }`}>
                        {user.perfil === 'administrador' ? <Shield size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.nome}</p>
                        <p className="text-slate-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.perfil === 'administrador'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {user.perfil === 'administrador' ? 'Administrador' : 'Colaborador'}
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
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {new Date(user.data_criacao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {user.perfil === 'colaborador' && (
                        <button
                          onClick={() => openCompanyModal(user)}
                          className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-600/10 rounded-lg transition-colors"
                          title="Vincular Empresas"
                        >
                          <Building2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-600/10 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal - Criar/Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required={!editingUser}
                    className="w-full h-10 px-4 pr-10 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Perfil</label>
                <select
                  value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
                >
                  {editingUser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Vincular Empresas */}
      {showCompanyModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Vincular Empresas</h2>
                <p className="text-slate-400 text-sm">{selectedUser.nome}</p>
              </div>
              <button onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Empresas Vinculadas */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Link size={14} />
                  Empresas Vinculadas ({selectedUser.empresas_vinculadas?.length || 0})
                </h3>
                {selectedUser.empresas_vinculadas?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.empresas_vinculadas.map(empresa => (
                      <div key={empresa.id} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <span className="text-white text-sm">{empresa.name}</span>
                        <button
                          onClick={() => handleUnlinkCompany(empresa.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-600/10 rounded-lg transition-colors"
                          title="Remover vínculo"
                        >
                          <Unlink size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm py-2">Nenhuma empresa vinculada</p>
                )}
              </div>

              {/* Empresas Disponíveis */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Building2 size={14} />
                  Empresas Disponíveis ({availableCompanies.length})
                </h3>
                {availableCompanies.length > 0 ? (
                  <div className="space-y-2">
                    {availableCompanies.map(empresa => (
                      <div key={empresa.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/5 rounded-lg">
                        <span className="text-slate-300 text-sm">{empresa.name}</span>
                        <button
                          onClick={() => handleLinkCompany(empresa.id)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors"
                          title="Vincular empresa"
                        >
                          <Link size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm py-2">Todas as empresas já estão vinculadas</p>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5">
              <button
                onClick={() => setShowCompanyModal(false)}
                className="w-full h-10 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
