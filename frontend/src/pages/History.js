import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Download, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronRight,
  Building2,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function History() {
  const [statements, setStatements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [statementsRes, companiesRes] = await Promise.all([
        axios.get(`${API}/bank-statements`),
        axios.get(`${API}/companies`)
      ]);
      setStatements(statementsRes.data);
      setCompanies(companiesRes.data);
      
      // Expandir primeira empresa por padrão
      const grouped = groupByCompany(statementsRes.data, companiesRes.data);
      if (Object.keys(grouped).length > 0) {
        const firstCompanyId = Object.keys(grouped)[0];
        setExpandedCompanies({ [firstCompanyId]: true });
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  
  const groupByCompany = (stmts, comps) => {
    const grouped = {};
    stmts.forEach(stmt => {
      const company = comps.find(c => c.id === stmt.company_id);
      const companyName = company?.name || 'Sem Empresa';
      const companyId = stmt.company_id || 'unknown';
      
      if (!grouped[companyId]) {
        grouped[companyId] = {
          name: companyName,
          statements: [],
          totalTransactions: 0,
          totalClassified: 0,
          totalManual: 0,
          totalBalance: 0
        };
      }
      
      grouped[companyId].statements.push(stmt);
      grouped[companyId].totalTransactions += stmt.total_transactions || 0;
      grouped[companyId].totalClassified += stmt.classified_count || 0;
      grouped[companyId].totalManual += stmt.manual_count || 0;
      grouped[companyId].totalBalance += stmt.balance || 0;
    });
    
    // Ordenar statements dentro de cada grupo por data (mais recente primeiro)
    Object.values(grouped).forEach(group => {
      group.statements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });
    
    return grouped;
  };
  
  const groupedStatements = useMemo(() => {
    let filtered = statements;
    
    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = statements.filter(stmt => {
        const company = companies.find(c => c.id === stmt.company_id);
        return (
          company?.name?.toLowerCase().includes(term) ||
          stmt.bank_name?.toLowerCase().includes(term) ||
          stmt.period?.toLowerCase().includes(term)
        );
      });
    }
    
    return groupByCompany(filtered, companies);
  }, [statements, companies, searchTerm]);
  
  const toggleCompany = (companyId) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [companyId]: !prev[companyId]
    }));
  };
  
  const expandAll = () => {
    const allExpanded = {};
    Object.keys(groupedStatements).forEach(id => {
      allExpanded[id] = true;
    });
    setExpandedCompanies(allExpanded);
  };
  
  const collapseAll = () => {
    setExpandedCompanies({});
  };
  
  const handleExport = async (statementId, e) => {
    e.stopPropagation();
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
  
  const handleDelete = async (statementId, e) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este processamento?')) return;
    try {
      await axios.delete(`${API}/bank-statements/${statementId}`);
      toast.success('Processamento excluído');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };
  
  const totalCompanies = Object.keys(groupedStatements).length;
  const totalStatements = statements.length;
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Histórico de Extratos</h1>
        <p className="text-slate-400">Extratos organizados por empresa</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Building2 className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCompanies}</p>
              <p className="text-xs text-slate-500">Empresas</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileSpreadsheet className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalStatements}</p>
              <p className="text-xs text-slate-500">Extratos</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <HistoryIcon className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {statements.reduce((acc, s) => acc + (s.total_transactions || 0), 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-slate-500">Lançamentos</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar empresa, banco ou período..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="search-input"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#13141F] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="h-9 px-3 rounded-lg bg-white/5 text-slate-400 text-sm hover:bg-white/10 hover:text-white transition-all"
          >
            Expandir Todos
          </button>
          <button
            onClick={collapseAll}
            className="h-9 px-3 rounded-lg bg-white/5 text-slate-400 text-sm hover:bg-white/10 hover:text-white transition-all"
          >
            Recolher Todos
          </button>
        </div>
      </div>
      
      {/* Grouped List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-8">
            <p className="text-slate-500 text-center">Carregando...</p>
          </div>
        ) : Object.keys(groupedStatements).length === 0 ? (
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-12 text-center">
            <HistoryIcon className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 mb-4">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum processamento encontrado'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/novo-processamento')}
                data-testid="novo-processamento-vazio-btn"
                className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
              >
                Processar Primeiro Extrato
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedStatements)
            .sort((a, b) => a[1].name.localeCompare(b[1].name))
            .map(([companyId, group]) => (
              <div 
                key={companyId} 
                className="bg-[#13141F] border border-white/5 rounded-xl overflow-hidden"
                data-testid={`company-group-${companyId}`}
              >
                {/* Company Header (Accordion Toggle) */}
                <button
                  onClick={() => toggleCompany(companyId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  data-testid={`toggle-${companyId}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      {expandedCompanies[companyId] ? (
                        <ChevronDown className="text-indigo-400" size={20} />
                      ) : (
                        <ChevronRight className="text-indigo-400" size={20} />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-semibold">{group.name}</h3>
                      <p className="text-xs text-slate-500">
                        {group.statements.length} extrato{group.statements.length !== 1 ? 's' : ''} • {group.totalTransactions.toLocaleString('pt-BR')} lançamentos
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Classificados</span>
                      <p className="text-emerald-400 font-mono text-sm">{group.totalClassified.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Manual</span>
                      <p className="text-amber-400 font-mono text-sm">{group.totalManual.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <span className="text-xs text-slate-500">Saldo Total</span>
                      <p className={`font-mono text-sm ${group.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        R$ {group.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </button>
                
                {/* Expanded Content */}
                {expandedCompanies[companyId] && (
                  <div className="border-t border-white/5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-slate-500 bg-black/20">
                          <th className="text-left py-2 px-4 font-medium">Data</th>
                          <th className="text-left py-2 px-4 font-medium">Banco</th>
                          <th className="text-left py-2 px-4 font-medium">Período</th>
                          <th className="text-center py-2 px-4 font-medium">Lançamentos</th>
                          <th className="text-center py-2 px-4 font-medium">Classificados</th>
                          <th className="text-center py-2 px-4 font-medium">Manual</th>
                          <th className="text-right py-2 px-4 font-medium">Saldo</th>
                          <th className="text-right py-2 px-4 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.statements.map((statement) => (
                          <tr 
                            key={statement.id} 
                            className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => navigate(`/historico/${statement.id}`)}
                            data-testid={`statement-row-${statement.id}`}
                          >
                            <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                              {new Date(statement.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 text-white text-xs">{statement.bank_name}</td>
                            <td className="py-3 px-4 text-slate-300 text-xs">{statement.period}</td>
                            <td className="py-3 px-4 text-center font-mono text-white text-xs">
                              {statement.total_transactions}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {statement.classified_count}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {statement.manual_count}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs">
                              <span className={statement.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                R$ {statement.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/historico/${statement.id}`);
                                  }}
                                  data-testid={`ver-detalhes-${statement.id}`}
                                  className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors"
                                  title="Ver detalhes"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleExport(statement.id, e)}
                                  data-testid={`download-${statement.id}`}
                                  className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/10 rounded-lg transition-colors"
                                  title="Baixar XLSX"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(statement.id, e)}
                                  data-testid={`delete-${statement.id}`}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-600/10 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
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
            ))
        )}
      </div>
    </div>
  );
}
