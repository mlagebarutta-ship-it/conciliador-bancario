import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Settings as SettingsIcon, Trash2, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Settings() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    keyword: '',
    debit_account_code: '',
    credit_account_code: '',
    description: '',
    priority: 0
  });
  
  useEffect(() => {
    loadRules();
  }, []);
  
  const loadRules = async () => {
    try {
      const response = await axios.get(`${API}/classification-rules`);
      setRules(response.data);
    } catch (error) {
      toast.error('Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Atualizar regra existente
        await axios.put(`${API}/classification-rules/${editingId}`, formData);
        toast.success('Regra atualizada com sucesso');
      } else {
        // Criar nova regra
        await axios.post(`${API}/classification-rules`, formData);
        toast.success('Regra criada com sucesso');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ keyword: '', debit_account_code: '', credit_account_code: '', description: '', priority: 0 });
      loadRules();
    } catch (error) {
      toast.error(editingId ? 'Erro ao atualizar regra' : 'Erro ao criar regra');
    }
  };
  
  const handleEdit = (rule) => {
    setFormData({
      keyword: rule.keyword,
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
      await axios.delete(`${API}/classification-rules/${ruleId}`);
      toast.success('Regra excluída com sucesso');
      loadRules();
    } catch (error) {
      toast.error('Erro ao excluir regra');
    }
  };
  
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-slate-400">Gerencie regras de classificação automática</p>
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
      
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#13141F] border border-white/10 rounded-xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-white">{editingId ? 'Editar Regra de Classificação' : 'Nova Regra de Classificação'}</h2>
              <button onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ keyword: '', debit_account_code: '', credit_account_code: '', description: '', priority: 0 });
              }} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
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
        <h2 className="font-heading text-xl font-semibold text-white mb-6">Regras de Classificação</h2>
        
        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : rules.length === 0 ? (
          <div className="text-center py-12">
            <SettingsIcon className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 mb-4">Nenhuma regra customizada criada</p>
            <p className="text-xs text-slate-600 mb-4">O sistema usa regras padrão. Crie regras personalizadas para melhorar a classificação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                  <th className="text-left py-3 px-4 font-medium">Palavra-chave</th>
                  <th className="text-left py-3 px-4 font-medium">Cta. Débito</th>
                  <th className="text-left py-3 px-4 font-medium">Cta. Crédito</th>
                  <th className="text-left py-3 px-4 font-medium">Descrição</th>
                  <th className="text-center py-3 px-4 font-medium">Prioridade</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{rule.keyword}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400 text-xs">{rule.debit_account_code || '-'}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400 text-xs">{rule.credit_account_code || '-'}</td>
                    <td className="py-3 px-4 text-slate-300">{rule.description || '-'}</td>
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
    </div>
  );
}