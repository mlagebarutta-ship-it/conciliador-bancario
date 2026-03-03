import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [statements, setStatements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const totalProcessed = statements.length;
  const totalTransactions = statements.reduce((sum, s) => sum + s.total_transactions, 0);
  const totalInflows = statements.reduce((sum, s) => sum + s.total_inflows, 0);
  const totalOutflows = statements.reduce((sum, s) => sum + s.total_outflows, 0);
  
  const recentStatements = statements.slice(0, 5);
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Visão geral dos processamentos contábeis</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 hover:border-indigo-500/20 transition-colors duration-300" data-testid="stat-extratos-processados">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <FileText className="text-indigo-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Extratos Processados</p>
          </div>
          <p className="font-heading text-3xl font-bold text-white">{totalProcessed}</p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 hover:border-indigo-500/20 transition-colors duration-300" data-testid="stat-lancamentos">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <Clock className="text-emerald-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Total de Lançamentos</p>
          </div>
          <p className="font-heading text-3xl font-bold text-white">{totalTransactions}</p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 hover:border-indigo-500/20 transition-colors duration-300" data-testid="stat-entradas">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Total de Entradas</p>
          </div>
          <p className="font-heading text-3xl font-bold text-emerald-400">
            R$ {totalInflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6 hover:border-indigo-500/20 transition-colors duration-300" data-testid="stat-saidas">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-600/20 flex items-center justify-center">
              <TrendingDown className="text-rose-400" size={20} />
            </div>
            <p className="text-xs uppercase text-slate-500 font-medium tracking-wide">Total de Saídas</p>
          </div>
          <p className="font-heading text-3xl font-bold text-rose-400">
            R$ {totalOutflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      {/* Recent Statements */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-semibold text-white">Processamentos Recentes</h2>
          <button
            onClick={() => navigate('/historico')}
            data-testid="ver-todos-btn"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Ver todos →
          </button>
        </div>
        
        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : recentStatements.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 mb-4">Nenhum processamento realizado ainda</p>
            <button
              onClick={() => navigate('/novo-processamento')}
              data-testid="processar-primeiro-extrato-btn"
              className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
            >
              Processar Primeiro Extrato
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                  <th className="text-left py-3 px-4 font-medium">Empresa</th>
                  <th className="text-left py-3 px-4 font-medium">Banco</th>
                  <th className="text-left py-3 px-4 font-medium">Período</th>
                  <th className="text-right py-3 px-4 font-medium">Lançamentos</th>
                  <th className="text-right py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recentStatements.map((statement) => {
                  const company = companies.find(c => c.id === statement.company_id);
                  return (
                    <tr key={statement.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white">{company?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-300">{statement.bank_name}</td>
                      <td className="py-3 px-4 text-slate-300">{statement.period}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{statement.total_transactions}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {statement.classified_count} classificados
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/historico/${statement.id}`)}
                          data-testid={`ver-detalhes-${statement.id}`}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
                        >
                          Ver detalhes
                        </button>
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