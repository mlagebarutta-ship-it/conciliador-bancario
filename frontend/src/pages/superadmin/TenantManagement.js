import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Users,
  Eye,
  X,
  Check,
  Ban,
  Search,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANOS = [
  { value: 'basico', label: 'Básico', color: 'bg-slate-500' },
  { value: 'profissional', label: 'Profissional', color: 'bg-indigo-500' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-purple-500' }
];

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    plano: 'basico'
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await axios.get(`${API}/superadmin/tenants`, { headers: getAuthHeader() });
      setTenants(response.data);
    } catch (error) {
      toast.error('Erro ao carregar escritórios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTenant) {
        await axios.put(`${API}/superadmin/tenants/${editingTenant.id}`, formData, { headers: getAuthHeader() });
        toast.success('Escritório atualizado');
      } else {
        await axios.post(`${API}/superadmin/tenants`, formData, { headers: getAuthHeader() });
        toast.success('Escritório criado');
      }
      
      setShowModal(false);
      resetForm();
      loadTenants();
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao salvar escritório';
      toast.error(message);
    }
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      nome: tenant.nome,
      cnpj: tenant.cnpj || '',
      email: tenant.email,
      telefone: tenant.telefone || '',
      endereco: tenant.endereco || '',
      plano: tenant.plano
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (tenant) => {
    const newStatus = tenant.status === 'ativo' ? 'bloqueado' : 'ativo';
    
    try {
      await axios.put(`${API}/superadmin/tenants/${tenant.id}`, { status: newStatus }, { headers: getAuthHeader() });
      toast.success(`Escritório ${newStatus === 'ativo' ? 'ativado' : 'bloqueado'}`);
      loadTenants();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`ATENÇÃO: Isso irá excluir PERMANENTEMENTE o escritório "${tenant.nome}" e TODOS os seus dados (empresas, extratos, usuários). Deseja continuar?`)) return;
    
    try {
      await axios.delete(`${API}/superadmin/tenants/${tenant.id}`, { headers: getAuthHeader() });
      toast.success('Escritório excluído');
      loadTenants();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      plano: 'basico'
    });
    setEditingTenant(null);
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.cnpj?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tenants.length,
    ativos: tenants.filter(t => t.status === 'ativo').length,
    bloqueados: tenants.filter(t => t.status === 'bloqueado').length
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Gestão de Escritórios</h1>
          <p className="text-slate-400">Gerencie os escritórios de contabilidade da plataforma</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          data-testid="novo-escritorio-btn"
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
        >
          <Plus size={20} />
          Novo Escritório
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Building2 className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Total de Escritórios</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Check className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.ativos}</p>
              <p className="text-xs text-slate-500">Ativos</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Ban className="text-rose-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.bloqueados}</p>
              <p className="text-xs text-slate-500">Bloqueados</p>
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
            placeholder="Buscar por nome, email ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#13141F] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-4 rounded-lg bg-[#13141F] border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="bloqueado">Bloqueados</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500">Nenhum escritório encontrado</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b border-white/5 bg-black/20">
                <th className="text-left py-3 px-4 font-medium">Escritório</th>
                <th className="text-left py-3 px-4 font-medium">Plano</th>
                <th className="text-center py-3 px-4 font-medium">Usuários</th>
                <th className="text-center py-3 px-4 font-medium">Empresas</th>
                <th className="text-center py-3 px-4 font-medium">Extratos</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr 
                  key={tenant.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white font-medium">{tenant.nome}</p>
                      <p className="text-slate-500 text-xs">{tenant.email}</p>
                      {tenant.cnpj && <p className="text-slate-600 text-xs">{tenant.cnpj}</p>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      tenant.plano === 'enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      tenant.plano === 'profissional' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {tenant.plano}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-white font-mono">{tenant.total_usuarios || 0}</td>
                  <td className="py-3 px-4 text-center text-white font-mono">{tenant.total_empresas || 0}</td>
                  <td className="py-3 px-4 text-center text-white font-mono">{tenant.total_extratos || 0}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(tenant)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                        tenant.status === 'ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      {tenant.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/superadmin/escritorios/${tenant.id}`)}
                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-600/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(tenant)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingTenant ? 'Editar Escritório' : 'Novo Escritório'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Escritório *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Plano</label>
                <select
                  value={formData.plano}
                  onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {PLANOS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

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
                  {editingTenant ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
