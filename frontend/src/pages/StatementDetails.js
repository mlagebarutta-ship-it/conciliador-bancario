import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Edit2, Save, X, FileText, CheckCircle, AlertCircle, CheckSquare, Square, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StatementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [statement, setStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filter, setFilter] = useState('all');
  
  // Estados para edição em massa
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    debit_account: '',
    credit_account: '',
    status: ''
  });
  const [bulkLoading, setBulkLoading] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [id]);
  
  const loadData = async () => {
    try {
      const [statementRes, transactionsRes] = await Promise.all([
        api.get(`/bank-statements/${id}`),
        api.get(`/bank-statements/${id}/transactions`)
      ]);
      
      setStatement(statementRes.data);
      setTransactions(transactionsRes.data);
      
      // Buscar empresa
      const companyRes = await api.get(`/companies/${statementRes.data.company_id}`);
      setCompany(companyRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateTransaction = async (transId) => {
    try {
      await api.put(`/transactions/${transId}`, editData);
      setTransactions(transactions.map(t => t.id === transId ? { ...t, ...editData } : t));
      setEditingId(null);
      setEditData({});
      toast.success('Transação atualizada');
      
      // Recarregar statement para atualizar contadores
      const statementRes = await api.get(`/bank-statements/${id}`);
      setStatement(statementRes.data);
    } catch (error) {
      toast.error('Erro ao atualizar transação');
    }
  };
  
  // Função para edição em massa
  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecione pelo menos um lançamento');
      return;
    }
    
    // Verificar se pelo menos um campo foi preenchido
    if (!bulkEditData.debit_account && !bulkEditData.credit_account && !bulkEditData.status) {
      toast.error('Preencha pelo menos um campo para atualizar');
      return;
    }
    
    setBulkLoading(true);
    
    try {
      // Preparar dados para enviar - só campos preenchidos
      const updateData = {};
      if (bulkEditData.debit_account) updateData.debit_account = bulkEditData.debit_account;
      if (bulkEditData.credit_account) updateData.credit_account = bulkEditData.credit_account;
      if (bulkEditData.status) updateData.status = bulkEditData.status;
      
      // Chamar API de atualização em massa
      await api.put(`/transactions/bulk-update`, {
        transaction_ids: Array.from(selectedIds),
        update_data: updateData
      });
      
      // Atualizar estado local
      setTransactions(transactions.map(t => 
        selectedIds.has(t.id) ? { ...t, ...updateData } : t
      ));
      
      // Limpar seleção e fechar modal
      setSelectedIds(new Set());
      setShowBulkEdit(false);
      setBulkEditData({ debit_account: '', credit_account: '', status: '' });
      
      toast.success(`${selectedIds.size} lançamentos atualizados com sucesso!`);
      
      // Recarregar statement para atualizar contadores
      const statementRes = await api.get(`/bank-statements/${id}`);
      setStatement(statementRes.data);
    } catch (error) {
      toast.error('Erro ao atualizar lançamentos em massa');
      console.error(error);
    } finally {
      setBulkLoading(false);
    }
  };
  
  // Funções de seleção
  const toggleSelect = (transId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(transId)) {
      newSelected.delete(transId);
    } else {
      newSelected.add(transId);
    }
    setSelectedIds(newSelected);
  };
  
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };
  
  const handleExport = async () => {
    try {
      const response = await api.get(`/bank-statements/${id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato_${id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Arquivo XLSX baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar arquivo');
    }
  };
  
  const filteredTransactions = filter === 'all' ? transactions :
    filter === 'classified' ? transactions.filter(t => t.status === 'CLASSIFICADO') :
    filter === 'manual' ? transactions.filter(t => t.status === 'CLASSIFICAR MANUALMENTE') :
    filter === 'credit' ? transactions.filter(t => t.transaction_type === 'C') :
    transactions.filter(t => t.transaction_type === 'D');
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!statement) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Processamento não encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/historico')}
            data-testid="voltar-historico-btn"
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-heading text-4xl font-bold text-white mb-2">Detalhes do Processamento</h1>
            <p className="text-slate-400">{company?.name} - {statement.bank_name} - {statement.period}</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          data-testid="baixar-xlsx-detalhes-btn"
          className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] flex items-center gap-2"
        >
          <Download size={16} />
          Baixar XLSX
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="detalhes-total-lancamentos">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-indigo-400" size={20} />
            <p className="text-xs uppercase text-slate-500 font-medium">Total de Lançamentos</p>
          </div>
          <p className="font-heading text-3xl font-bold text-white">{statement.total_transactions}</p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="detalhes-classificados">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-emerald-400" size={20} />
            <p className="text-xs uppercase text-slate-500 font-medium">Classificados Auto.</p>
          </div>
          <p className="font-heading text-3xl font-bold text-emerald-400">{statement.classified_count}</p>
          <p className="text-xs text-slate-500 mt-1">
            {((statement.classified_count / statement.total_transactions) * 100).toFixed(0)}%
          </p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="detalhes-manual">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-amber-400" size={20} />
            <p className="text-xs uppercase text-slate-500 font-medium">Revisão Manual</p>
          </div>
          <p className="font-heading text-3xl font-bold text-amber-400">{statement.manual_count}</p>
          <p className="text-xs text-slate-500 mt-1">
            {((statement.manual_count / statement.total_transactions) * 100).toFixed(0)}%
          </p>
        </div>
        
        <div className="bg-[#13141F] border border-white/5 rounded-xl p-6" data-testid="detalhes-saldo">
          <p className="text-xs uppercase text-slate-500 font-medium mb-4">Saldo do Período</p>
          <p className={`font-heading text-3xl font-bold ${
            statement.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            R$ {statement.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div>
              <span className="text-slate-500">Entradas: </span>
              <span className="text-emerald-400 font-mono">R$ {statement.total_inflows.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Saídas: </span>
              <span className="text-rose-400 font-mono">R$ {statement.total_outflows.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transactions Table */}
      <div className="bg-[#13141F] border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="font-heading text-xl font-semibold text-white">Lançamentos</h2>
            
            {/* Indicador de seleção e botão de edição em massa */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-indigo-400 font-medium">
                  {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowBulkEdit(true)}
                  data-testid="editar-em-massa-btn"
                  className="h-8 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-all flex items-center gap-2"
                >
                  <Edit3 size={14} />
                  Editar Selecionados
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="h-8 px-3 rounded-lg bg-white/5 text-slate-400 text-sm hover:text-white hover:bg-white/10 transition-all"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {['all', 'classified', 'manual', 'credit', 'debit'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                data-testid={`filter-detalhes-${f}`}
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
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                <th className="text-center py-3 px-2 font-medium w-10">
                  <button
                    onClick={toggleSelectAll}
                    data-testid="selecionar-todos-btn"
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0 ? (
                      <CheckSquare size={16} className="text-indigo-400" />
                    ) : (
                      <Square size={16} className="text-slate-500" />
                    )}
                  </button>
                </th>
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
                <tr 
                  key={trans.id} 
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedIds.has(trans.id) ? 'bg-indigo-500/10' : ''
                  }`}
                >
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => toggleSelect(trans.id)}
                      data-testid={`checkbox-${trans.id}`}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {selectedIds.has(trans.id) ? (
                        <CheckSquare size={16} className="text-indigo-400" />
                      ) : (
                        <Square size={16} className="text-slate-500" />
                      )}
                    </button>
                  </td>
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
                          data-testid={`salvar-${trans.id}`}
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
                        data-testid={`editar-detalhes-${trans.id}`}
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
      
      {/* Modal de Edição em Massa */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13141F] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edição em Massa</h3>
              <button
                onClick={() => setShowBulkEdit(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <p className="text-sm text-indigo-400">
                <strong>{selectedIds.size}</strong> lançamento{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Os campos preenchidos serão aplicados a todos os lançamentos selecionados.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Conta Débito</label>
                <input
                  type="text"
                  value={bulkEditData.debit_account}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, debit_account: e.target.value })}
                  placeholder="Ex: 4.1.1.01.000001"
                  data-testid="bulk-debit-account"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white px-4 text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Conta Crédito</label>
                <input
                  type="text"
                  value={bulkEditData.credit_account}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, credit_account: e.target.value })}
                  placeholder="Ex: 1.1.1.02.000001"
                  data-testid="bulk-credit-account"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white px-4 text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status</label>
                <select
                  value={bulkEditData.status}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, status: e.target.value })}
                  data-testid="bulk-status"
                  className="w-full h-10 rounded-lg bg-[#0B0C15] border border-white/10 text-white px-4 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Manter atual</option>
                  <option value="CLASSIFICADO">Classificado (OK)</option>
                  <option value="CLASSIFICAR MANUALMENTE">Manual</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkEdit(false)}
                className="flex-1 h-10 rounded-lg bg-white/5 text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={bulkLoading}
                data-testid="aplicar-edicao-massa-btn"
                className="flex-1 h-10 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bulkLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Aplicar Alterações
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
