"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Bot, 
  ShieldCheck, 
  Zap, 
  Newspaper, 
  Activity, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  Server,
  Sparkles,
  Radio,
  Cpu
} from 'lucide-react';

export default function AgentsHubPage() {
  const agents = [
    {
      id: 'sentinel',
      title: 'Sentinel Multi-Módulo',
      subtitle: 'Auditor de Minutagem, Placar & Fim de Jogo',
      description: 'Monitor central com 4 instâncias dedicadas (Brasil, Europa, Copas e Estaduais) para auditar partidas em tempo real e corrigir anomalias de encerramento.',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: 'ONLINE • 4 INSTÂNCIAS',
      badgeColor: 'badge-live',
      href: '/adminpanel/sentinel',
      stats: [
        { label: 'Instâncias', value: '4 Módulos' },
        { label: 'Intervalo', value: '30s' },
        { label: 'Status', value: '100% Ativo' },
      ],
      actionText: 'Abrir Sentinel Multi-Módulo'
    },
    {
      id: 'push-healer',
      title: 'Push Self-Healer',
      subtitle: 'Saúde e Limpeza de Notificações FCM',
      description: 'Audita entregas FCM HTTP v1, executa expurgo instantâneo de tokens 404/403 no PocketBase Europa e renova chaves JWT OAuth2 RS256.',
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      badge: 'EXPURGO ATIVO',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      href: '/adminpanel/agents/push-healer',
      stats: [
        { label: 'FCM Protocol', value: 'HTTP v1' },
        { label: 'Expurgo 404', value: 'Instantâneo' },
        { label: 'JWT RS256', value: 'Auto-Renew' },
      ],
      actionText: 'Ver Métricas de Entrega'
    },
    {
      id: 'content-scout',
      title: 'Content Scout',
      subtitle: 'Curadoria de Notícias RSS & Vídeos YouTube',
      description: 'Varre periodicamente os feeds esportivos e canais oficiais do YouTube, aplicando filtros inteligentes para alimentar as abas de Notícias e Vídeos de cada liga.',
      icon: Newspaper,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      badge: 'CRON 30M',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      href: '/adminpanel/agents/content-scout',
      stats: [
        { label: 'Feeds RSS', value: 'Monitorados' },
        { label: 'Filtro Anti-Dup', value: 'Ativo' },
        { label: 'Categorização', value: 'Multi-Liga' },
      ],
      actionText: 'Ver Pipeline de Conteúdo'
    },
    {
      id: 'quota-watchdog',
      title: 'Quota & Latency Watchdog',
      subtitle: 'Guardião de Custos & Rate Limit API-Football',
      description: 'Monitora o consumo de requisições da API-Football em tempo real e comuta automaticamente para o Modo Econômico Inteligente se a cota baixar de 20%.',
      icon: Cpu,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      badge: 'MODO NORMAL',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      href: '/adminpanel/agents/quota-watchdog',
      stats: [
        { label: 'Cota Restante', value: '> 80%' },
        { label: 'Latência Média', value: '~120ms' },
        { label: 'Proteção', value: 'Rate Limit Safe' },
      ],
      actionText: 'Ver Telemetria de Quota'
    }
  ];

  return (
    <div className="space-y-10" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="badge badge-live">
              • REDE DE AGENTES AUTÔNOMOS EM SEGUNDO PLANO
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            Central de <span style={{ color: 'var(--primary)' }}>Agentes</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
            Painel de controle e governança dos agentes inteligentes que operam continuamente para auto-correção, auditoria multi-módulo e proteção da plataforma.
          </p>
        </div>

        <div className="card glass px-5 py-3 rounded-2xl flex items-center gap-3 border border-[var(--glass-border)] shrink-0">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">4 Agentes Online</span>
        </div>
      </div>

      {/* Grid de Cards dos Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {agents.map((agent) => {
          const IconComp = agent.icon;
          return (
            <div 
              key={agent.id}
              className="card p-6 flex flex-col justify-between group hover:border-[var(--primary)] transition-all duration-300 relative overflow-hidden"
            >
              {/* Glow decorativo sutil de fundo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none group-hover:bg-[var(--primary)]/5 transition-all"></div>

              <div className="space-y-4">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${agent.iconBg} border flex items-center justify-center ${agent.iconColor} shrink-0 shadow-lg`}>
                      <IconComp size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white group-hover:text-[var(--primary)] transition-colors">
                        {agent.title}
                      </h3>
                      <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                        {agent.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${agent.badgeColor}`}>
                    {agent.badge}
                  </span>
                </div>

                {/* Descrição */}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {agent.description}
                </p>

                {/* Grid de Estatísticas / Métricas Rápidas */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {agent.stats.map((stat, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center"
                    >
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase truncate">{stat.label}</p>
                      <p className="text-xs font-black text-white font-mono mt-0.5 truncate">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Ação para a Página do Agente */}
              <div className="pt-6 mt-6 border-t border-[var(--border)] flex items-center justify-between">
                <Link
                  href={agent.href}
                  className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--primary)] hover:text-black text-white font-bold text-xs transition-all group/btn border border-[var(--border)] hover:border-transparent shadow-md"
                >
                  <span>{agent.actionText}</span>
                  <ChevronRight size={16} className="text-[var(--text-muted)] group-hover/btn:text-black group-hover/btn:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
