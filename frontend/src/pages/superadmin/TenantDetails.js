import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  FileSpreadsheet, 
  ArrowLeft,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

export default function TenantDetails() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [adminForm, setAdminForm] = useState({
    nome: '',
    email: '',
    senha: ''
  });

  useEffect(() => {
    loadTenant();
  }, [tenantId]);

  const loadTenant = async () => {
    try {
      const response = await api.get(`/superadmin/tenants/${tenantId}`);
      setTenant(response.data);
    } catch (error) {
      toast.error('Erro ao carregar escritório');
      navigate('/superadmin/escritorios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    try {
      await api.post(`/superadmin/tenants/${tenantId}/admin`, adminForm);
      toast.success('Administrador criado com sucesso');
      setShowAdminModal(false);
      setAdminForm({ nome: '', email: '', senha: '' });
      loadTenant();
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao criar administrador';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="h-64 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  const admins = tenant.usuarios?.filter(u => u.perfil === 'admin_tenant') || [];
  const colaboradores = tenant.usuarios?.filter(u => u.perfil === 'colaborador') || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/superadmin/escritorios')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar para lista
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold text-white mb-2">{tenant.nome}</h1>
            <div className="flex items-center gap-4 text-slate-400">
              {tenant.cnpj && <span>{tenant.cnpj}</span>}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tenant.status === 'ativo' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {tenant.status}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                tenant.plano === 'enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                tenant.plano === 'profissional' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {tenant.plano}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAdminModal(true)}
            className="h-10 px-5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all flex items-center gap-2"
          >
            <UserPlus size={18} />
            Criar Admin
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Users className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tenant.usuarios?.length || 0}</p>
              <p className="text-xs text-slate-500">Usuários</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Building2 className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tenant.empresas?.length || 0}</p>
              <p className="text-xs text-slate-500">Empresas</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <FileSpreadsheet className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tenant.total_extratos || 0}</p>
              <p className="text-xs text-slate-500">Extratos</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Calendar className="text-rose-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{(tenant.total_transacoes || 0).toLocaleString('pt-BR')}</p>
              <p className="text-xs text-slate-500">Transações</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Escritório */}
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informações</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <Mail size={18} className="text-slate-500" />
              <span>{tenant.email}</span>
            </div>
            {tenant.telefone && (
              <div className="flex items-center gap-3 text-slate-300">
                <Phone size={18} className="text-slate-500" />
                <span>{tenant.telefone}</span>
              </div>
            )}
            {tenant.endereco && (
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin size={18} className="text-slate-500" />
                <span>{tenant.endereco}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar size={18} className="text-slate-500" />
              <span>Criado em {new Date(tenant.data_criacao).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-slate-500 mb-2">Limites do Plano</p>
              <div className="flex gap-4">
                <span className="text-sm text-slate-300">
                  Usuários: <span className="text-white font-mono">{tenant.usuarios?.length || 0}/{tenant.max_usuarios}</span>
                </span>
                <span className="text-sm text-slate-300">
                  Empresas: <span className="text-white font-mono">{tenant.empresas?.length || 0}/{tenant.max_empresas}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Usuários */}
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Usuários ({tenant.usuarios?.length || 0})</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {admins.length > 0 && (
              <>
                <p className="text-xs text-slate-500 uppercase">Administradores</p>
                {admins.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{user.nome}</p>
                      <p className="text-slate-500 text-xs">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                ))}
              </>
            )}
            {colaboradores.length > 0 && (
              <>
                <p className="text-xs text-slate-500 uppercase mt-4">Colaboradores</p>
                {colaboradores.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/5 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{user.nome}</p>
                      <p className="text-slate-500 text-xs">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                ))}
              </>
            )}
            {tenant.usuarios?.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">Nenhum usuário cadastrado</p>
            )}
          </div>
        </div>

        {/* Empresas */}
        <div className="lg:col-span-2 bg-[#13141F] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Empresas ({tenant.empresas?.length || 0})</h3>
          {tenant.empresas?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tenant.empresas.map(empresa => (
                <div key={empresa.id} className="p-3 bg-slate-800/50 border border-white/5 rounded-lg">
                  <p className="text-white text-sm font-medium truncate">{empresa.name}</p>
                  {empresa.cnpj && <p className="text-slate-500 text-xs">{empresa.cnpj}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">Nenhuma empresa cadastrada</p>
          )}
        </div>
      </div>

      {/* Modal Criar Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Criar Administrador</h2>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={adminForm.nome}
                  onChange={(e) => setAdminForm({ ...adminForm, nome: e.target.value })}
                  required
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminForm.senha}
                    onChange={(e) => setAdminForm({ ...adminForm, senha: e.target.value })}
                    required
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 h-10 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
