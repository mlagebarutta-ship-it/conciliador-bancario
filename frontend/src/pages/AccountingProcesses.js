import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Building2, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Archive,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  X,
  Edit2,
  Trash2,
  Link,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  'NAO_INICIADO': { label: 'Não iniciado', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: Clock },
  'EM_PROCESSAMENTO': { label: 'Em processamento', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Clock },
  'AGUARDANDO_DOCUMENTOS': { label: 'Aguardando docs', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertCircle },
  'CONCLUIDO': { label: 'Concluído', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  'ARQUIVADO': { label: 'Arquivado', color: 'text-slate-500 bg-slate-600/10 border-slate-600/20', icon: Archive }
};

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AccountingProcesses() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState([]);
  const [groupedProcesses, setGroupedProcesses] = useState({});
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [responsibles, setResponsibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'
  const [showArchived, setShowArchived] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    company_id: '',
    year: '',
    month: '',
    status: '',
    responsible: '',
    search: ''
  });
  
  // Expansão de empresas/anos
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());
  const [expandedYears, setExpandedYears] = useState(new Set());
  
  // Modais
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  
  // Formulário novo processamento
  const [newProcess, setNewProcess] = useState({
    company_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    responsible: ''
  });
  
  // Formulário criação em massa
  const [bulkCreate, setBulkCreate] = useState({
    company_id: '',
    start_year: new Date().getFullYear(),
    start_month: 1,
    end_year: new Date().getFullYear(),
    end_month: new Date().getMonth() + 1,
    responsible: ''
  });
  
  useEffect(() => {
    loadData();
  }, [showArchived]);
  
  const loadData = async () => {
    try {
      const [processesRes, groupedRes, companiesRes, statsRes, responsiblesRes] = await Promise.all([
        axios.get(`${API}/accounting-processes?is_archived=${showArchived}`),
        axios.get(`${API}/accounting-processes/grouped?is_archived=${showArchived}`),
        axios.get(`${API}/companies`),
        axios.get(`${API}/accounting-processes/stats`),
        axios.get(`${API}/accounting-processes/responsibles/list`)
      ]);
      
      setProcesses(processesRes.data);
      setGroupedProcesses(groupedRes.data);
      setCompanies(companiesRes.data);
      setStats(statsRes.data);
      setResponsibles(responsiblesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateProcess = async () => {
    if (!newProcess.company_id) {
      toast.error('Selecione uma empresa');
      return;
    }
    
    try {
      await axios.post(`${API}/accounting-processes`, newProcess);
      toast.success('Processamento criado com sucesso');
      setShowNewModal(false);
      setNewProcess({
        company_id: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        responsible: ''
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar processamento');
    }
  };
  
  const handleBulkCreate = async () => {
    if (!bulkCreate.company_id) {
      toast.error('Selecione uma empresa');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/accounting-processes/bulk-create`, null, {
        params: bulkCreate
      });
      toast.success(`${response.data.count} processamentos criados`);
      setShowBulkModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar processamentos');
    }
  };
  
  const handleUpdateProcess = async () => {
    if (!editingProcess) return;
    
    try {
      await axios.put(`${API}/accounting-processes/${editingProcess.id}`, {
        status: editingProcess.status,
        responsible: editingProcess.responsible,
        observations: editingProcess.observations
      });
      toast.success('Processamento atualizado');
      setShowEditModal(false);
      setEditingProcess(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao atualizar processamento');
    }
  };
  
  const handleArchiveProcess = async (processId) => {
    try {
      await axios.post(`${API}/accounting-processes/${processId}/archive`);
      toast.success('Processamento arquivado');
      loadData();
    } catch (error) {
      toast.error('Erro ao arquivar processamento');
    }
  };
  
  const handleDeleteProcess = async (processId) => {
    if (!window.confirm('Tem certeza que deseja excluir este processamento?')) return;
    
    try {
      await axios.delete(`${API}/accounting-processes/${processId}`);
      toast.success('Processamento excluído');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir processamento');
    }
  };
  
  const handleArchiveOld = async () => {
    try {
      const response = await axios.post(`${API}/accounting-processes/archive-old?months_old=12`);
      toast.success(`${response.data.archived_count} processamentos arquivados`);
      loadData();
    } catch (error) {
      toast.error('Erro ao arquivar processamentos antigos');
    }
  };
  
  const toggleCompany = (companyName) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyName)) {
      newExpanded.delete(companyName);
    } else {
      newExpanded.add(companyName);
    }
    setExpandedCompanies(newExpanded);
  };
  
  const toggleYear = (companyName, year) => {
    const key = `${companyName}-${year}`;
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedYears(newExpanded);
  };
  
  // Filtrar processos na visualização de lista
  const filteredProcesses = processes.filter(p => {
    if (filters.company_id && p.company_id !== filters.company_id) return false;
    if (filters.year && p.year !== parseInt(filters.year)) return false;
    if (filters.month && p.month !== parseInt(filters.month)) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.responsible && !p.responsible?.toLowerCase().includes(filters.responsible.toLowerCase())) return false;
    if (filters.search && !p.company_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
  
  const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['NAO_INICIADO'];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Processamentos Contábeis</h1>
          <p className="text-slate-400">Gerenciamento organizado por empresa, ano e mês</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleArchiveOld}
            className="h-10 px-4 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
          >
            <Archive size={16} />
            Arquivar Antigos
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="h-10 px-4 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
          >
            <Calendar size={16} />
            Criar em Massa
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            data-testid="novo-processamento-btn"
            className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Processamento
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-600/20 flex items-center justify-center">
                <AlertCircle className="text-rose-400" size={20} />
              </div>
              <p className="text-xs uppercase text-slate-500 font-medium">Empresas c/ Pendências</p>
            </div>
            <p className="font-heading text-3xl font-bold text-rose-400">{stats.companies_with_pending}</p>
          </div>
          
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <Clock className="text-amber-400" size={20} />
              </div>
              <p className="text-xs uppercase text-slate-500 font-medium">Atrasados</p>
            </div>
            <p className="font-heading text-3xl font-bold text-amber-400">{stats.overdue_count}</p>
          </div>
          
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <FileText className="text-blue-400" size={20} />
              </div>
              <p className="text-xs uppercase text-slate-500 font-medium">Em Andamento</p>
            </div>
            <p className="font-heading text-3xl font-bold text-blue-400">{stats.in_progress_count}</p>
          </div>
          
          <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <CheckCircle2 className="text-emerald-400" size={20} />
              </div>
              <p className="text-xs uppercase text-slate-500 font-medium">Concluídos</p>
            </div>
            <p className="font-heading text-3xl font-bold text-emerald-400">{stats.completed_count}</p>
          </div>
        </div>
      )}
      
      {/* Filtros e Controles */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Buscar empresa..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          
          {/* Filtro por Empresa */}
          <select
            value={filters.company_id}
            onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
            className="h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todas as Empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          
          {/* Filtro por Ano */}
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos os Anos</option>
            {[2026, 2025, 2024, 2023].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          
          {/* Filtro por Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos os Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          
          {/* Toggle Arquivados */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-all ${
              showArchived 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Archive size={16} />
            Arquivados
          </button>
          
          {/* Toggle View Mode */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setViewMode('grouped')}
              className={`h-10 px-4 flex items-center gap-2 transition-all ${
                viewMode === 'grouped' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-[#0B0C15] text-slate-400 hover:bg-white/5'
              }`}
            >
              <Building2 size={16} />
              Agrupado
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`h-10 px-4 flex items-center gap-2 transition-all ${
                viewMode === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-[#0B0C15] text-slate-400 hover:bg-white/5'
              }`}
            >
              <FileText size={16} />
              Lista
            </button>
          </div>
        </div>
      </div>
      
      {/* Conteúdo */}
      {viewMode === 'grouped' ? (
        /* Visualização Agrupada */
        <div className="space-y-4">
          {Object.keys(groupedProcesses).length === 0 ? (
            <div className="bg-[#13141F] border border-white/5 rounded-xl p-12 text-center">
              <Calendar className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-500 mb-4">Nenhum processamento encontrado</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
              >
                Criar Primeiro Processamento
              </button>
            </div>
          ) : (
            Object.entries(groupedProcesses).map(([companyName, companyData]) => (
              <div key={companyName} className="bg-[#13141F] border border-white/5 rounded-xl overflow-hidden">
                {/* Cabeçalho da Empresa */}
                <button
                  onClick={() => toggleCompany(companyName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedCompanies.has(companyName) ? (
                      <ChevronDown className="text-indigo-400" size={20} />
                    ) : (
                      <ChevronRight className="text-slate-500" size={20} />
                    )}
                    <Building2 className="text-indigo-400" size={20} />
                    <span className="text-white font-medium">{companyName}</span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {Object.keys(companyData.years).length} ano(s)
                  </span>
                </button>
                
                {/* Anos */}
                {expandedCompanies.has(companyName) && (
                  <div className="border-t border-white/5">
                    {Object.entries(companyData.years)
                      .sort(([a], [b]) => parseInt(b) - parseInt(a))
                      .map(([year, yearData]) => (
                        <div key={year} className="border-b border-white/5 last:border-b-0">
                          {/* Cabeçalho do Ano */}
                          <button
                            onClick={() => toggleYear(companyName, year)}
                            className="w-full flex items-center justify-between p-4 pl-12 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {expandedYears.has(`${companyName}-${year}`) ? (
                                <ChevronDown className="text-indigo-400" size={16} />
                              ) : (
                                <ChevronRight className="text-slate-500" size={16} />
                              )}
                              <Calendar className="text-slate-400" size={16} />
                              <span className="text-slate-300 font-medium">{year}</span>
                            </div>
                            <span className="text-sm text-slate-500">
                              {Object.keys(yearData.months).length} mês(es)
                            </span>
                          </button>
                          
                          {/* Meses */}
                          {expandedYears.has(`${companyName}-${year}`) && (
                            <div className="bg-[#0B0C15]/50">
                              {Object.entries(yearData.months)
                                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                                .map(([month, process]) => (
                                  <div
                                    key={month}
                                    className="flex items-center justify-between p-4 pl-20 border-t border-white/5 hover:bg-white/5 transition-colors"
                                  >
                                    <div className="flex items-center gap-4">
                                      <span className="text-white font-mono w-24">
                                        {MONTHS[parseInt(month)]}
                                      </span>
                                      <StatusBadge status={process.status} />
                                      {process.responsible && (
                                        <span className="text-sm text-slate-500 flex items-center gap-1">
                                          <User size={12} />
                                          {process.responsible}
                                        </span>
                                      )}
                                      {process.pending_transactions > 0 && (
                                        <span className="text-xs text-amber-400">
                                          {process.pending_transactions} pendentes
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingProcess(process);
                                          setShowEditModal(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleArchiveProcess(process.id)}
                                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                      >
                                        <Archive size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProcess(process.id)}
                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Visualização em Lista */
        <div className="bg-[#13141F] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                <th className="text-left py-3 px-4 font-medium">Empresa</th>
                <th className="text-center py-3 px-4 font-medium">Período</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Responsável</th>
                <th className="text-center py-3 px-4 font-medium">Lançamentos</th>
                <th className="text-center py-3 px-4 font-medium">Pendentes</th>
                <th className="text-right py-3 px-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    Nenhum processamento encontrado
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((process) => (
                  <tr key={process.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{process.company_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-slate-300">{process.period}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={process.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {process.responsible || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {process.total_transactions}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono ${process.pending_transactions > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {process.pending_transactions}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingProcess(process);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleArchiveProcess(process.id)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProcess(process.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal Novo Processamento */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Novo Processamento</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Empresa *</label>
                <select
                  value={newProcess.company_id}
                  onChange={(e) => setNewProcess({ ...newProcess, company_id: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Ano *</label>
                  <select
                    value={newProcess.year}
                    onChange={(e) => setNewProcess({ ...newProcess, year: parseInt(e.target.value) })}
                    className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {[2026, 2025, 2024, 2023].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Mês *</label>
                  <select
                    value={newProcess.month}
                    onChange={(e) => setNewProcess({ ...newProcess, month: parseInt(e.target.value) })}
                    className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {MONTHS.slice(1).map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Responsável</label>
                <input
                  type="text"
                  value={newProcess.responsible}
                  onChange={(e) => setNewProcess({ ...newProcess, responsible: e.target.value })}
                  placeholder="Nome do responsável"
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 h-10 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProcess}
                className="flex-1 h-10 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Criação em Massa */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Criar Processamentos em Massa</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <p className="text-sm text-indigo-400">
                Cria automaticamente processamentos para todos os meses no período selecionado.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Empresa *</label>
                <select
                  value={bulkCreate.company_id}
                  onChange={(e) => setBulkCreate({ ...bulkCreate, company_id: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Ano Início</label>
                  <select
                    value={bulkCreate.start_year}
                    onChange={(e) => setBulkCreate({ ...bulkCreate, start_year: parseInt(e.target.value) })}
                    className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Mês Início</label>
                  <select
                    value={bulkCreate.start_month}
                    onChange={(e) => setBulkCreate({ ...bulkCreate, start_month: parseInt(e.target.value) })}
                    className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {MONTHS.slice(1).map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Ano Fim</label>
                  <select
                    value={bulkCreate.end_year}
                    onChange={(e) => setBulkCreate({ ...bulkCreate, end_year: parseInt(e.target.value) })}
                    className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Mês Fim</label>
                  <select
                    value={bulkCreate.end_month}
                    onChange={(e) => setBulkCreate({ ...bulkCreate, end_month: parseInt(e.target.value) })}
                    className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {MONTHS.slice(1).map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Responsável</label>
                <input
                  type="text"
                  value={bulkCreate.responsible}
                  onChange={(e) => setBulkCreate({ ...bulkCreate, responsible: e.target.value })}
                  placeholder="Nome do responsável"
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 h-10 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkCreate}
                className="flex-1 h-10 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
              >
                Criar Processamentos
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Editar Processamento */}
      {showEditModal && editingProcess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Processamento</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProcess(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <p className="text-white font-medium">{editingProcess.company_name}</p>
              <p className="text-sm text-slate-400">{editingProcess.period}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status</label>
                <select
                  value={editingProcess.status}
                  onChange={(e) => setEditingProcess({ ...editingProcess, status: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Responsável</label>
                <input
                  type="text"
                  value={editingProcess.responsible || ''}
                  onChange={(e) => setEditingProcess({ ...editingProcess, responsible: e.target.value })}
                  placeholder="Nome do responsável"
                  className="w-full h-10 px-4 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Observações</label>
                <textarea
                  value={editingProcess.observations || ''}
                  onChange={(e) => setEditingProcess({ ...editingProcess, observations: e.target.value })}
                  placeholder="Observações sobre o processamento..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-[#0B0C15] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProcess(null);
                }}
                className="flex-1 h-10 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateProcess}
                className="flex-1 h-10 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
