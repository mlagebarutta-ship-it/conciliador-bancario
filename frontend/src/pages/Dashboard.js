import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Clock,
  AlertCircle,
  ChevronRight,
  Calendar,
  ListChecks,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'EM_DIA':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'ATRASADA':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'MUITO_ATRASADA':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'SEM_EXTRATO':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'EM_DIA':
        return 'Em dia';
      case 'ATRASADA':
        return 'Atrasada';
      case 'MUITO_ATRASADA':
        return 'Muito atrasada';
      case 'SEM_EXTRATO':
        return 'Sem extrato';
      default:
        return status;
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }
  
  const { summary, most_behind_companies, most_pending_companies, all_companies_status } = stats;
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Painel de Controle</h1>
        <p className="text-slate-400">Visão geral operacional do escritório contábil</p>
      </div>
      
      {/* Linha 1 - Visão Geral das Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 hover:border-indigo-500/20 transition-colors duration-300" data-testid="stat-empresas-total">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <Building2 className="text-indigo-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Empresas Cadastradas</p>
          </div>
          <p className="font-heading text-3xl font-bold text-white">{summary.total_companies}</p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 hover:border-emerald-500/20 transition-colors duration-300" data-testid="stat-empresas-em-dia">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <CheckCircle2 className="text-emerald-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Empresas em Dia</p>
          </div>
          <p className="font-heading text-3xl font-bold text-emerald-400">{summary.companies_up_to_date}</p>
          <p className="text-xs text-slate-500 mt-1">
            {summary.total_companies > 0 ? ((summary.companies_up_to_date / summary.total_companies) * 100).toFixed(0) : 0}% do total
          </p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 hover:border-amber-500/20 transition-colors duration-300" data-testid="stat-empresas-atrasadas">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
              <AlertTriangle className="text-amber-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Empresas Atrasadas</p>
          </div>
          <p className="font-heading text-3xl font-bold text-amber-400">{summary.companies_behind + summary.companies_very_behind}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs text-amber-400">{summary.companies_behind} moderado</span>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-rose-400">{summary.companies_very_behind} crítico</span>
          </div>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 hover:border-slate-500/20 transition-colors duration-300" data-testid="stat-empresas-sem-extrato">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-600/20 flex items-center justify-center">
              <XCircle className="text-slate-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Sem Extrato</p>
          </div>
          <p className="font-heading text-3xl font-bold text-slate-400">{summary.companies_no_statement}</p>
          <p className="text-xs text-slate-500 mt-1">empresas sem nenhum extrato</p>
        </div>
      </div>
      
      {/* Linha 2 - Produção do Escritório */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="stat-extratos-processados">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <FileText className="text-indigo-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Extratos Processados</p>
          </div>
          <p className="font-heading text-3xl font-bold text-white">{summary.total_statements}</p>
          <p className="text-xs text-slate-500 mt-1">{summary.total_transactions} lançamentos totais</p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="stat-meses-pendentes">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
              <Calendar className="text-amber-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Meses Contábeis Pendentes</p>
          </div>
          <p className="font-heading text-3xl font-bold text-amber-400">{summary.total_months_pending}</p>
          <p className="text-xs text-slate-500 mt-1">soma de todos os atrasos</p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="stat-lancamentos-pendentes">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-600/20 flex items-center justify-center">
              <ListChecks className="text-rose-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Lançamentos Pendentes</p>
          </div>
          <p className="font-heading text-3xl font-bold text-rose-400">{summary.pending_transactions}</p>
          <p className="text-xs text-slate-500 mt-1">
            {summary.classified_transactions} classificados ({summary.total_transactions > 0 ? ((summary.classified_transactions / summary.total_transactions) * 100).toFixed(0) : 0}%)
          </p>
        </div>
      </div>
      
      {/* Linha 3 - Rankings e Prioridades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ranking de Empresas Mais Atrasadas */}
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-rose-400" size={20} />
            <h2 className="font-heading text-lg font-semibold text-white">Empresas Mais Atrasadas</h2>
          </div>
          
          {most_behind_companies.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={40} />
              <p className="text-slate-400 text-sm">Todas as empresas estão em dia!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {most_behind_companies.map((company, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{company.company_name}</p>
                      <p className="text-xs text-slate-500">Último: {company.last_period || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      company.months_behind > 6 ? 'text-rose-400' : 
                      company.months_behind > 2 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {company.months_behind}
                    </p>
                    <p className="text-xs text-slate-500">meses</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Empresas com Mais Pendências de Classificação */}
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="text-amber-400" size={20} />
            <h2 className="font-heading text-lg font-semibold text-white">Pendências de Classificação</h2>
          </div>
          
          {most_pending_companies.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={40} />
              <p className="text-slate-400 text-sm">Todos os lançamentos classificados!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {most_pending_companies.map((company, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <p className="text-sm text-white font-medium">{company.company_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-400">{company.pending_transactions}</p>
                    <p className="text-xs text-slate-500">pendentes</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Linha 4 - Status Contábil por Empresa */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="text-indigo-400" size={20} />
            <h2 className="font-heading text-lg font-semibold text-white">Status Contábil por Empresa</h2>
          </div>
          <button
            onClick={() => navigate('/empresas')}
            data-testid="gerenciar-empresas-btn"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            Gerenciar empresas <ChevronRight size={14} />
          </button>
        </div>
        
        {all_companies_status.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 mb-4">Nenhuma empresa cadastrada</p>
            <button
              onClick={() => navigate('/empresas')}
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
                  <th className="text-left py-3 px-4 font-medium">Empresa</th>
                  <th className="text-left py-3 px-4 font-medium">CNPJ</th>
                  <th className="text-center py-3 px-4 font-medium">Último Mês Conciliado</th>
                  <th className="text-center py-3 px-4 font-medium">Meses em Atraso</th>
                  <th className="text-center py-3 px-4 font-medium">Pendências</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {all_companies_status.map((company, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{company.company_name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {company.cnpj ? company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono ${company.last_period ? 'text-slate-300' : 'text-slate-500'}`}>
                        {company.last_period || 'Nunca'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold ${
                        company.months_behind === 0 ? 'text-emerald-400' :
                        company.months_behind <= 2 ? 'text-amber-400' :
                        company.months_behind < 999 ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {company.months_behind < 999 ? company.months_behind : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono ${company.pending_transactions > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {company.pending_transactions}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(company.status)}`}>
                        {getStatusLabel(company.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate('/novo-processamento')}
                        data-testid={`processar-${index}`}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
                      >
                        Processar →
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
  );
}
