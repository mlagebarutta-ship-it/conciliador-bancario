import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';
import { 
  Activity, 
  Search, 
  User,
  Building2,
  Calendar,
  Filter
} from 'lucide-react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    loadLogs();
  }, [limit]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/activity-logs?limit=${limit}`);
      setLogs(response.data);
    } catch (error) {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.usuario_nome?.toLowerCase().includes(term) ||
      log.acao?.toLowerCase().includes(term) ||
      log.empresa_nome?.toLowerCase().includes(term) ||
      log.detalhes?.toLowerCase().includes(term)
    );
  });

  const getActionColor = (acao) => {
    if (acao.includes('exclu') || acao.includes('Exclu') || acao.includes('remov') || acao.includes('Remov')) {
      return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
    if (acao.includes('cria') || acao.includes('Cria') || acao.includes('import') || acao.includes('Import')) {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
    if (acao.includes('atualiz') || acao.includes('Atualiz') || acao.includes('edit') || acao.includes('Edit')) {
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Log de Atividades</h1>
        <p className="text-slate-400">Histórico de ações realizadas no sistema</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#13141F] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="h-10 px-4 rounded-lg bg-[#13141F] border border-white/10 text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value={50}>Últimos 50</option>
          <option value={100}>Últimos 100</option>
          <option value={200}>Últimos 200</option>
          <option value={500}>Últimos 500</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Activity className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{filteredLogs.length}</p>
              <p className="text-xs text-slate-500">Total de Registros</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <User className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {new Set(logs.map(l => l.usuario_id)).size}
              </p>
              <p className="text-xs text-slate-500">Usuários Ativos</p>
            </div>
          </div>
        </div>
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Calendar className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {logs.length > 0 ? new Date(logs[0].data_hora).toLocaleDateString('pt-BR') : '-'}
              </p>
              <p className="text-xs text-slate-500">Última Atividade</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLogs.map((log, index) => (
              <div 
                key={log.id || index} 
                className="p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-2 bg-indigo-500/10 rounded-lg mt-0.5">
                    <Activity className="text-indigo-400" size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{log.usuario_nome}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.acao)}`}>
                        {log.acao}
                      </span>
                    </div>
                    
                    {log.detalhes && (
                      <p className="text-slate-400 text-sm mt-1">{log.detalhes}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(log.data_hora).toLocaleString('pt-BR')}
                      </span>
                      {log.empresa_nome && (
                        <span className="flex items-center gap-1">
                          <Building2 size={12} />
                          {log.empresa_nome}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
