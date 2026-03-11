import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Plus, FileSpreadsheet, Trash2, X, ChevronRight, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ChartOfAccounts() {
  const [companies, setCompanies] = useState([]);
  const [charts, setCharts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChartForm, setShowChartForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [chartFormData, setChartFormData] = useState({
    company_id: '',
    name: '',
    description: ''
  });
  const [accountFormData, setAccountFormData] = useState({
    chart_id: '',
    code: '',
    description: '',
    account_type: ''
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedChart) {
      loadAccounts(selectedChart.id);
    }
  }, [selectedChart]);
  
  const loadData = async () => {
    try {
      const [companiesRes, chartsRes] = await Promise.all([
        api.get(`/companies`),
        api.get(`/chart-of-accounts`)
      ]);
      setCompanies(companiesRes.data);
      setCharts(chartsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  
  const loadAccounts = async (chartId) => {
    try {
      const response = await api.get(`/account-items?chart_id=${chartId}`);
      setAccounts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar contas');
    }
  };
  
  const handleCreateChart = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/chart-of-accounts`, chartFormData);
      toast.success('Plano de contas criado com sucesso');
      setShowChartForm(false);
      setChartFormData({ company_id: '', name: '', description: '' });
      loadData();
    } catch (error) {
      toast.error('Erro ao criar plano de contas');
    }
  };
  
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/account-items`, accountFormData);
      toast.success('Conta adicionada com sucesso');
      setShowAccountForm(false);
      setAccountFormData({ chart_id: '', code: '', description: '', account_type: '' });
      loadAccounts(selectedChart.id);
    } catch (error) {
      toast.error('Erro ao adicionar conta');
    }
  };
  
  const handleDeleteChart = async (chartId) => {
    if (!window.confirm('Tem certeza? Isso excluirá todas as contas associadas.')) return;
    try {
      await api.delete(`/chart-of-accounts/${chartId}`);
      toast.success('Plano de contas excluído');
      if (selectedChart?.id === chartId) setSelectedChart(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir plano de contas');
    }
  };
  
  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await api.delete(`/account-items/${accountId}`);
      toast.success('Conta excluída com sucesso');
      loadAccounts(selectedChart.id);
    } catch (error) {
      toast.error('Erro ao excluir conta');
    }
  };
  
  const handleImportAccounts = async () => {
    if (!importFile || !selectedChart) {
      toast.error('Selecione um arquivo');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await axios.post(
        `${API}/chart-of-accounts/${selectedChart.id}/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Erros durante importação:', response.data.errors);
      }
      
      setShowImportModal(false);
      setImportFile(null);
      loadAccounts(selectedChart.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao importar contas');
    }
  };
  
  const downloadTemplate = () => {
    // Criar template com formato correto: Código, Descrição, Classificação, Tipo
    const csvContent = "Código,Descrição,Classificação,Tipo\n1,Caixa,1.1.1.01.0001,ATIVO\n3,Banco Itaú c/ Movimento,1.1.1.02.0001,ATIVO\n21,Duplicatas/Cheques a Receber,1.1.2.01.0001,ATIVO\n201,Fornecedores Diversos,2.1.1.01.0001,PASSIVO\n251,ICMS a Recolher,2.1.2.01.0001,PASSIVO\n301,Receita de Vendas de Mercadorias,3.1.1.01.0001,RECEITA\n401,Aquisição de Mercadorias,4.1.2.01.0001,DESPESA\n421,Salários e Ordenados,4.2.1.01.0001,DESPESA";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_plano_contas.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Plano de Contas</h1>
          <p className="text-slate-400">Gerencie os planos de contas das empresas</p>
        </div>
        <button
          onClick={() => setShowChartForm(true)}
          data-testid="novo-plano-btn"
          className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Plano de Contas
        </button>
      </div>
      
      {/* Chart Form Modal */}
      {showChartForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowChartForm(false)}>
          <div className="bg-[#13141F] border border-white/10 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-white">Novo Plano de Contas</h2>
              <button onClick={() => setShowChartForm(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateChart} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Empresa *</label>
                <select
                  value={chartFormData.company_id}
                  onChange={(e) => setChartFormData({ ...chartFormData, company_id: e.target.value })}
                  required
                  data-testid="select-empresa"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Plano *</label>
                <input
                  type="text"
                  value={chartFormData.name}
                  onChange={(e) => setChartFormData({ ...chartFormData, name: e.target.value })}
                  placeholder="Ex: Plano de Contas 2025"
                  required
                  data-testid="input-nome-plano"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                <textarea
                  value={chartFormData.description}
                  onChange={(e) => setChartFormData({ ...chartFormData, description: e.target.value })}
                  placeholder="Descrição opcional"
                  rows={3}
                  className="w-full rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4 py-2"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowChartForm(false)} className="flex-1 h-10 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 transition-all">
                  Cancelar
                </button>
                <button type="submit" data-testid="criar-plano-btn" className="flex-1 h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Account Form Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAccountForm(false)}>
          <div className="bg-[#13141F] border border-white/10 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-white">Adicionar Conta</h2>
              <button onClick={() => setShowAccountForm(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Código Reduzido *</label>
                <input
                  type="text"
                  value={accountFormData.code}
                  onChange={(e) => setAccountFormData({ ...accountFormData, code: e.target.value })}
                  placeholder="Ex: 1.1.01"
                  required
                  data-testid="input-codigo"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descrição *</label>
                <input
                  type="text"
                  value={accountFormData.description}
                  onChange={(e) => setAccountFormData({ ...accountFormData, description: e.target.value })}
                  placeholder="Ex: Banco Itau"
                  required
                  data-testid="input-descricao-conta"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Conta *</label>
                <select
                  value={accountFormData.account_type}
                  onChange={(e) => setAccountFormData({ ...accountFormData, account_type: e.target.value })}
                  required
                  data-testid="select-tipo-conta"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="ATIVO">ATIVO</option>
                  <option value="PASSIVO">PASSIVO</option>
                  <option value="RECEITA">RECEITA</option>
                  <option value="DESPESA">DESPESA</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAccountForm(false)} className="flex-1 h-10 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 transition-all">
                  Cancelar
                </button>
                <button type="submit" data-testid="adicionar-conta-btn" className="flex-1 h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-[#13141F] border border-white/10 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-semibold text-white">Importar Plano de Contas</h2>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-4">
                <p className="text-sm text-indigo-300 mb-2">📋 Formato OBRIGATÓRIO do arquivo:</p>
                <div className="text-xs text-slate-400 space-y-2">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-white font-semibold mb-2">Colunas na ordem exata:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li><span className="text-white font-mono">Código</span> - Número sequencial (1, 2, 3...)</li>
                      <li><span className="text-white font-mono">Descrição</span> - Nome da conta (ex: Caixa, Banco Itaú)</li>
                      <li><span className="text-white font-mono">Classificação</span> - Código contábil (ex: 1.1.1.01.0001)</li>
                      <li><span className="text-white font-mono">Tipo</span> - ATIVO, PASSIVO, RECEITA ou DESPESA</li>
                    </ol>
                  </div>
                  <p className="text-amber-400 text-xs">⚠️ Todas as colunas são obrigatórias e devem estar nesta ordem!</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Download size={14} />
                  Baixar template de exemplo
                </button>
              </div>
              
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors">
                <Upload className="mx-auto text-slate-500 mb-3" size={40} />
                <p className="text-white mb-2 text-sm">Selecione o arquivo</p>
                <p className="text-xs text-slate-500 mb-4">Excel (.xlsx) ou CSV</p>
                <input
                  type="file"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  accept=".xlsx,.xls,.csv"
                  data-testid="import-file-input"
                  className="hidden"
                  id="import-file-upload"
                />
                <label
                  htmlFor="import-file-upload"
                  className="inline-block h-10 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  Escolher Arquivo
                </label>
              </div>
              
              {importFile && (
                <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="text-emerald-400" size={20} />
                    <span className="text-white text-sm">{importFile.name}</span>
                  </div>
                  <button
                    onClick={() => setImportFile(null)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="flex-1 h-10 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportAccounts}
                  disabled={!importFile}
                  data-testid="confirmar-importacao-btn"
                  className="flex-1 h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Importar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-12 gap-6">
        {/* Charts List */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
            <h2 className="font-heading text-xl font-semibold text-white mb-4">Planos de Contas</h2>
            {loading ? (
              <p className="text-slate-500 text-center py-8">Carregando...</p>
            ) : charts.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="mx-auto text-slate-600 mb-4" size={48} />
                <p className="text-slate-500">Nenhum plano cadastrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {charts.map((chart) => {
                  const company = companies.find(c => c.id === chart.company_id);
                  return (
                    <div
                      key={chart.id}
                      onClick={() => setSelectedChart(chart)}
                      data-testid={`chart-${chart.id}`}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedChart?.id === chart.id
                          ? 'bg-indigo-600/10 border-indigo-500/50'
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{chart.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">{company?.name || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChart(chart.id);
                            }}
                            data-testid={`excluir-plano-${chart.id}`}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-600/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight className="text-slate-500" size={20} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Accounts List */}
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-semibold text-white">
                {selectedChart ? `Contas - ${selectedChart.name}` : 'Selecione um plano'}
              </h2>
              {selectedChart && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowImportModal(true)}
                    data-testid="importar-plano-btn"
                    className="h-10 px-4 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
                  >
                    <Upload size={18} />
                    Importar Excel
                  </button>
                  <button
                    onClick={() => {
                      setAccountFormData({ ...accountFormData, chart_id: selectedChart.id });
                      setShowAccountForm(true);
                    }}
                    data-testid="adicionar-conta-plano-btn"
                    className="h-10 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Adicionar Conta
                  </button>
                </div>
              )}
            </div>
            
            {!selectedChart ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Selecione um plano de contas à esquerda</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Nenhuma conta cadastrada neste plano</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                      <th className="text-left py-3 px-4 font-medium">Código</th>
                      <th className="text-left py-3 px-4 font-medium">Descrição</th>
                      <th className="text-left py-3 px-4 font-medium">Tipo</th>
                      <th className="text-right py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono text-indigo-400">{account.code}</td>
                        <td className="py-3 px-4 text-white">{account.description}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            account.account_type === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            account.account_type === 'PASSIVO' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            account.account_type === 'RECEITA' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {account.account_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            data-testid={`excluir-conta-${account.id}`}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-600/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}