import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function NewProcessing() {
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [charts, setCharts] = useState([]);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    chart_id: '',
    bank_name: '',
    period: ''
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  
  useEffect(() => {
    loadCompanies();
  }, []);
  
  useEffect(() => {
    if (formData.company_id) {
      loadCharts(formData.company_id);
    }
  }, [formData.company_id]);
  
  const loadCompanies = async () => {
    try {
      const response = await api.get(`/companies`);
      setCompanies(response.data);
    } catch (error) {
      toast.error('Erro ao carregar empresas');
    }
  };
  
  const loadCharts = async (companyId) => {
    try {
      const response = await api.get(`/chart-of-accounts?company_id=${companyId}`);
      setCharts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar planos de contas');
    }
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (!['ofx', 'xlsx', 'xls', 'csv', 'pdf'].includes(ext)) {
        toast.error('Formato não suportado. Use OFX, Excel, CSV ou PDF');
        return;
      }
      setFile(selectedFile);
    }
  };
  
  const handleProcess = async () => {
    if (!file || !formData.company_id || !formData.chart_id || !formData.bank_name || !formData.period) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setProcessing(true);
    setStep(3);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const response = await axios.post(
        `${API}/bank-statements/upload?company_id=${formData.company_id}&chart_id=${formData.chart_id}&bank_name=${formData.bank_name}&period=${formData.period}`,
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setResult(response.data.statement);
      setTransactions(response.data.transactions);
      setStep(4);
      toast.success('Extrato processado com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao processar extrato');
      setStep(2);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleUpdateTransaction = async (transId) => {
    try {
      await api.put(`/transactions/${transId}`, editData);
      setTransactions(transactions.map(t => t.id === transId ? { ...t, ...editData } : t));
      setEditingId(null);
      setEditData({});
      toast.success('Transação atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar transação');
    }
  };
  
  const handleExport = async () => {
    try {
      const response = await api.get(`/bank-statements/${result.id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${result.filename}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Arquivo baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar arquivo');
    }
  };
  
  const filteredTransactions = filter === 'all' ? transactions :
    filter === 'classified' ? transactions.filter(t => t.status === 'CLASSIFICADO') :
    filter === 'manual' ? transactions.filter(t => t.status === 'CLASSIFICAR MANUALMENTE') :
    filter === 'credit' ? transactions.filter(t => t.transaction_type === 'C') :
    transactions.filter(t => t.transaction_type === 'D');
  
  const company = companies.find(c => c.id === formData.company_id);
  const chart = charts.find(c => c.id === formData.chart_id);
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Novo Processamento</h1>
        <p className="text-slate-400">Processar extrato bancário em 4 etapas</p>
      </div>
      
      {/* Workflow Steps */}
      <div className="mb-8 flex items-center justify-center gap-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-lg border transition-all ${
              step === s ? 'bg-indigo-600 border-indigo-500 text-white' :
              step > s ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' :
              'bg-white/5 border-white/10 text-slate-500'
            }`}>
              <span className="font-heading font-bold text-lg">{s}</span>
              <span className="text-sm font-medium">
                {s === 1 ? 'Upload' : s === 2 ? 'Configuração' : s === 3 ? 'Processamento' : 'Resultado'}
              </span>
            </div>
            {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>
      
      {/* Step 1 - Upload */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-8">
            <h2 className="font-heading text-2xl font-semibold text-white mb-6">Upload do Extrato</h2>
            
            <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-indigo-500/50 transition-colors">
              <Upload className="mx-auto text-slate-500 mb-4" size={48} />
              <p className="text-white mb-2">Arraste o arquivo ou clique para selecionar</p>
              <p className="text-sm text-slate-500 mb-4">Formatos aceitos: OFX, Excel (.xlsx, .xls), CSV, PDF</p>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".ofx,.xlsx,.xls,.csv,.pdf"
                data-testid="file-input"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all cursor-pointer"
              >
                Selecionar Arquivo
              </label>
            </div>
            
            {file && (
              <div className="mt-6 p-4 bg-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-indigo-400" size={24} />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-rose-400 hover:text-rose-300"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!file}
                data-testid="proximo-btn-1"
                className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 2 - Configuration */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-8">
            <h2 className="font-heading text-2xl font-semibold text-white mb-6">Configuração</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Empresa *</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value, chart_id: '' })}
                  data-testid="select-empresa-processamento"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                >
                  <option value="">Selecione a empresa</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Plano de Contas *</label>
                <select
                  value={formData.chart_id}
                  onChange={(e) => setFormData({ ...formData, chart_id: e.target.value })}
                  disabled={!formData.company_id}
                  data-testid="select-plano-processamento"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4 disabled:opacity-50"
                >
                  <option value="">Selecione o plano</option>
                  {charts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Banco *</label>
                <select
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  data-testid="select-banco"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                >
                  <option value="">Selecione o banco</option>
                  <option value="Itau">Itaú</option>
                  <option value="Bradesco">Bradesco</option>
                  <option value="Sicoob">Sicoob</option>
                  <option value="Nubank">Nubank</option>
                  <option value="Inter">Inter</option>
                  <option value="Santander">Santander</option>
                  <option value="BB">Banco do Brasil</option>
                  <option value="CEF">Caixa Econômica</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Período (MM/AAAA) *</label>
                <input
                  type="text"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  placeholder="Ex: 01/2026"
                  data-testid="input-periodo"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="h-10 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 transition-all"
              >
                ← Voltar
              </button>
              <button
                onClick={handleProcess}
                data-testid="processar-btn"
                className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              >
                Processar Extrato
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3 - Processing */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-6"></div>
            <h2 className="font-heading text-2xl font-semibold text-white mb-2">Processando extrato...</h2>
            <p className="text-slate-400">Aguarde enquanto classificamos os lançamentos</p>
          </div>
        </div>
      )}
      
      {/* Step 4 - Result */}
      {step === 4 && result && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="resultado-total-lancamentos">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-indigo-400" size={20} />
                <p className="text-xs uppercase text-slate-500 font-medium">Total de Lançamentos</p>
              </div>
              <p className="font-heading text-3xl font-bold text-white">{result.total_transactions}</p>
            </div>
            
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="resultado-classificados">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-emerald-400" size={20} />
                <p className="text-xs uppercase text-slate-500 font-medium">Classificados Auto.</p>
              </div>
              <p className="font-heading text-3xl font-bold text-emerald-400">{result.classified_count}</p>
              <p className="text-xs text-slate-500 mt-1">
                {((result.classified_count / result.total_transactions) * 100).toFixed(0)}%
              </p>
            </div>
            
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="resultado-manual">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-amber-400" size={20} />
                <p className="text-xs uppercase text-slate-500 font-medium">Revisão Manual</p>
              </div>
              <p className="font-heading text-3xl font-bold text-amber-400">{result.manual_count}</p>
              <p className="text-xs text-slate-500 mt-1">
                {((result.manual_count / result.total_transactions) * 100).toFixed(0)}%
              </p>
            </div>
            
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="resultado-saldo">
              <p className="text-xs uppercase text-slate-500 font-medium mb-4">Saldo do Período</p>
              <p className={`font-heading text-3xl font-bold ${
                result.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                R$ {result.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div>
                  <span className="text-slate-500">Entradas: </span>
                  <span className="text-emerald-400 font-mono">R$ {result.total_inflows.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Saídas: </span>
                  <span className="text-rose-400 font-mono">R$ {result.total_outflows.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold text-white">Lançamentos</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {['all', 'classified', 'manual', 'credit', 'debit'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      data-testid={`filter-${f}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filter === f
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {f === 'all' ? 'Todos' :
                       f === 'classified' ? 'Classificados' :
                       f === 'manual' ? 'Manual' :
                       f === 'credit' ? 'Créditos' : 'Débitos'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleExport}
                  data-testid="baixar-xlsx-btn"
                  className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] flex items-center gap-2"
                >
                  <Download size={16} />
                  Baixar XLSX
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                    <th className="text-left py-3 px-4 font-medium">Data</th>
                    <th className="text-left py-3 px-4 font-medium">Histórico</th>
                    <th className="text-right py-3 px-4 font-medium">Valor</th>
                    <th className="text-center py-3 px-4 font-medium">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium">Cta. Débito</th>
                    <th className="text-left py-3 px-4 font-medium">Cta. Crédito</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                    <th className="text-center py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((trans) => (
                    <tr key={trans.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">{trans.date}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{trans.description}</td>
                      <td className="py-3 px-4 text-right font-mono text-white">
                        R$ {trans.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          trans.transaction_type === 'C'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {trans.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {editingId === trans.id ? (
                          <input
                            type="text"
                            value={editData.debit_account || ''}
                            onChange={(e) => setEditData({ ...editData, debit_account: e.target.value })}
                            className="w-full h-8 rounded bg-[#0B0C15] border border-white/10 text-white px-2 text-xs"
                          />
                        ) : (
                          <span className="font-mono text-indigo-400 text-xs">{trans.debit_account || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingId === trans.id ? (
                          <input
                            type="text"
                            value={editData.credit_account || ''}
                            onChange={(e) => setEditData({ ...editData, credit_account: e.target.value })}
                            className="w-full h-8 rounded bg-[#0B0C15] border border-white/10 text-white px-2 text-xs"
                          />
                        ) : (
                          <span className="font-mono text-indigo-400 text-xs">{trans.credit_account || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trans.status === 'CLASSIFICADO'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {trans.status === 'CLASSIFICADO' ? 'OK' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingId === trans.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateTransaction(trans.id)}
                              className="p-1.5 text-emerald-400 hover:bg-emerald-600/10 rounded transition-colors"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditData({});
                              }}
                              className="p-1.5 text-rose-400 hover:bg-rose-600/10 rounded transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(trans.id);
                              setEditData({
                                debit_account: trans.debit_account,
                                credit_account: trans.credit_account,
                                status: 'CLASSIFICADO'
                              });
                            }}
                            data-testid={`editar-transacao-${trans.id}`}
                            className="p-1.5 text-indigo-400 hover:bg-indigo-600/10 rounded transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setFormData({ company_id: '', chart_id: '', bank_name: '', period: '' });
                setResult(null);
                setTransactions([]);
              }}
              data-testid="novo-processamento-btn"
              className="h-10 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 border border-white/10 transition-all"
            >
              Novo Processamento
            </button>
            <button
              onClick={() => navigate('/historico')}
              data-testid="ir-historico-btn"
              className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
            >
              Ver Histórico
            </button>
          </div>
        </div>
      )}
    </div>
  );
}