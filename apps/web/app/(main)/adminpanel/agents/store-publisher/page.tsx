"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Smartphone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Send,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Palette,
  FileText,
  HelpCircle,
  Eye,
  Play,
  Layers,
  Tag,
  Users,
  Target,
  FileCheck
} from 'lucide-react';
import { ECOSYSTEM_APPS, EcosystemApp } from './lib/apps-catalog';
import { ASOPayload, generateLocalASO } from './lib/aso-generator';
import { StoreDeclarationsPayload, generateStoreDeclarations, getPlayConsoleFormChecklist } from './lib/store-forms';
import { generateVisualAssetsSpecs, generateSvgMockupPreview } from './lib/canva-service';
import { generateExportPackage } from './lib/export-package';

export default function StorePublisherAgentPage() {
  // Lista de apps com suporte a Auto-Discovery de pastas clonadas
  const [allApps, setAllApps] = useState<EcosystemApp[]>(ECOSYSTEM_APPS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('Todos');
  const [selectedApp, setSelectedApp] = useState<EcosystemApp>(ECOSYSTEM_APPS[0]);
  const [activeTab, setActiveTab] = useState<'aso' | 'forms' | 'canva' | 'publish'>('aso');

  // Dados gerados para o app ativo
  const [asoData, setAsoData] = useState<ASOPayload>(generateLocalASO(ECOSYSTEM_APPS[0]));
  const [declarations, setDeclarations] = useState<StoreDeclarationsPayload>(generateStoreDeclarations(ECOSYSTEM_APPS[0]));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estados de Edição ASO
  const [editableTitle, setEditableTitle] = useState(asoData.title);
  const [editableShortDesc, setEditableShortDesc] = useState(asoData.shortDescription);
  const [editableFullDesc, setEditableFullDesc] = useState(asoData.fullDescription);
  const [editableReleaseNotes, setEditableReleaseNotes] = useState(asoData.releaseNotes);

  // Estados de IA & Publicação
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [publishLogs, setPublishLogs] = useState<any[]>([]);
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [showServiceAccountInput, setShowServiceAccountInput] = useState(false);

  // Varredura Automática de apps clonados em disco
  const fetchDynamicApps = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/adminpanel/store-publisher');
      const data = await res.json();
      if (data.fullApps && Array.isArray(data.fullApps)) {
        setAllApps(data.fullApps);
        // Se o app atualmente selecionado não existir na nova lista, seleciona o primeiro
        if (!data.fullApps.some((a: EcosystemApp) => a.id === selectedApp.id)) {
          setSelectedApp(data.fullApps[0]);
        }
      }
    } catch (err) {
      console.warn('Falha na varredura automática de apps:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Carrega apps dinâmicos no carregamento inicial
  useEffect(() => {
    fetchDynamicApps();
  }, []);

  // Atualiza dados sempre que o app selecionado muda
  useEffect(() => {
    const localAso = generateLocalASO(selectedApp);
    const localDecs = generateStoreDeclarations(selectedApp);
    setAsoData(localAso);
    setDeclarations(localDecs);
    setEditableTitle(localAso.title);
    setEditableShortDesc(localAso.shortDescription);
    setEditableFullDesc(localAso.fullDescription);
    setEditableReleaseNotes(localAso.releaseNotes);
    setPublishLogs([]);
  }, [selectedApp]);

  // Filtro de apps
  const filteredApps = selectedRegion === 'Todos'
    ? allApps
    : allApps.filter((app) => app.region === selectedRegion);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Gerar com IA
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/adminpanel/store-publisher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: selectedApp.id, useAI: true })
      });
      const data = await res.json();
      if (data.aso) {
        setAsoData(data.aso);
        setEditableTitle(data.aso.title);
        setEditableShortDesc(data.aso.shortDescription);
        setEditableFullDesc(data.aso.fullDescription);
        setEditableReleaseNotes(data.aso.releaseNotes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Executar Publicação / Dry-Run
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishLogs([]);

    let credentialsObj = undefined;
    if (serviceAccountJson.trim()) {
      try {
        credentialsObj = JSON.parse(serviceAccountJson);
      } catch (e) {
        alert('JSON da Service Account inválido!');
        setIsPublishing(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/adminpanel/store-publisher/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedApp.id,
          dryRun: isDryRun,
          credentials: credentialsObj,
          useAI: false
        })
      });

      const data = await res.json();
      if (data.publishResult?.stepsCompleted) {
        setPublishLogs(data.publishResult.stepsCompleted);
      } else if (data.error) {
        setPublishLogs([{ step: 'Erro', status: 'failed', message: data.error }]);
      }
    } catch (err: any) {
      setPublishLogs([{ step: 'Falha de Conexão', status: 'failed', message: err.message }]);
    } finally {
      setIsPublishing(false);
    }
  };

  // Download do pacote consolidado
  const handleDownloadPackage = () => {
    const currentAso: ASOPayload = {
      ...asoData,
      title: editableTitle,
      shortDescription: editableShortDesc,
      fullDescription: editableFullDesc,
      releaseNotes: editableReleaseNotes
    };
    const pkg = generateExportPackage(selectedApp, currentAso, declarations);
    const combinedContent = pkg.files.map((f) => `=== ${f.filename} ===\n\n${f.content}\n\n`).join('\n----------------------------------------\n\n');
    
    const blob = new Blob([combinedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GooglePlay_Package_${selectedApp.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visualAssets = generateVisualAssetsSpecs(selectedApp);
  const checklist = getPlayConsoleFormChecklist(selectedApp.id);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <Link
              href="/adminpanel/agents"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Central de Agentes
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  Publicador de Aplicativos
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    GOOGLE PLAY STORE
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  Automação completa de ASO, formulários obrigatórios (16+ / SPORTS), Canva Pro e submissão via Edits API.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPackage}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sm font-semibold border border-slate-700 transition-all text-slate-200"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Baixar Pacote da Loja
            </button>
            <button
              onClick={() => setActiveTab('publish')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              Publicar na Loja
            </button>
          </div>
        </div>

        {/* Barra de Seleção de Apps */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>SELECIONE O APLICATIVO DO ECOSSISTEMA:</span>
            </div>
            {/* Filtros de Região e Botão de Varredura */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchDynamicApps}
                disabled={isScanning}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all disabled:opacity-50"
                title="Varre o disco por novos apps clonados em apps/estaduais, apps/brasil e apps/europa"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Varrendo Pastas...' : 'Varredura Automática'}</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
                {['Todos', 'Nacional', 'Nordeste', 'Sudeste', 'Sul', 'Internacional'].map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setSelectedRegion(reg)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      selectedRegion === reg
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de Apps Selecionáveis */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
            {filteredApps.map((app) => {
              const isSelected = selectedApp.id === app.id;
              const isAutoDiscovered = !ECOSYSTEM_APPS.some((a) => a.id === app.id);
              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: app.primaryColor }}
                  />
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <span className="font-bold text-xs truncate text-white">{app.shortName}</span>
                    <div className="flex items-center gap-1">
                      {isAutoDiscovered && (
                        <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                          AUTO
                        </span>
                      )}
                      {app.stateCode && (
                        <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-300 font-mono">
                          {app.stateCode}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{app.packageName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card do App Ativo & Abas de Navegação */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-inner"
                style={{ backgroundColor: selectedApp.primaryColor }}
              >
                {selectedApp.shortName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {selectedApp.name}
                  <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {selectedApp.packageName}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedApp.leagueName} • Região: <strong className="text-slate-300">{selectedApp.region}</strong> • Versão: <strong className="text-slate-300">{selectedApp.bundleVersion} ({selectedApp.bundleCode})</strong>
                </p>
              </div>
            </div>

            {/* Abas */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('aso')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'aso'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Ficha ASO
              </button>
              <button
                onClick={() => setActiveTab('forms')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'forms'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Formulários (16+)
              </button>
              <button
                onClick={() => setActiveTab('canva')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'canva'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" /> Canva Pro & Mockups
              </button>
              <button
                onClick={() => setActiveTab('publish')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'publish'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" /> 1-Click Publish
              </button>
            </div>
          </div>

          {/* Conteúdo das Abas */}
          <div className="p-5 sm:p-6">
            {/* ABA 1: FICHA DA LOJA / ASO */}
            {activeTab === 'aso' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Copywriting Otimizado com Limites Rígidos</h4>
                      <p className="text-xs text-slate-400">
                        Campos formatados de acordo com a política oficial da Google Play Store.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    {isGeneratingAI ? 'Gerando com IA...' : 'Regerar com Gemini'}
                  </button>
                </div>

                {/* 1. Título do App (30 chars) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      Título do Aplicativo (Google Play Name)
                      <span className="text-[10px] text-slate-500 font-normal">Máximo 30 caracteres</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          editableTitle.length <= 30
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {editableTitle.length}/30c
                      </span>
                      <button
                        onClick={() => copyToClipboard(editableTitle, 'title')}
                        className="text-xs p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Copiar Título"
                      >
                        {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={30}
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 2. Breve Descrição (80 chars) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      Breve Descrição (Short Description)
                      <span className="text-[10px] text-slate-500 font-normal">Máximo 80 caracteres</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          editableShortDesc.length <= 80
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {editableShortDesc.length}/80c
                      </span>
                      <button
                        onClick={() => copyToClipboard(editableShortDesc, 'shortDesc')}
                        className="text-xs p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Copiar Breve Descrição"
                      >
                        {copiedKey === 'shortDesc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    value={editableShortDesc}
                    onChange={(e) => setEditableShortDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3. Descrição Completa (4000 chars) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      Descrição Completa (Full Description)
                      <span className="text-[10px] text-slate-500 font-normal">Máximo 4.000 caracteres</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          editableFullDesc.length <= 4000
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {editableFullDesc.length}/4000c
                      </span>
                      <button
                        onClick={() => copyToClipboard(editableFullDesc, 'fullDesc')}
                        className="text-xs p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Copiar Descrição Completa"
                      >
                        {copiedKey === 'fullDesc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={12}
                    maxLength={4000}
                    value={editableFullDesc}
                    onChange={(e) => setEditableFullDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                </div>

                {/* 4. Notas da Versão (500 chars) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      Notas da Versão / O Que Há de Novo (Release Notes)
                      <span className="text-[10px] text-slate-500 font-normal">Máximo 500 caracteres</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          editableReleaseNotes.length <= 500
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {editableReleaseNotes.length}/500c
                      </span>
                      <button
                        onClick={() => copyToClipboard(editableReleaseNotes, 'releaseNotes')}
                        className="text-xs p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Copiar Notas da Versão"
                      >
                        {copiedKey === 'releaseNotes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={editableReleaseNotes}
                    onChange={(e) => setEditableReleaseNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Tags sugeridas */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" /> Palavras-Chave Recomendadas (ASO):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {asoData.keywords.map((kw, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: FORMULÁRIOS DA LOJA (16+ / SPORTS / ENTERTAINMENT) */}
            {activeTab === 'forms' && (
              <div className="space-y-6">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      Declarações Obrigatórias do Google Play Console
                    </h4>
                    <p className="text-xs text-slate-400">
                      Respostas validadas para evitar reprovações e contornar a Política de Famílias/COPPA.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const text = checklist.map((c) => `* ${c.title} (${c.field}): ${c.recommendedValue}`).join('\n');
                      copyToClipboard(text, 'allForms');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'allForms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar Todos
                  </button>
                </div>

                {/* Grid de Formulários */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Público-Alvo 16+ */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Público-Alvo e Família
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        16+ ANOS
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">16 a 17 anos E 18 anos ou mais</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Atração não intencional por crianças: <strong>NÃO</strong>. Isenta o aplicativo das restrições da Política de Famílias e COPPA, liberando push e anúncios sem penalidade.
                    </p>
                  </div>

                  {/* Categoria SPORTS + ENTERTAINMENT */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-4 h-4" /> Categorização da Loja
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        SPORTS
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Primária: <strong>Esportes (SPORTS)</strong> • Secundária: <strong>Entretenimento (ENTERTAINMENT)</strong>
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tags: Futebol, Placar ao Vivo, Estatísticas esportivas, Notícias de esportes.
                    </p>
                  </div>

                  {/* Declaração de Anúncios */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Anúncios e Monetização
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        ADMOB ATIVO
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">Sim, meu app contém anúncios</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Formatos: Banners adaptativos, anúncios intersticiais e App Open Ads (Google AdMob SDK).
                    </p>
                  </div>

                  {/* Classificação IARC */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Classificação Indicativa (IARC)
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                        LIVRE / PEGI 3
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">Livre para todos os públicos (Everyone)</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sem violência, conteúdo adulto, palavrões ou jogos de azar com dinheiro real.
                    </p>
                  </div>

                  {/* Data Safety (Segurança dos Dados) */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-700 md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Segurança dos Dados (Data Safety Form)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">HTTPS / TLS 1.3 Criptografado</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <strong className="text-white block mb-1">Identificadores de Dispositivo (FCM Device Tokens)</strong>
                        <span className="text-slate-400">
                          Coletado para entrega de notificações push de gols em tempo real. Efêmero, não vinculado à identidade do usuário.
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <strong className="text-white block mb-1">Localização Aproximada (Coarse)</strong>
                        <span className="text-slate-400">
                          Opcional, utilizada pelo Google AdMob para veiculação de anúncios regionalizados. Não rastreia o usuário individual.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Política de Privacidade:</span>
                      <a
                        href={selectedApp.privacyPolicyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {selectedApp.privacyPolicyUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Checklist Completo Campo a Campo */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Checklist Campo a Campo para Preenchimento no Play Console:
                  </h4>
                  <div className="space-y-2">
                    {checklist.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs gap-2"
                      >
                        <div>
                          <strong className="text-white block">{item.title}</strong>
                          <span className="text-slate-400">{item.field}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-mono text-[11px]">
                            {item.recommendedValue}
                          </code>
                          <button
                            onClick={() => copyToClipboard(item.recommendedValue, `item-${idx}`)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedKey === `item-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: CANVA PRO & MOCKUPS VISUAIS */}
            {activeTab === 'canva' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900/40 border border-purple-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <Palette className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Integração Direta com Canva Pro</h4>
                      <p className="text-xs text-slate-300">
                        Dimensões oficiais da loja (1024x500, 1080x1920, 512x512) pré-configuradas em links de 1-clique.
                      </p>
                    </div>
                  </div>
                  <a
                    href={visualAssets.canvaProjectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition-all shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir Pasta no Canva
                  </a>
                </div>

                {/* Grade de Assets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visualAssets.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {asset.width} x {asset.height} px
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {asset.format}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-white">{asset.title}</h5>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{asset.description}</p>

                        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
                          <span className="text-slate-500 font-semibold uppercase text-[10px] block">Copy do Mockup:</span>
                          <p className="text-white font-bold">{asset.copyHeadline}</p>
                          <p className="text-slate-400 text-[11px]">{asset.copySubtitle}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => copyToClipboard(`${asset.copyHeadline} - ${asset.copySubtitle}`, asset.id)}
                          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs inline-flex items-center gap-1 transition-colors"
                          title="Copiar Copy"
                        >
                          {copiedKey === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[11px]">Copy</span>
                        </button>
                        <a
                          href={asset.canvaTemplateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-semibold border border-indigo-500/30 transition-all"
                        >
                          <Palette className="w-3.5 h-3.5" /> Criar no Canva
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABA 4: 1-CLICK PUBLISH & PAINEL DE ENVIO */}
            {activeTab === 'publish' && (
              <div className="space-y-6">
                <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Send className="w-4 h-4 text-emerald-400" />
                        Publicador via Google Play Developer Edits API
                      </h4>
                      <p className="text-xs text-slate-400">
                        Dispara a sincronização direta de fichas de loja, descrições e títulos para o console da Google Play.
                      </p>
                    </div>

                    {/* Alternador de Modo Dry-Run vs Produção */}
                    <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setIsDryRun(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isDryRun
                            ? 'bg-emerald-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Simulação Dry-Run
                      </button>
                      <button
                        onClick={() => setIsDryRun(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !isDryRun
                            ? 'bg-rose-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Produção Real
                      </button>
                    </div>
                  </div>

                  {/* Configuração de Service Account (Opcional se não estiver em ENV) */}
                  <div className="border-t border-slate-800/80 pt-4">
                    <button
                      onClick={() => setShowServiceAccountInput(!showServiceAccountInput)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      {showServiceAccountInput ? 'Ocultar Credencial Service Account' : 'Configurar Service Account JSON manual'}
                    </button>

                    {showServiceAccountInput && (
                      <div className="mt-3 space-y-2">
                        <label className="text-[11px] text-slate-400 block font-mono">
                          Cole o conteúdo do arquivo service-account.json da Google Cloud:
                        </label>
                        <textarea
                          rows={4}
                          placeholder='{ "type": "service_account", "project_id": "...", "private_key": "..." }'
                          value={serviceAccountJson}
                          onChange={(e) => setServiceAccountJson(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Botão de Disparo */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      Alvo: <strong className="text-white font-mono">{selectedApp.packageName}</strong> • Modo:{' '}
                      <strong className={isDryRun ? 'text-emerald-400' : 'text-rose-400'}>
                        {isDryRun ? 'Simulação Segura' : 'Envio Efetivo na Loja'}
                      </strong>
                    </div>
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                        isDryRun
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                      } disabled:opacity-50`}
                    >
                      <Send className={`w-4 h-4 ${isPublishing ? 'animate-spin' : ''}`} />
                      {isPublishing
                        ? 'Processando Edição...'
                        : isDryRun
                        ? 'Executar Validação Dry-Run'
                        : 'Enviar Alterações para a Google Play'}
                    </button>
                  </div>
                </div>

                {/* Console de Logs de Execução */}
                {publishLogs.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 text-emerald-400" /> Relatório de Execução da Publicação:
                    </h5>
                    <div className="space-y-2">
                      {publishLogs.map((log, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                        >
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <strong className="text-white block">{log.step}</strong>
                            <p className="text-slate-400 font-mono text-[11px]">{log.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
