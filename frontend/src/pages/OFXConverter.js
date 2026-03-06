import React, { useState } from 'react';
import axios from 'axios';
import { 
  Upload, 
  FileText, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OFXConverter() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [charts, setCharts] = useState([]);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importConfig, setImportConfig] = useState({
    company_id: '',
    chart_id: '',
    bank_name: '',
    period: ''
  });
  
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validar extensão
    const validExtensions = ['.pdf', '.xlsx', '.xls', '.csv'];
    const fileExt = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExt)) {
      toast.error('Formato não suportado. Use PDF, XLSX, XLS ou CSV.');
      return;
    }
    
    setFile(selectedFile);
    setPreview(null);
    
    // Fazer preview automático
    await handlePreview(selectedFile);
  };
  
  const handlePreview = async (selectedFile) => {
    const fileToUse = selectedFile || file;
    if (!fileToUse) return;
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', fileToUse);
      
      const response = await axios.post(`${API}/converter/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPreview(response.data);
      toast.success(`${response.data.total_transactions} transações detectadas!`);
      
      // Carregar empresas e planos de contas para importação
      const [companiesRes, chartsRes] = await Promise.all([
        axios.get(`${API}/companies`),
        axios.get(`${API}/chart-of-accounts`)
      ]);
      setCompanies(companiesRes.data);
      setCharts(chartsRes.data);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao processar arquivo');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadOFX = async () => {
    if (!preview) return;
    
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${API}/converter/generate-ofx`,
        preview.transactions,
        {
          params: { bank_name: importConfig.bank_name || 'BANCO' },
          responseType: 'blob'
        }
      );
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato_convertido_${new Date().toISOString().slice(0,10)}.ofx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Arquivo OFX baixado com sucesso!');
      
    } catch (error) {
      toast.error('Erro ao gerar arquivo OFX');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImportToSystem = async () => {
    if (!preview) return;
    
    if (!importConfig.company_id || !importConfig.chart_id) {
      toast.error('Selecione a empresa e o plano de contas');
      return;
    }
    
    setImporting(true);
    
    try {
      const response = await axios.post(
        `${API}/converter/import-to-system`,
        preview.transactions,
        {
          params: {
            company_id: importConfig.company_id,
            chart_id: importConfig.chart_id,
            bank_name: importConfig.bank_name || 'BANCO',
            period: importConfig.period
          }
        }
      );
      
      toast.success(`${response.data.total_transactions} transações importadas!`);
      setShowImportModal(false);
      
      // Redirecionar para os detalhes do extrato
      navigate(`/historico/${response.data.statement_id}`);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao importar para o sistema');
    } finally {
      setImporting(false);
    }
  };
  
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImportConfig({
      company_id: '',
      chart_id: '',
      bank_name: '',
      period: ''
    });
  };
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Conversor de Extratos para OFX</h1>
        <p className="text-slate-400">Converta extratos em PDF, Excel ou CSV para o formato OFX padronizado</p>
      </div>
      
      {/* Upload Area */}
      {!preview && (
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-8 mb-8">
          <div className="text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleFileSelect}
            />
            
            {!file ? (
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <div className="border-2 border-dashed border-white/10 rounded-xl p-12 hover:border-indigo-500/50 transition-colors">
                  <Upload className="mx-auto text-slate-500 mb-4" size={48} />
                  <p className="text-white font-medium mb-2">Clique para selecionar um arquivo</p>
                  <p className="text-sm text-slate-500">ou arraste e solte aqui</p>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <span className="text-xs text-slate-600 bg-white/5 px-3 py-1 rounded-full">PDF</span>
                    <span className="text-xs text-slate-600 bg-white/5 px-3 py-1 rounded-full">XLSX</span>
                    <span className="text-xs text-slate-600 bg-white/5 px-3 py-1 rounded-full">XLS</span>
                    <span className="text-xs text-slate-600 bg-white/5 px-3 py-1 rounded-full">CSV</span>
                  </div>
                </div>
              </label>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <FileSpreadsheet className="text-indigo-400" size={32} />
                <div className="text-left">
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                {loading && (
                  <RefreshCw className="text-indigo-400 animate-spin ml-4" size={24} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Preview */}
      {preview && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="text-indigo-400" size={20} />
                <p className="text-xs uppercase text-slate-500 font-medium">Arquivo</p>
              </div>
              <p className="text-white font-medium truncate">{preview.file_name}</p>
              <p className="text-xs text-slate-500 mt-1">Tipo: {preview.file_type}</p>
            </div>
            
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <p className="text-xs uppercase text-slate-500 font-medium">Transações</p>
              </div>
              <p className="font-heading text-3xl font-bold text-white">{preview.total_transactions}</p>
            </div>
            
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <ArrowUpRight className="text-emerald-400" size={20} />
                <p className="text-xs uppercase text-slate-500 font-medium">Créditos</p>
              </div>
              <p className="font-heading text-2xl font-bold text-emerald-400">
                R$ {preview.total_credits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <ArrowDownRight className="text-rose-400" size={20} />
                <p className="text-xs uppercase text-slate-500 font-medium">Débitos</p>
              </div>
              <p className="font-heading text-2xl font-bold text-rose-400">
                R$ {preview.total_debits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          {/* Ações */}
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="h-10 px-4 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Novo Arquivo
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownloadOFX}
                  disabled={loading}
                  data-testid="baixar-ofx-btn"
                  className="h-10 px-6 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={16} />
                  Baixar OFX
                </button>
                
                <button
                  onClick={() => setShowImportModal(true)}
                  disabled={loading}
                  data-testid="importar-conciliacao-btn"
                  className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowRight size={16} />
                  Importar para Conciliação
                </button>
              </div>
            </div>
          </div>
          
          {/* Tabela de Preview */}
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-semibold text-white">Preview das Transações</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight size={12} />
                  {preview.transactions.filter(t => t.type === 'CREDIT').length} créditos
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs text-rose-400 flex items-center gap-1">
                  <ArrowDownRight size={12} />
                  {preview.transactions.filter(t => t.type === 'DEBIT').length} débitos
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#13141F]">
                  <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                    <th className="text-left py-3 px-4 font-medium">#</th>
                    <th className="text-left py-3 px-4 font-medium">Data</th>
                    <th className="text-left py-3 px-4 font-medium">Descrição</th>
                    <th className="text-right py-3 px-4 font-medium">Valor</th>
                    <th className="text-center py-3 px-4 font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.transactions.map((trans, index) => (
                    <tr key={trans.fit_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{index + 1}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{trans.date}</td>
                      <td className="py-3 px-4 text-white max-w-md truncate">{trans.description}</td>
                      <td className={`py-3 px-4 text-right font-mono font-medium ${
                        trans.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {trans.type === 'CREDIT' ? '+' : '-'} R$ {Math.abs(trans.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          trans.type === 'CREDIT'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}>
                          {trans.type === 'CREDIT' ? 'Crédito' : 'Débito'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Importar para Conciliação</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <p className="text-sm text-indigo-400">
                <strong>{preview?.total_transactions}</strong> transações serão importadas para o sistema de conciliação.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Empresa *</label>
                <select
                  value={importConfig.company_id}
                  onChange={(e) => setImportConfig({ ...importConfig, company_id: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Plano de Contas *</label>
                <select
                  value={importConfig.chart_id}
                  onChange={(e) => setImportConfig({ ...importConfig, chart_id: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {charts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Banco</label>
                <input
                  type="text"
                  value={importConfig.bank_name}
                  onChange={(e) => setImportConfig({ ...importConfig, bank_name: e.target.value })}
                  placeholder="Ex: Santander, Bradesco, Itaú..."
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Período (MM/AAAA)</label>
                <input
                  type="text"
                  value={importConfig.period}
                  onChange={(e) => setImportConfig({ ...importConfig, period: e.target.value })}
                  placeholder="Ex: 10/2025"
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 h-10 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportToSystem}
                disabled={importing || !importConfig.company_id || !importConfig.chart_id}
                className="flex-1 h-10 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Importando...
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    Importar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
