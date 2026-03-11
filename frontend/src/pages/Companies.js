import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Plus, Building2, Trash2, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    cnpj: '',
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  
  useEffect(() => {
    loadCompanies();
  }, []);
  
  const loadCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`);
      setCompanies(response.data);
    } catch (error) {
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/companies/${editingId}`, formData);
        toast.success('Empresa atualizada com sucesso');
      } else {
        await axios.post(`${API}/companies`, formData);
        toast.success('Empresa cadastrada com sucesso');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ cnpj: '', name: '', address: '', phone: '', email: '' });
      loadCompanies();
    } catch (error) {
      toast.error('Erro ao salvar empresa');
    }
  };
  
  const handleEdit = (company) => {
    setFormData({
      cnpj: company.cnpj,
      name: company.name,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || ''
    });
    setEditingId(company.id);
    setShowForm(true);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta empresa?')) return;
    try {
      await axios.delete(`${API}/companies/${id}`);
      toast.success('Empresa excluída com sucesso');
      loadCompanies();
    } catch (error) {
      toast.error('Erro ao excluir empresa');
    }
  };
  
  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };
  
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Empresas</h1>
          <p className="text-slate-400">Gerencie as empresas cadastradas</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ cnpj: '', name: '', address: '', phone: '', email: '' });
          }}
          data-testid="nova-empresa-btn"
          className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Empresa
        </button>
      </div>
      
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#13141F] border border-white/10 rounded-xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-white">
                {editingId ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">CNPJ *</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  required
                  data-testid="input-cnpj"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Empresa *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome fantasia ou razão social"
                  required
                  data-testid="input-name"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Endereço completo"
                  data-testid="input-address"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    data-testid="input-phone"
                    className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    data-testid="input-email"
                    className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-10 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="salvar-empresa-btn"
                  className="flex-1 h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                >
                  {editingId ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Companies List */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 mb-4">Nenhuma empresa cadastrada</p>
            <button
              onClick={() => setShowForm(true)}
              data-testid="cadastrar-primeira-empresa-btn"
              className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
            >
              Cadastrar Primeira Empresa
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                  <th className="text-left py-3 px-4 font-medium">CNPJ</th>
                  <th className="text-left py-3 px-4 font-medium">Nome</th>
                  <th className="text-left py-3 px-4 font-medium">Endereço</th>
                  <th className="text-left py-3 px-4 font-medium">Contato</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`company-row-${company.id}`}>
                    <td className="py-3 px-4 font-mono text-slate-300">{formatCNPJ(company.cnpj)}</td>
                    <td className="py-3 px-4 text-white font-medium">{company.name}</td>
                    <td className="py-3 px-4 text-slate-300">{company.address || '-'}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {company.phone && <div>{company.phone}</div>}
                      {company.email && <div className="text-xs">{company.email}</div>}
                      {!company.phone && !company.email && '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(company)}
                          data-testid={`editar-${company.id}`}
                          className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          data-testid={`excluir-${company.id}`}
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-600/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}