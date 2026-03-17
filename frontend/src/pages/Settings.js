import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Plus, Settings as SettingsIcon, Trash2, X, Edit2, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [rules, setRules] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterCompany, setFilterCompany] = useState('all');
  const [formData, setFormData] = useState({
    keyword: '',
    company_id: '',
    debit_account_code: '',
    credit_account_code: '',
    description: '',
    priority: 0
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [rulesRes, companiesRes] = await Promise.all([
        api.get(`/classification-rules`),
        api.get(`/companies`)
      ]);
      setRules(rulesRes.data);
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
      const submitData = {
        ...formData,
        company_id: formData.company_id || null  // Converter string vazia para null
      };
      
      if (editingId) {
        await api.put(`/classification-rules/${editingId}`, submitData);
        toast.success('Regra atualizada com sucesso');
      } else {
        await api.post(`/classification-rules`, submitData);
        toast.success('Regra criada com sucesso');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ keyword: '', company_id: '', debit_account_code: '', credit_account_code: '', description: '', priority: 0 });
      loadData();
    } catch (error) {
      toast.error(editingId ? 'Erro ao atualizar regra' : 'Erro ao criar regra');
    }
  };
  
  const handleEdit = (rule) => {
    setFormData({
      keyword: rule.keyword,
      company_id: rule.company_id || '',
      debit_account_code: rule.debit_account_code || '',
      credit_account_code: rule.credit_account_code || '',
      description: rule.description || '',
      priority: rule.priority || 0
    });
    setEditingId(rule.id);
    setShowForm(true);
  };
  
  const handleDelete = async (ruleId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta regra?')) return;
    try {
      await api.delete(`/classification-rules/${ruleId}`);
      toast.success('Regra excluída com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir regra');
    }
  };
  
  // Filtrar regras por empresa
  const filteredRules = rules.filter(rule => {
    if (filterCompany === 'all') return true;
    if (filterCompany === 'global') return !rule.company_id;
    return rule.company_id === filterCompany;
  });
  
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-slate-400">Gerencie regras de classificação automática por empresa</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          data-testid="nova-regra-btn"
          className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Regra
        </button>
      </div>
      
      {/* Filtro por empresa */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400">Filtrar por empresa:</label>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="h-10 px-4 rounded-lg bg-[#13141F] border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Todas as regras</option>
            <option value="global">🌐 Regras Globais</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>🏢 {company.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#13141F] border border-white/10 rounded-xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-white">{editingId ? 'Editar Regra de Classificação' : 'Nova Regra de Classificação'}</h2>
              <button onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ keyword: '', company_id: '', debit_account_code: '', credit_account_code: '', description: '', priority: 0 });
              }} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seleção de Empresa */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Empresa</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  data-testid="select-empresa"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                >
                  <option value="">🌐 Regra Global (todas as empresas)</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>🏢 {company.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.company_id 
                    ? 'Esta regra será aplicada apenas para a empresa selecionada' 
                    : 'Regras globais são aplicadas a todas as empresas'
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Palavra-chave *</label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="Ex: PIX RECEBIDO, TARIFA, SISPAG"
                  required
                  data-testid="input-keyword"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
                <p className="text-xs text-slate-500 mt-1">A classificação será aplicada quando esta palavra aparecer no histórico</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Código Conta Débito</label>
                  <input
                    type="text"
                    value={formData.debit_account_code}
                    onChange={(e) => setFormData({ ...formData, debit_account_code: e.target.value })}
                    placeholder="Ex: 1.1.01"
                    data-testid="input-debit-code"
                    className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Código Conta Crédito</label>
                  <input
                    type="text"
                    value={formData.credit_account_code}
                    onChange={(e) => setFormData({ ...formData, credit_account_code: e.target.value })}
                    placeholder="Ex: 4.1.01"
                    data-testid="input-credit-code"
                    className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da regra"
                  rows={3}
                  className="w-full rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Prioridade</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
                <p className="text-xs text-slate-500 mt-1">Regras com maior prioridade são aplicadas primeiro</p>
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
                  data-testid="criar-regra-btn"
                  className="flex-1 h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                >
                  {editingId ? 'Atualizar Regra' : 'Criar Regra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Rules List */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
        <h2 className="font-heading text-xl font-semibold text-white mb-6">
          Regras de Classificação
          {filterCompany !== 'all' && (
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({filteredRules.length} {filteredRules.length === 1 ? 'regra' : 'regras'})
            </span>
          )}
        </h2>
        
        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-12">
            <SettingsIcon className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 mb-4">
              {filterCompany !== 'all' ? 'Nenhuma regra encontrada para este filtro' : 'Nenhuma regra customizada criada'}
            </p>
            <p className="text-xs text-slate-600 mb-4">O sistema usa regras padrão. Crie regras personalizadas para melhorar a classificação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                  <th className="text-left py-3 px-4 font-medium">Empresa</th>
                  <th className="text-left py-3 px-4 font-medium">Palavra-chave</th>
                  <th className="text-left py-3 px-4 font-medium">Cta. Débito</th>
                  <th className="text-left py-3 px-4 font-medium">Cta. Crédito</th>
                  <th className="text-left py-3 px-4 font-medium">Descrição</th>
                  <th className="text-center py-3 px-4 font-medium">Prioridade</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      {rule.company_id ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Building2 size={12} />
                          {rule.company_name || 'Empresa'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Globe size={12} />
                          Global
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{rule.keyword}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400 text-xs">{rule.debit_account_code || '-'}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400 text-xs">{rule.credit_account_code || '-'}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">{rule.description || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {rule.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(rule)}
                          data-testid={`editar-regra-${rule.id}`}
                          className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          data-testid={`excluir-regra-${rule.id}`}
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
      
      {/* Informações sobre funcionamento */}
      <div className="mt-6 bg-[#13141F]/50 border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Como as regras funcionam:</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>• <span className="text-amber-400">Regras de empresa</span> são aplicadas primeiro e têm prioridade sobre regras globais</li>
          <li>• <span className="text-emerald-400">Regras globais</span> são aplicadas a todas as empresas do escritório</li>
          <li>• A <span className="text-indigo-400">prioridade</span> define qual regra é aplicada quando múltiplas regras correspondem</li>
          <li>• Exemplo: Para a empresa "3GB", crie uma regra com palavra-chave "PIX" para classificar automaticamente</li>
        </ul>
      </div>
    </div>
  );
}
