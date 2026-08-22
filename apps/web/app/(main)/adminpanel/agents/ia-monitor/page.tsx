"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Clock, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  Key,
  Database,
  Terminal,
  TrendingUp,
  Sliders,
  Filter,
  Eye,
  RotateCcw,
  Check,
  ChevronDown,
  Layers,
  Cpu,
  HelpCircle,
  X
} from 'lucide-react';

interface FixtureAiAnalysis {
  id: string;
  matchId: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  leagueName: string;
  leagueFlag: string;
  matchDate: string;
  matchTime: string;
  score?: string;
  probHome: number;
  probDraw: number;
  probAway: number;
  predictionSummary: string;
  tips: string[];
  commentary: string;
  status: 'AUDITED_HIT' | 'AUDITED_MISS' | 'PENDING' | 'LIVE';
  auditDetails?: string;
  promptTokens: number;
  latencyMs: number;
  provider: string;
  model: string;
  updatedAt: string;
}

interface LearningInsight {
  id: string;
  league: string;
  category: string;
  accuracy: number;
  sampleSize: number;
  biasDetected: string;
  calibrationApplied: string;
  status: 'ACTIVE' | 'CALIBRATED';
}

interface ConsoleLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  event: string;
  details: string;
  latency?: number;
}

export default function IaMonitorAgentDashboardPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'learning' | 'logs'>('audit');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  
  // Modal de Auditoria de Prompt
  const [selectedAnalysis, setSelectedAnalysis] = useState<FixtureAiAnalysis | null>(null);

  // Mock Inicial Rico com Dados de Previsões e Auditoria
  const [analyses, setAnalyses] = useState<FixtureAiAnalysis[]>([
    {
      id: 'ai-1',
      matchId: 'bra-flapa',
      homeTeam: 'Flamengo',
      homeLogo: 'https://media.api-sports.io/football/teams/127.png',
      awayTeam: 'Palmeiras',
      awayLogo: 'https://media.api-sports.io/football/teams/121.png',
      leagueName: 'Brasileirão Série A',
      leagueFlag: '🇧🇷',
      matchDate: 'Hoje',
      matchTime: '16:00',
      score: '2 x 1',
      probHome: 52,
      probDraw: 26,
      probAway: 22,
      predictionSummary: 'Favoritismo ligeiro do Flamengo pelo fator Maracanã e eficiência ofensiva recente.',
      tips: ['Vitória Flamengo', 'Ambos Marcam: Sim', 'Mais de 1.5 gols'],
      commentary: 'O Flamengo chega motivado pela sequência invicta em casa e volume de finalizações. O Palmeiras tem transição rápida perigosa com seus pontas, o que aumenta a expectativa de gols para os dois lados.',
      status: 'AUDITED_HIT',
      auditDetails: 'Previsão correta de vitória do mandante e Ambos Marcam bateu aos 64 min.',
      promptTokens: 840,
      latencyMs: 1140,
      provider: 'Google Gemini',
      model: 'gemini-1.5-flash',
      updatedAt: 'Há 25 min'
    },
    {
      id: 'ai-2',
      matchId: 'eur-rma-bar',
      homeTeam: 'Real Madrid',
      homeLogo: 'https://media.api-sports.io/football/teams/541.png',
      awayTeam: 'Barcelona',
      awayLogo: 'https://media.api-sports.io/football/teams/529.png',
      leagueName: 'La Liga',
      leagueFlag: '🇪🇸',
      matchDate: 'Amanhã',
      matchTime: '17:00',
      probHome: 46,
      probDraw: 27,
      probAway: 27,
      predictionSummary: 'Equilíbrio tático extremo com tendência de jogo aberto no Bernabéu.',
      tips: ['Mais de 2.5 gols', 'Ambos Marcam', 'Empate ou Real Madrid'],
      commentary: 'O Real Madrid conta com sua velocidade de contra-ataque, enquanto o Barcelona prioriza a posse de bola no terço final. Confronto direto pelo topo da tabela.',
      status: 'PENDING',
      promptTokens: 920,
      latencyMs: 1250,
      provider: 'Google Gemini',
      model: 'gemini-1.5-flash',
      updatedAt: 'Há 1 hora'
    },
    {
      id: 'ai-3',
      matchId: 'eur-ars-mci',
      homeTeam: 'Arsenal',
      homeLogo: 'https://media.api-sports.io/football/teams/42.png',
      awayTeam: 'Manchester City',
      awayLogo: 'https://media.api-sports.io/football/teams/50.png',
      leagueName: 'Premier League',
      leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      matchDate: 'Ontem',
      matchTime: '12:30',
      score: '0 x 0',
      probHome: 32,
      probDraw: 33,
      probAway: 35,
      predictionSummary: 'Duelo de alta intensidade defensiva com probabilidade elevada de empate tático.',
      tips: ['Menos de 2.5 gols', 'Empate no 1º Tempo'],
      commentary: 'Ambas as equipes adotam postura de cautela com linhas compactas. A tendência de gols baixos se confirmou pelo controle mútuo de meio-campo.',
      status: 'AUDITED_HIT',
      auditDetails: 'Previsão de Menos de 2.5 gols e alta chance de empate confirmadas.',
      promptTokens: 890,
      latencyMs: 1080,
      provider: 'Google Gemini',
      model: 'gemini-1.5-flash',
      updatedAt: 'Ontem'
    },
    {
      id: 'ai-4',
      matchId: 'bra-spfc-cor',
      homeTeam: 'São Paulo',
      homeLogo: 'https://media.api-sports.io/football/teams/126.png',
      awayTeam: 'Corinthians',
      awayLogo: 'https://media.api-sports.io/football/teams/131.png',
      leagueName: 'Paulistão',
      leagueFlag: '🇧🇷',
      matchDate: 'Ontem',
      matchTime: '18:30',
      score: '1 x 2',
      probHome: 58,
      probDraw: 24,
      probAway: 18,
      predictionSummary: 'Favoritismo do São Paulo pelo mando no Morumbi e desfalques no rival.',
      tips: ['Vitória São Paulo', 'Menos de 3.5 gols'],
      commentary: 'O São Paulo pressionou a posse, mas sofreu com duas bolas paradas do Corinthians que definiram o clássico.',
      status: 'AUDITED_MISS',
      auditDetails: 'Desvio identificado: Superestimação do mando em clássico sem considerar eficiência de bola parada.',
      promptTokens: 860,
      latencyMs: 1190,
      provider: 'Google Gemini',
      model: 'gemini-1.5-flash',
      updatedAt: 'Ontem'
    },
    {
      id: 'ai-5',
      matchId: 'bra-gre-int',
      homeTeam: 'Grêmio',
      homeLogo: 'https://media.api-sports.io/football/teams/130.png',
      awayTeam: 'Internacional',
      awayLogo: 'https://media.api-sports.io/football/teams/119.png',
      leagueName: 'Gauchão',
      leagueFlag: '🇧🇷',
      matchDate: 'Hoje',
      matchTime: '21:00',
      probHome: 38,
      probDraw: 34,
      probAway: 28,
      predictionSummary: 'Grenal com probabilidade alta de cartões e jogo truncado.',
      tips: ['Menos de 2.5 gols', 'Empate ou Grêmio'],
      commentary: 'Clássico tradicionalmente tenso com poucas chances claras de gol nos primeiros 45 minutos.',
      status: 'PENDING',
      promptTokens: 810,
      latencyMs: 1020,
      provider: 'Google Gemini',
      model: 'gemini-1.5-flash',
      updatedAt: 'Há 15 min'
    }
  ]);

  // Lista de Aprendizados Catalogados
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([
    {
      id: 'lrn-1',
      league: 'Brasileirão Série A',
      category: 'Mercado Ambos Marcam',
      accuracy: 84.6,
      sampleSize: 39,
      biasDetected: 'Times do G6 mantêm média alta de gols como visitante.',
      calibrationApplied: 'Injeção de peso positivo (+15%) para Ambos Marcam quando mandante sofre > 1.1 gols/jogo.',
      status: 'ACTIVE'
    },
    {
      id: 'lrn-2',
      league: 'Estaduais / Clássicos',
      category: 'Favoritismo de Mandante',
      accuracy: 72.3,
      sampleSize: 26,
      biasDetected: 'Superestimação de mando de campo em clássicos regionais de alta tensão.',
      calibrationApplied: 'Equilíbrio forçado: probabilidade do visitante recebe incremento de segurança de 8%.',
      status: 'CALIBRATED'
    },
    {
      id: 'lrn-3',
      league: 'Premier League',
      category: 'Gols Over/Under 2.5',
      accuracy: 81.0,
      sampleSize: 42,
      biasDetected: 'Jogos envolvendo top 4 contra bloco baixo costumam ter menos de 2.5 gols quando há rotação.',
      calibrationApplied: 'Detecção de rotação de elenco antes do prompt para refinar o limite de gols.',
      status: 'ACTIVE'
    }
  ]);

  // Console Logs
  const [logs, setLogs] = useState<ConsoleLog[]>([
    {
      id: 'log-1',
      timestamp: '15:25:12',
      level: 'SUCCESS',
      event: 'Geração de Análise IA Concluída',
      details: 'Match #bra-flapa (Flamengo vs Palmeiras) processada com sucesso via Gemini 1.5 Flash.',
      latency: 1140
    },
    {
      id: 'log-2',
      timestamp: '15:20:04',
      level: 'INFO',
      event: 'Auditoria Pós-Jogo FT Executada',
      details: 'Auditados 3 jogos da rodada passada. Taxa de acerto acumulada: 78.4%.',
    },
    {
      id: 'log-3',
      timestamp: '15:15:30',
      level: 'INFO',
      event: 'Injeção de Memória de Aprendizado',
      details: 'Carregadas 3 diretrizes dinâmicas de calibração para o prompt do Grenal.',
    },
    {
      id: 'log-4',
      timestamp: '14:48:19',
      level: 'SUCCESS',
      event: 'Healthcheck API Key Gemini',
      details: 'API Key ativa. Quota mensal em 18.2%. Latência média: 1.18s.',
      latency: 240
    }
  ]);

  // Ações
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setNotification({ type: 'success', message: 'Métricas e análises de IA sincronizadas com sucesso!' });
      setTimeout(() => setNotification(null), 4000);
    }, 800);
  };

  const handleTestApiKey = () => {
    setIsTestingApiKey(true);
    setTimeout(() => {
      setIsTestingApiKey(false);
      setNotification({ type: 'success', message: 'API Key Validada: Google Gemini 1.5 Flash responding in 210ms (Healthy).' });
      setTimeout(() => setNotification(null), 5000);
      
      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'SUCCESS',
          event: 'Teste de API Key Executado',
          details: 'Google Gemini API Key testada com payload padrão. Resposta 200 OK.',
          latency: 210
        },
        ...prev
      ]);
    }, 1000);
  };

  const handleRecalibrateMemory = () => {
    setIsRecalibrating(true);
    setTimeout(() => {
      setIsRecalibrating(false);
      setNotification({ type: 'info', message: 'Memória de Aprendizado recalibrada com base nos últimos 100 confrontos.' });
      setTimeout(() => setNotification(null), 4000);

      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'INFO',
          event: 'Recalibração de Memória Manual',
          details: 'Agente recalculou pesos de assertividade e atualizou 3 diretrizes de calibração.',
        },
        ...prev
      ]);
    }, 1200);
  };

  const handleRegenerateAnalysis = (id: string, matchName: string) => {
    setNotification({ type: 'info', message: `Regenerando análise com IA para ${matchName}...` });
    setTimeout(() => {
      setNotification({ type: 'success', message: `Análise de ${matchName} atualizada com novas estatísticas e escalações!` });
      setTimeout(() => setNotification(null), 4000);

      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'SUCCESS',
          event: 'Regeneração de Análise Disparada',
          details: `Nova chamada ao modelo para a partida ${matchName}. Prompt reconstruído com escalações oficiais.`,
          latency: 1180
        },
        ...prev
      ]);
    }, 1500);
  };

  // Filtros
  const filteredAnalyses = analyses.filter(item => {
    if (selectedLeagueFilter !== 'all' && item.leagueName !== selectedLeagueFilter) return false;
    if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/adminpanel/agents"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar aos Agentes</span>
            </Link>
            <span className="badge badge-live">
              • GOVERNANÇA & APRENDIZADO DE IA
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            Monitor de <span style={{ color: 'var(--primary)' }}>IA</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
            Auditoria autônoma de palpites esportivos, monitoramento de cotas da LLM (Gemini/OpenAI) e retroalimentação contínua com histórico de erros e acertos.
          </p>
        </div>

        {/* Ações de Topo */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleTestApiKey}
            disabled={isTestingApiKey}
            className="px-4 py-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            {isTestingApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            <span>Testar API Key</span>
          </button>

          <button 
            onClick={handleRecalibrateMemory}
            disabled={isRecalibrating}
            className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            {isRecalibrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
            <span>Recalibrar Memória</span>
          </button>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-5 py-2.5 rounded-2xl bg-[var(--primary)] hover:opacity-90 text-white text-xs font-black transition-all shadow-lg shadow-orange-950/40 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar Painel</span>
          </button>
        </div>
      </div>

      {/* Notificação Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : notification.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid de 5 Cards de KPIs & Status de Infraestrutura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1: Taxa de Assertividade */}
        <div className="card glass p-6 rounded-3xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Assertividade 30d</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-4 flex items-baseline gap-2">
            <span>78.4%</span>
            <span className="text-xs font-bold text-emerald-500/80">(+3.2%)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            107 palpites auditados pós-jogo
          </p>
        </div>

        {/* Card 2: Análises Hoje */}
        <div className="card glass p-6 rounded-3xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Análises Hoje</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-4">
            14 <span className="text-sm font-medium text-slate-400">partidas</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            100% da rodada coberta
          </p>
        </div>

        {/* Card 3: Latência & Tokens */}
        <div className="card glass p-6 rounded-3xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Latência / Tokens</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-400 mt-4 flex items-baseline gap-2">
            <span>1.18s</span>
            <span className="text-xs font-bold text-slate-400">| 42.5k tok</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Média por prompt gerado
          </p>
        </div>

        {/* Card 4: Alertas de Inconsistência */}
        <div className="card glass p-6 rounded-3xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Inconsistências</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-400 mt-4">
            0 <span className="text-sm font-medium text-slate-400">falhas</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            100% respostas JSON válidas
          </p>
        </div>

        {/* Card 5: API Key & Usage */}
        <div className="card glass p-6 rounded-3xl border border-[var(--glass-border)] shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>API Key & Usage</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Ativa (Healthy)</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            RPM: 14/60 • Cota: 18.2%
          </p>
        </div>
      </div>

      {/* Navegação entre Abas do Agente */}
      <div className="flex border-b border-[var(--border)] gap-8">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 relative ${
            activeTab === 'audit' 
              ? 'text-white' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4 text-orange-500" />
          <span>Auditoria de Partidas & Previsões</span>
          {activeTab === 'audit' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] shadow-lg shadow-orange-500/50"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('learning')}
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 relative ${
            activeTab === 'learning' 
              ? 'text-white' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Brain className="w-4 h-4 text-amber-400" />
          <span>Memória de Aprendizado & Vieses</span>
          {activeTab === 'learning' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-lg shadow-amber-500/50"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 relative ${
            activeTab === 'logs' 
              ? 'text-white' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Console de Feedback & Logs</span>
          {activeTab === 'logs' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
          )}
        </button>
      </div>

      {/* ABA 1: AUDITORIA DE PARTIDAS & PREVISÕES */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar por:</span>
              </span>

              {/* Filtro Liga */}
              <select
                value={selectedLeagueFilter}
                onChange={(e) => setSelectedLeagueFilter(e.target.value)}
                className="bg-slate-800 text-xs font-bold text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Todas as Ligas</option>
                <option value="Brasileirão Série A">Brasileirão Série A</option>
                <option value="La Liga">La Liga</option>
                <option value="Premier League">Premier League</option>
                <option value="Paulistão">Paulistão</option>
                <option value="Gauchão">Gauchão</option>
              </select>

              {/* Filtro Status */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-800 text-xs font-bold text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Todos os Status</option>
                <option value="AUDITED_HIT">✅ Acertou (Hit)</option>
                <option value="AUDITED_MISS">❌ Desvio (Miss)</option>
                <option value="PENDING">⏳ Aguardando Jogo</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-400">
              Mostrando <span className="text-white font-black">{filteredAnalyses.length}</span> de {analyses.length} análises
            </span>
          </div>

          {/* Tabela de Previsões */}
          <div className="card glass rounded-3xl border border-[var(--glass-border)] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/40 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-800">
                    <th className="p-6">Confronto & Competição</th>
                    <th className="p-6">Probabilidades</th>
                    <th className="p-6">Dicas da IA</th>
                    <th className="p-6">Status Pós-Jogo</th>
                    <th className="p-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAnalyses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-all group">
                      {/* Confronto */}
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                            <span>{item.leagueFlag}</span>
                            <span>{item.leagueName}</span>
                            <span>•</span>
                            <span>{item.matchDate} às {item.matchTime}</span>
                          </span>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="font-black text-white text-base">{item.homeTeam}</span>
                            {item.score && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-xs font-black text-amber-400 border border-slate-700">
                                {item.score}
                              </span>
                            )}
                            <span className="text-slate-500 font-bold text-xs">vs</span>
                            <span className="font-black text-white text-base">{item.awayTeam}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 line-clamp-1 italic max-w-md">
                            "{item.predictionSummary}"
                          </p>
                        </div>
                      </td>

                      {/* Probabilidades */}
                      <td className="p-6">
                        <div className="flex flex-col gap-1.5 w-44">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-emerald-400">{item.probHome}%</span>
                            <span className="text-slate-400">{item.probDraw}%</span>
                            <span className="text-blue-400">{item.probAway}%</span>
                          </div>
                          {/* Barra tripla */}
                          <div className="h-2 rounded-full bg-slate-800 flex overflow-hidden">
                            <div style={{ width: `${item.probHome}%` }} className="bg-emerald-500"></div>
                            <div style={{ width: `${item.probDraw}%` }} className="bg-slate-500"></div>
                            <div style={{ width: `${item.probAway}%` }} className="bg-blue-500"></div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                            <span>Casa</span>
                            <span>Empate</span>
                            <span>Fora</span>
                          </div>
                        </div>
                      </td>

                      {/* Dicas */}
                      <td className="p-6">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {item.tips.map((tip, idx) => (
                            <span 
                              key={idx}
                              className="px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px] font-bold"
                            >
                              {tip}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-6">
                        {item.status === 'AUDITED_HIT' && (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ACERTOU</span>
                            </span>
                            {item.auditDetails && (
                              <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">
                                {item.auditDetails}
                              </span>
                            )}
                          </div>
                        )}

                        {item.status === 'AUDITED_MISS' && (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-black">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>DESVIO</span>
                            </span>
                            {item.auditDetails && (
                              <span className="text-[10px] text-red-400/80 line-clamp-1 max-w-[200px]">
                                {item.auditDetails}
                              </span>
                            )}
                          </div>
                        )}

                        {item.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>AGUARDANDO FT</span>
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => setSelectedAnalysis(item)}
                            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                            title="Auditar Prompt e Payload"
                          >
                            <Eye className="w-4 h-4 text-purple-400" />
                            <span>Prompt</span>
                          </button>

                          <button
                            onClick={() => handleRegenerateAnalysis(item.id, `${item.homeTeam} vs ${item.awayTeam}`)}
                            className="p-2.5 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:border-orange-500/50 transition-all text-xs font-bold flex items-center gap-1.5"
                            title="Regenerar Previsão com IA"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Regenerar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: MEMÓRIA DE APRENDIZADO & VIESES */}
      {activeTab === 'learning' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Motor de Retroalimentação & Dynamic Few-Shot
                </h3>
                <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
                  O agente compara cada partida encerrada (FT) com a previsão pré-jogo. Erros recorrentes são transformados em <strong className="text-white">Diretrizes de Calibração</strong> que são injetadas automaticamente nos próximos prompts para elevar a assertividade.
                </p>
              </div>
            </div>

            <button
              onClick={handleRecalibrateMemory}
              disabled={isRecalibrating}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-amber-950/40"
            >
              <Sliders className="w-4 h-4" />
              <span>Forçar Reanálise de Vieses</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningInsights.map((insight) => (
              <div key={insight.id} className="card glass p-6 rounded-3xl border border-[var(--glass-border)] shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-white font-black text-xs border border-slate-700">
                      {insight.league}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                      {insight.accuracy}% ACERTO
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white">{insight.category}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{insight.sampleSize} partidas catalogadas</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Viés Detectado:</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      "{insight.biasDetected}"
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-1.5">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Ajuste Injetado no Prompt:</span>
                    <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                      {insight.calibrationApplied}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 mt-6 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Status da Memória:</span>
                  <span className="text-emerald-400 font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Injetando no Prompt</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: CONSOLE DE FEEDBACK & LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="card glass p-6 rounded-3xl border border-[var(--glass-border)] shadow-2xl bg-slate-950">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Console de Eventos do Monitor de IA (Tempo Real)</span>
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors"
              >
                Limpar Console
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs max-h-96 overflow-y-auto pr-2">
              {logs.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Nenhum evento registrado recentemente.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{log.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          log.level === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                          log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400' :
                          log.level === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {log.level}
                        </span>
                        <span className="text-white font-bold">{log.event}</span>
                      </div>
                      {log.latency && (
                        <span className="text-slate-500">{log.latency}ms</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs pl-2 border-l-2 border-slate-700 mt-1">
                      {log.details}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORIA DE PROMPT */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <div>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                  Auditoria de Prompt & Resposta Raw LLM
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {selectedAnalysis.homeTeam} vs {selectedAnalysis.awayTeam}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAnalysis(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Metadados da Chamada */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Provedor</span>
                  <p className="text-white font-black mt-0.5">{selectedAnalysis.provider}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Modelo</span>
                  <p className="text-white font-black mt-0.5">{selectedAnalysis.model}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Tokens</span>
                  <p className="text-blue-400 font-black mt-0.5">{selectedAnalysis.promptTokens} tokens</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Latência</span>
                  <p className="text-emerald-400 font-black mt-0.5">{selectedAnalysis.latencyMs}ms</p>
                </div>
              </div>

              {/* Payload Gerado em JSON */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">
                  Resposta Estruturada da IA (JSON Parsed):
                </label>
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto">
{JSON.stringify({
  match: `${selectedAnalysis.homeTeam} vs ${selectedAnalysis.awayTeam}`,
  probabilities: {
    home: `${selectedAnalysis.probHome}%`,
    draw: `${selectedAnalysis.probDraw}%`,
    away: `${selectedAnalysis.probAway}%`
  },
  predictionSummary: selectedAnalysis.predictionSummary,
  tips: selectedAnalysis.tips,
  commentary: selectedAnalysis.commentary
}, null, 2)}
                </pre>
              </div>

              {/* Análise de Diagnóstico */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Comentário Formatado no App:
                </span>
                <p className="text-slate-200 text-xs leading-relaxed italic">
                  "{selectedAnalysis.commentary}"
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-all"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
