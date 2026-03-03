import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { History as HistoryIcon, Download, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function History() {
  const [statements, setStatements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const navigate = useNavigate();
  const { id } = useParams();
  
  useEffect(() => {
    loadData();
  }, [selectedCompany]);
  
  const loadData = async () => {
    try {
      const query = selectedCompany !== 'all' ? `?company_id=${selectedCompany}` : '';
      const [statementsRes, companiesRes] = await Promise.all([
        axios.get(`${API}/bank-statements${query}`),
        axios.get(`${API}/companies`)
      ]);
      setStatements(statementsRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async (statementId) => {
    try {
      const response = await axios.get(`${API}/bank-statements/${statementId}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato_${statementId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Arquivo baixado');
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };
  
  const handleDelete = async (statementId) => {
    if (!window.confirm('Tem certeza que deseja excluir este processamento?')) return;
    try {
      await axios.delete(`${API}/bank-statements/${statementId}`);
      toast.success('Processamento excluído');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };
  
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Histórico de Processamentos</h1>
          <p className="text-slate-400">Todos os extratos processados</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            data-testid="filtro-empresa"
            className="h-10 rounded-lg bg-[#13141F] border border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all px-4"
          >
            <option value="all">Todas as empresas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : statements.length === 0 ? (
          <div className="text-center py-12">
            <HistoryIcon className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 mb-4">Nenhum processamento encontrado</p>
            <button
              onClick={() => navigate('/novo-processamento')}
              data-testid="novo-processamento-vazio-btn"
              className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
            >
              Processar Primeiro Extrato
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                  <th className="text-left py-3 px-4 font-medium">Data</th>
                  <th className="text-left py-3 px-4 font-medium">Empresa</th>
                  <th className="text-left py-3 px-4 font-medium">Banco</th>
                  <th className="text-left py-3 px-4 font-medium">Período</th>
                  <th className="text-center py-3 px-4 font-medium">Lançamentos</th>
                  <th className="text-center py-3 px-4 font-medium">Classificados</th>
                  <th className="text-center py-3 px-4 font-medium">Manual</th>
                  <th className="text-right py-3 px-4 font-medium">Saldo</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((statement) => {
                  const company = companies.find(c => c.id === statement.company_id);
                  return (
                    <tr key={statement.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`statement-row-${statement.id}`}>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {new Date(statement.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-white">{company?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-300">{statement.bank_name}</td>
                      <td className="py-3 px-4 text-slate-300">{statement.period}</td>
                      <td className="py-3 px-4 text-center font-mono text-white">{statement.total_transactions}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {statement.classified_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {statement.manual_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={statement.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          R$ {statement.balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/historico/${statement.id}`)}
                            data-testid={`ver-detalhes-${statement.id}`}
                            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors"
                            title="Ver detalhes e editar"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleExport(statement.id)}
                            data-testid={`download-${statement.id}`}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/10 rounded-lg transition-colors"
                            title="Baixar XLS"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(statement.id)}
                            data-testid={`delete-${statement.id}`}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-600/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}