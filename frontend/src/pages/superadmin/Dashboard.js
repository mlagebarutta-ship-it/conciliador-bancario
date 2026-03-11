import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  FileSpreadsheet, 
  Activity, 
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await axios.get(`${API}/superadmin/dashboard`, { headers: getAuthHeader() });
      setData(response.data);
    } catch (error) {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  const metricas = data?.metricas || {};
  const planos = data?.escritorios_por_plano || {};
  const topEscritorios = data?.top_escritorios || [];
  const atividadeRecente = data?.atividade_recente || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-indigo-400 text-sm mb-2">
          <Activity size={16} />
          <span>Painel Super Admin</span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Dashboard da Plataforma</h1>
        <p className="text-slate-400">Visão geral de todos os escritórios e métricas do sistema</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/superadmin/escritorios" className="group">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <Building2 className="text-indigo-400" size={24} />
              </div>
              <ArrowUpRight className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{metricas.total_escritorios || 0}</p>
            <p className="text-slate-400 text-sm">Escritórios Cadastrados</p>
            <p className="text-emerald-400 text-xs mt-2">{metricas.escritorios_ativos || 0} ativos</p>
          </div>
        </Link>

        <Link to="/superadmin/usuarios" className="group">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Users className="text-emerald-400" size={24} />
              </div>
              <ArrowUpRight className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{metricas.total_usuarios || 0}</p>
            <p className="text-slate-400 text-sm">Usuários na Plataforma</p>
          </div>
        </Link>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Building2 className="text-amber-400" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{metricas.total_empresas || 0}</p>
          <p className="text-slate-400 text-sm">Empresas Cadastradas</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-500/20 rounded-xl">
              <FileSpreadsheet className="text-rose-400" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{metricas.total_extratos || 0}</p>
          <p className="text-slate-400 text-sm">Extratos Processados</p>
          <p className="text-slate-500 text-xs mt-2">{(metricas.total_transacoes || 0).toLocaleString('pt-BR')} transações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Escritórios por Plano */}
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-400" />
            Escritórios por Plano
          </h3>
          <div className="space-y-3">
            {Object.entries(planos).length > 0 ? (
              Object.entries(planos).map(([plano, count]) => (
                <div key={plano} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      plano === 'enterprise' ? 'bg-purple-500' :
                      plano === 'profissional' ? 'bg-indigo-500' : 'bg-slate-500'
                    }`}></div>
                    <span className="text-slate-300 capitalize">{plano}</span>
                  </div>
                  <span className="text-white font-mono">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Top Escritórios */}
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-emerald-400" />
            Top 5 Escritórios
          </h3>
          <div className="space-y-3">
            {topEscritorios.length > 0 ? (
              topEscritorios.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-500 text-amber-900' :
                      index === 1 ? 'bg-slate-400 text-slate-900' :
                      index === 2 ? 'bg-amber-700 text-amber-100' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-slate-300 truncate max-w-[150px]">{item.nome}</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-sm">{item.total_empresas} emp.</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            Atividade Recente (24h)
          </h3>
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {atividadeRecente.length > 0 ? (
              atividadeRecente.slice(0, 8).map((log, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-slate-300">
                      <span className="text-white font-medium">{log.usuario_nome}</span>
                      {log.tenant_nome && (
                        <span className="text-slate-500"> ({log.tenant_nome})</span>
                      )}
                    </p>
                    <p className="text-slate-500 text-xs">{log.acao}</p>
                    <p className="text-slate-600 text-xs">
                      {new Date(log.data_hora).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">Nenhuma atividade recente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
