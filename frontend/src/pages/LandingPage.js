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
  Loader2,
  Shield,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DASHBOARD_IMG = "https://static.prod-images.emergentagent.com/jobs/b690342d-30bd-4f56-8334-3fdf66a81414/images/cdd2596896e7d879a2fc1ccb588b6cc59308f31b9cd9cd107c753e325920f30d.png";

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

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white flex items-center justify-center" style={{ borderRadius: '2px' }}>
                <FileSpreadsheet className="text-black" size={20} />
              </div>
              <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', color: '#fff', letterSpacing: '-0.02em' }}>
                Domínio Bridge
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#funcionalidades" data-testid="nav-features" className="hidden sm:block text-sm text-neutral-400 hover:text-white transition-colors">Funcionalidades</a>
              <a href="#como-funciona" data-testid="nav-how" className="hidden sm:block text-sm text-neutral-400 hover:text-white transition-colors">Como Funciona</a>
              <a 
                href="#login" 
                data-testid="nav-login-btn"
                className="h-9 px-5 bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-all flex items-center gap-2"
                style={{ borderRadius: '2px' }}
              >
                Acessar
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 text-neutral-400 text-xs tracking-widest uppercase mb-8" style={{ borderRadius: '2px' }}>
                <Shield size={14} className="text-white" />
                Plataforma para Contadores
              </div>
              <h1 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05 }} className="text-5xl sm:text-6xl lg:text-7xl text-white mb-6">
                Conciliação<br />
                <span className="text-neutral-500">bancária no</span><br />
                automático.
              </h1>
              <p className="text-lg text-neutral-400 mb-10 max-w-lg leading-relaxed">
                Processe extratos de qualquer banco, classifique transações automaticamente e exporte lançamentos prontos para o Sistema Domínio.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#login" 
                  data-testid="hero-cta-primary"
                  className="h-12 px-8 bg-white text-black font-semibold hover:bg-neutral-200 transition-all flex items-center gap-2"
                  style={{ borderRadius: '2px' }}
                >
                  Comece Agora
                  <ArrowUpRight size={18} />
                </a>
                <a 
                  href="#como-funciona" 
                  data-testid="hero-cta-secondary"
                  className="h-12 px-8 border border-white/15 text-white font-medium hover:bg-white/5 transition-all flex items-center gap-2"
                  style={{ borderRadius: '2px' }}
                >
                  Ver Demo
                </a>
              </div>
              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
                <div>
                  <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800 }} className="text-2xl text-white">98%</div>
                  <div className="text-xs text-neutral-500 mt-1">Precisão na classificação</div>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div>
                  <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800 }} className="text-2xl text-white">5 min</div>
                  <div className="text-xs text-neutral-500 mt-1">Tempo médio de processamento</div>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div>
                  <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800 }} className="text-2xl text-white">4 formatos</div>
                  <div className="text-xs text-neutral-500 mt-1">OFX, Excel, PDF, CSV</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-white/5 to-transparent rounded-sm blur-2xl"></div>
              <div className="relative border border-white/10 overflow-hidden" style={{ borderRadius: '4px' }}>
                <div className="bg-[#141414] px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                  <span className="ml-3 text-xs text-neutral-500">dashboard.dominiobridge.com</span>
                </div>
                <img 
                  src={DASHBOARD_IMG} 
                  alt="Dashboard Domínio Bridge" 
                  className="w-full opacity-90"
                  style={{ filter: 'brightness(0.85)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-widest uppercase text-neutral-500 mb-4">O PROBLEMA</p>
            <h2 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, letterSpacing: '-0.03em' }} className="text-3xl sm:text-4xl text-white mb-6">
              O trabalho manual que ninguém<br />deveria estar fazendo em 2026.
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Escritórios contábeis ainda gastam <span className="text-white font-medium">horas preciosas</span> digitando extratos, 
              classificando transações e tentando manter empresas em dia.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-0 border border-white/10" style={{ borderRadius: '2px' }}>
            <div className="p-8 border-b sm:border-b-0 sm:border-r border-white/10">
              <Clock className="text-white mb-4" size={24} />
              <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700 }} className="text-white text-lg mb-2">Tempo Perdido</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">Horas de digitação manual que poderiam ser investidas em consultoria e planejamento estratégico.</p>
            </div>
            <div className="p-8 border-b sm:border-b-0 sm:border-r border-white/10">
              <FileSpreadsheet className="text-white mb-4" size={24} />
              <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700 }} className="text-white text-lg mb-2">Formatos Diferentes</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">Cada banco envia extratos em formatos distintos. Padronizar manualmente é inviável.</p>
            </div>
            <div className="p-8">
              <Users className="text-white mb-4" size={24} />
              <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700 }} className="text-white text-lg mb-2">Escala Impossível</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">Acompanhar dezenas de empresas por competência sem perder prazos é um desafio diário.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Grid Borders */}
      <section id="funcionalidades" className="py-24 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <p className="text-xs tracking-widest uppercase text-neutral-500 mb-4">FUNCIONALIDADES</p>
            <h2 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, letterSpacing: '-0.03em' }} className="text-3xl sm:text-4xl text-white mb-4">
              Tudo que seu escritório precisa.
            </h2>
            <p className="text-neutral-400 max-w-xl">
              Uma plataforma completa para automatizar o processamento de extratos bancários, da importação à exportação.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/10">
            {[
              { icon: FileSpreadsheet, title: 'Importação de Extratos', desc: 'OFX, Excel, PDF ou CSV de qualquer banco brasileiro' },
              { icon: RefreshCw, title: 'Conversão Automática', desc: 'Converta entre formatos com um clique. Excel para OFX, PDF para OFX' },
              { icon: Sparkles, title: 'Classificação Inteligente', desc: 'O sistema aprende com suas classificações e automatiza o processo' },
              { icon: CheckCircle, title: 'Conciliação Bancária', desc: 'Gere lançamentos contábeis automaticamente a partir das transações' },
              { icon: Building2, title: 'Gestão por Competência', desc: 'Controle empresas por período mensal com status detalhado e alertas' },
              { icon: BarChart3, title: 'Dashboard Gerencial', desc: 'Métricas em tempo real, empresas atrasadas e produtividade da equipe' }
            ].map((f, i) => (
              <div key={i} className="p-8 border-r border-b border-white/10 group hover:bg-white/[0.02] transition-colors">
                <f.icon className="text-neutral-400 mb-5 group-hover:text-white transition-colors" size={22} />
                <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700 }} className="text-white mb-2">{f.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Bento Grid */}
      <section id="como-funciona" className="py-24 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-widest uppercase text-neutral-500 mb-4">COMO FUNCIONA</p>
            <h2 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, letterSpacing: '-0.03em' }} className="text-3xl sm:text-4xl text-white mb-4">
              4 passos. Zero complicação.
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Da importação do extrato à exportação para o Domínio em minutos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10" style={{ borderRadius: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { num: '01', icon: Upload, title: 'Importar', desc: 'Faça upload do extrato em qualquer formato suportado', accent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { num: '02', icon: Search, title: 'Identificar', desc: 'O sistema identifica transações, valores e datas automaticamente', accent: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              { num: '03', icon: Zap, title: 'Classificar', desc: 'Transações são classificadas com base em regras e histórico', accent: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { num: '04', icon: FileDown, title: 'Exportar', desc: 'Arquivo Excel pronto para importação no Sistema Domínio', accent: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
            ].map((step, i) => (
              <div key={i} className="bg-[#0A0A0A] p-8 relative">
                <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900 }} className="text-5xl text-white/[0.04] absolute top-4 right-4">
                  {step.num}
                </div>
                <div className={`w-12 h-12 border flex items-center justify-center mb-5 ${step.accent}`} style={{ borderRadius: '2px' }}>
                  <step.icon size={22} />
                </div>
                <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700 }} className="text-white text-lg mb-2">{step.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800 }} className="text-3xl text-white">9.500+</div>
              <div className="text-xs text-neutral-500 mt-2">Transações processadas</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800 }} className="text-3xl text-white">142</div>
              <div className="text-xs text-neutral-500 mt-2">Extratos importados</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800 }} className="text-3xl text-white">29</div>
              <div className="text-xs text-neutral-500 mt-2">Empresas ativas</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800 }} className="text-3xl text-white">98%</div>
              <div className="text-xs text-neutral-500 mt-2">Taxa de classificação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login" className="py-24 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-md mx-auto">
          <div className="border border-white/10 p-8" style={{ background: '#111111', borderRadius: '4px' }}>
            <div className="mb-8">
              <h2 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, letterSpacing: '-0.02em' }} className="text-2xl text-white mb-2">
                Acesse o Sistema
              </h2>
              <p className="text-neutral-500 text-sm">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  data-testid="login-email"
                  className="w-full h-12 px-4 bg-[#1A1A1A] border border-white/10 text-white placeholder-neutral-600 focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                  style={{ borderRadius: '2px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    data-testid="login-senha"
                    className="w-full h-12 px-4 pr-12 bg-[#1A1A1A] border border-white/10 text-white placeholder-neutral-600 focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                    style={{ borderRadius: '2px', fontSize: '14px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer" data-testid="remember-device">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-white" />
                  <span className="text-xs text-neutral-500">Lembrar dispositivo</span>
                </label>
                <button type="button" data-testid="forgot-password-link" className="text-xs text-neutral-400 hover:text-white transition-colors font-medium">
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                className="w-full h-12 bg-white text-black font-semibold hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '2px' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-neutral-500">
                Novo por aqui? <button data-testid="register-link" className="text-white font-medium hover:underline">Solicite acesso</button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white flex items-center justify-center" style={{ borderRadius: '2px' }}>
              <FileSpreadsheet className="text-black" size={14} />
            </div>
            <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: '14px', color: '#fff' }}>
              Domínio Bridge
            </span>
          </div>
          <p className="text-neutral-600 text-xs">
            &copy; {new Date().getFullYear()} Domínio Bridge. Sistema de Conciliação Contábil.
          </p>
        </div>
      </footer>
    </div>
  );
}
