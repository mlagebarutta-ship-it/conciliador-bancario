import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Sparkles, 
  CheckCircle, 
  Building2, 
  LayoutDashboard,
  Upload,
  Search,
  Zap,
  FileDown,
  Clock,
  Users,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { email, senha });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success(`Bem-vindo, ${user.nome}!`);
      onLogin(user);
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao fazer login';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: FileSpreadsheet,
      title: 'Importação de Extratos',
      description: 'Importe extratos em OFX, Excel, PDF ou CSV de qualquer banco'
    },
    {
      icon: RefreshCw,
      title: 'Conversão Automática',
      description: 'Converta arquivos de diferentes formatos para OFX padronizado'
    },
    {
      icon: Sparkles,
      title: 'Classificação Inteligente',
      description: 'IA que aprende com suas classificações e automatiza o processo'
    },
    {
      icon: CheckCircle,
      title: 'Conciliação Bancária',
      description: 'Concilie transações e gere lançamentos contábeis automaticamente'
    },
    {
      icon: Building2,
      title: 'Organização por Período',
      description: 'Controle empresas por competência mensal com status detalhado'
    },
    {
      icon: LayoutDashboard,
      title: 'Dashboard Gerencial',
      description: 'Visão completa do escritório com métricas e alertas'
    }
  ];

  const steps = [
    {
      number: '01',
      icon: Upload,
      title: 'Importar Extrato',
      description: 'Faça upload do extrato bancário em qualquer formato suportado'
    },
    {
      number: '02',
      icon: Search,
      title: 'Identificação',
      description: 'O sistema identifica automaticamente as transações e valores'
    },
    {
      number: '03',
      icon: Zap,
      title: 'Classificação',
      description: 'Transações são classificadas automaticamente com base no histórico'
    },
    {
      number: '04',
      icon: FileDown,
      title: 'Exportação',
      description: 'Exporte para o formato do Domínio pronto para importação'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <FileSpreadsheet className="text-white" size={22} />
              </div>
              <span className="text-xl font-bold text-white">Domínio Bridge</span>
            </div>
            <a 
              href="#login" 
              className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all flex items-center gap-2"
            >
              Acessar Sistema
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
                <Sparkles size={16} />
                Sistema Inteligente para Contadores
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Automatize a 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Conciliação Bancária</span>
              </h1>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Processe extratos bancários de múltiplos formatos e converta em lançamentos 
                contábeis prontos para importação no Sistema Domínio. Economize horas de trabalho manual.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#login" 
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                >
                  Acessar Sistema
                  <ArrowRight size={18} />
                </a>
                <a 
                  href="#como-funciona" 
                  className="h-12 px-8 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all border border-white/10"
                >
                  Como Funciona
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-8 bg-indigo-500/20 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-white/5 rounded w-full"></div>
                  <div className="h-4 bg-white/5 rounded w-5/6"></div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="h-20 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-400 text-2xl font-bold">156</span>
                    </div>
                    <div className="h-20 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-400 text-2xl font-bold">23</span>
                    </div>
                    <div className="h-20 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex items-center justify-center">
                      <span className="text-indigo-400 text-2xl font-bold">98%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            O Problema que Resolvemos
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            Escritórios contábeis gastam <span className="text-white font-semibold">horas preciosas</span> organizando 
            extratos bancários, classificando transações manualmente e tentando regularizar empresas atrasadas. 
            Esse processo repetitivo consome tempo que poderia ser dedicado a atividades estratégicas.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
              <Clock className="text-rose-400 mb-4 mx-auto" size={32} />
              <h3 className="text-white font-semibold mb-2">Tempo Perdido</h3>
              <p className="text-slate-500 text-sm">Horas de digitação manual que poderiam ser automatizadas</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
              <FileSpreadsheet className="text-amber-400 mb-4 mx-auto" size={32} />
              <h3 className="text-white font-semibold mb-2">Múltiplos Formatos</h3>
              <p className="text-slate-500 text-sm">Cada banco envia extratos em formatos diferentes</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
              <Users className="text-indigo-400 mb-4 mx-auto" size={32} />
              <h3 className="text-white font-semibold mb-2">Controle de Clientes</h3>
              <p className="text-slate-500 text-sm">Dificuldade em acompanhar múltiplas empresas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Tudo que você precisa para automatizar o processamento de extratos bancários
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:border-indigo-500/30 transition-all hover:bg-slate-800/50"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
                  <feature.icon className="text-indigo-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Em apenas 4 passos simples, transforme seus extratos em lançamentos contábeis
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-indigo-500/50 to-transparent -translate-x-6 z-0"></div>
                )}
                <div className="relative bg-slate-800/50 border border-white/5 rounded-xl p-6 text-center">
                  <div className="text-6xl font-bold text-indigo-500/20 absolute top-2 right-4">
                    {step.number}
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
                    <step.icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
                <FileSpreadsheet className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Acesse o Sistema</h2>
              <p className="text-slate-400 text-sm">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  data-testid="login-email"
                  className="w-full h-12 px-4 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    data-testid="login-senha"
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Domínio Bridge. Sistema de Conciliação Contábil.
          </p>
        </div>
      </footer>
    </div>
  );
}
