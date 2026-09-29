'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Megaphone,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Building2,
  Link2,
  X,
  Target,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

interface PlacementOption {
  id: string;
  name: string;
  isFree: boolean;
  admobStatus: string;
  dimensions: string;
  aspectRatio: string;
  canvaWidth: number;
  canvaHeight: number;
  description: string;
}

const PLACEMENTS: PlacementOption[] = [
  {
    id: 'header_sponsor',
    name: 'Topo da Tabela / Oferecimento',
    isFree: true,
    admobStatus: '100% Livre (Exclusivo)',
    dimensions: '640 x 120 px',
    aspectRatio: '16:3 (ou 300x80)',
    canvaWidth: 640,
    canvaHeight: 120,
    description: 'Card nobre no topo da tela do app. O AdMob não opera aqui. Espaço premium exclusivo.',
  },
  {
    id: 'popup_launch',
    name: 'Pop-up de Boas-Vindas',
    isFree: true,
    admobStatus: '100% Livre (Exclusivo)',
    dimensions: '600 x 600 px',
    aspectRatio: '1:1 (Quadrado)',
    canvaWidth: 600,
    canvaHeight: 600,
    description: 'Modal exibido na abertura do app (máx. 1x ao dia por torcedor). Alta conversão.',
  },
  {
    id: 'native_match_card',
    name: 'Card entre Jogos no Feed',
    isFree: true,
    admobStatus: '100% Livre (Exclusivo)',
    dimensions: '600 x 150 px',
    aspectRatio: '4:1 (Retangular Feed)',
    canvaWidth: 600,
    canvaHeight: 150,
    description: 'Banner retangular integrado entre as partidas da rodada. Sem concorrência com o AdMob.',
  },
  {
    id: 'banner_bottom',
    name: 'Banner Fixo de Rodapé',
    isFree: false,
    admobStatus: 'Híbrido com AdMob',
    dimensions: '640 x 100 px',
    aspectRatio: '32:5 (Padrão Mobile)',
    canvaWidth: 640,
    canvaHeight: 100,
    description: 'O AdMob roda prioritariamente aqui. O House Ad entra como fallback ou como Patrocínio Master.',
  },
  {
    id: 'native_news_feed',
    name: 'Card no Feed de Notícias',
    isFree: false,
    admobStatus: 'Híbrido com AdMob',
    dimensions: '600 x 300 px',
    aspectRatio: '2:1 (Post de Notícia)',
    canvaWidth: 600,
    canvaHeight: 300,
    description: 'Aparece a cada 3 notícias. Híbrido com o AdMob nativo para campanhas de conteúdo.',
  },
];

const AVAILABLE_APPS = [
  { slug: 'campeonato_paulista', name: 'Paulistão', flag: '🏙️' },
  { slug: 'campeonato_carioca', name: 'Carioca', flag: '🌊' },
  { slug: 'campeonato_mineiro', name: 'Mineiro', flag: '🔺' },
  { slug: 'campeonato_gaucho', name: 'Gaúcho', flag: '🧉' },
  { slug: 'campeonato_baiano', name: 'Baiano', flag: '☀️' },
  { slug: 'campeonato_paranaense', name: 'Paranaense', flag: '🌲' },
  { slug: 'campeonato_cearense', name: 'Cearense', flag: '🌴' },
  { slug: 'campeonato_pernambucano', name: 'Pernambucano', flag: '🦁' },
  { slug: 'campeonato_paraibano', name: 'Paraibano', flag: '☀️' },
  { slug: 'campeonato_maranhense', name: 'Maranhense', flag: '🌴' },
  { slug: 'campeonato_alagoano', name: 'Alagoano', flag: '🌴' },
  { slug: 'brasileirao', name: 'Brasileirão', flag: '🇧🇷' },
  { slug: 'europa', name: 'Suíte Europa', flag: '🇪🇺' },
];

export default function NewAdCampaignPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [placement, setPlacement] = useState('banner_bottom');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [allApps, setAllApps] = useState(true);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [priority, setPriority] = useState(5);
  const [maxImpressions, setMaxImpressions] = useState(0);
  const [status, setStatus] = useState('active');

  // File & Preview State
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [copiedCanva, setCopiedCanva] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter State
  const [showOnlyFree, setShowOnlyFree] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentPlacement = PLACEMENTS.find((p) => p.id === placement) || PLACEMENTS[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCreativeFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Lê dimensões reais da imagem
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
  };

  const handleToggleApp = (slug: string) => {
    if (selectedApps.includes(slug)) {
      setSelectedApps(selectedApps.filter((s) => s !== slug));
    } else {
      setSelectedApps([...selectedApps, slug]);
    }
  };

  const handleCopyCanva = () => {
    const text = `${currentPlacement.canvaWidth}x${currentPlacement.canvaHeight}`;
    navigator.clipboard.writeText(text);
    setCopiedCanva(true);
    setTimeout(() => setCopiedCanva(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Informe o título da campanha.');
      return;
    }
    if (!destinationUrl.trim()) {
      setErrorMsg('Informe a URL de destino (link do patrocinador).');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('advertiser', advertiser);
      formData.append('placement', placement);
      formData.append('destination_url', destinationUrl);
      formData.append('priority', String(priority));
      formData.append('max_impressions', String(maxImpressions));
      formData.append('status', status);

      if (startAt) formData.append('start_at', new Date(startAt).toISOString());
      if (endAt) formData.append('end_at', new Date(endAt).toISOString());

      const appsList = allApps ? ['all'] : selectedApps.length > 0 ? selectedApps : ['all'];
      formData.append('target_apps', JSON.stringify(appsList));

      if (creativeFile) {
        formData.append('creative', creativeFile);
      }

      const res = await fetch(`${API_BASE}/ads/campaigns`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        router.push('/adminpanel/ads');
      } else {
        setErrorMsg(data.message || 'Erro ao criar campanha no servidor.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha de conexão com a API.');
    } finally {
      setSubmitting(false);
    }
  };

  const visiblePlacements = showOnlyFree
    ? PLACEMENTS.filter((p) => p.isFree)
    : PLACEMENTS;

  return (
    <div className="space-y-8 pb-16" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Header com Botão Voltar */}
      <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
        <div>
          <Link
            href="/adminpanel/ads"
            className="text-xs font-bold text-[var(--text-muted)] hover:text-white flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para o Dashboard de Anúncios
          </Link>
          <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-3">
            <Megaphone className="text-amber-400 shrink-0" size={28} />
            Nova Campanha de <span style={{ color: 'var(--primary)' }}>House Ads</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs md:text-sm mt-1">
            Cadastre criativos, segmente aplicativos e visualize no simulador mobile antes de publicar.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Principal: Formulário na Esquerda + Mockup na Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário (7 Colunas) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Card 1: Informações Básicas */}
          <div className="card p-6 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info size={16} className="text-amber-400" />
              1. Dados do Anunciante & Campanha
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                  Título da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SuperBet - Finais Mineiro 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: '#fff' }}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                  Nome da Empresa / Anunciante
                </label>
                <input
                  type="text"
                  placeholder="Ex: SuperBet ou Varejo Local"
                  value={advertiser}
                  onChange={(e) => setAdvertiser(e.target.value)}
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: '#fff' }}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                URL de Destino (Link do Anúncio) *
              </label>
              <div className="relative">
                <Link2 size={16} className="absolute left-3.5 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="url"
                  required
                  placeholder="https://anunciante.com.br/?utm_source=zapscore"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: '#fff' }}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Local de Exibição & Badges AdMob */}
          <div className="card p-6 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-amber-400" />
                2. Local de Exibição (Placement)
              </h2>

              {/* Filtro Rápido de Espaços Livres */}
              <button
                type="button"
                onClick={() => setShowOnlyFree(!showOnlyFree)}
                className={`px-3 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showOnlyFree
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <Sparkles size={14} className={showOnlyFree ? 'text-emerald-400' : 'text-amber-400'} />
                <span>{showOnlyFree ? '✓ Mostrando Livres (Sem AdMob)' : '🎯 Ver Apenas Espaços Livres'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {visiblePlacements.map((p) => {
                const isSelected = placement === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setPlacement(p.id)}
                    style={{
                      background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'var(--surface)',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:border-amber-400 flex items-start justify-between gap-3 ${
                      isSelected ? 'ring-1 ring-amber-400/40' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            p.isFree
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {p.admobStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        {p.dimensions}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Upload de Imagem & Guia de Tamanho Canva */}
          <div className="card p-6 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UploadCloud size={16} className="text-amber-400" />
                3. Criativo do Anúncio
              </h2>

              <button
                type="button"
                onClick={handleCopyCanva}
                className="text-xs text-amber-400 hover:text-white font-bold flex items-center gap-1.5 transition-colors"
                title="Copiar dimensões para colar no Canva"
              >
                {copiedCanva ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>
                  {copiedCanva
                    ? 'Copiado!'
                    : `Copiar para Canva (${currentPlacement.canvaWidth}x${currentPlacement.canvaHeight})`}
                </span>
              </button>
            </div>

            {/* Caixa Informativa com Tamanho Recomendado */}
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-[var(--text-muted)] space-y-1">
              <p className="text-amber-400 font-bold">
                📐 Tamanho Recomendado para este Local:
              </p>
              <div className="flex items-center gap-4 flex-wrap text-white font-mono text-[11px]">
                <span>• Resolução: <strong>{currentPlacement.dimensions}</strong></span>
                <span>• Proporção: <strong>{currentPlacement.aspectRatio}</strong></span>
                <span>• Formatos: <strong>PNG, WebP, JPG</strong></span>
                <span>• Peso Máximo: <strong>5 MB</strong></span>
              </div>
            </div>

            {/* Dropzone de Arquivo */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              <UploadCloud size={32} className="mx-auto text-amber-400 mb-2" />
              <p className="text-xs font-bold text-white">
                {creativeFile ? creativeFile.name : 'Clique para selecionar a imagem da arte'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Arraste o arquivo ou clique para escolher no computador
              </p>

              {fileDimensions && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                  <CheckCircle2 size={12} />
                  <span>
                    Arquivo carregado: {fileDimensions.width}x{fileDimensions.height} px
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Segmentação de Aplicativos */}
          <div className="card p-6 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Target size={16} className="text-amber-400" />
              4. Segmentação de Aplicativos
            </h2>

            <div className="space-y-3">
              <label
                onClick={() => setAllApps(!allApps)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  allApps
                    ? 'bg-amber-500/10 border-amber-400 text-white'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allApps}
                    onChange={() => {}}
                    className="w-4 h-4 accent-amber-400 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold">🌐 Todos os Aplicativos (Rede Global)</span>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      O anúncio será veiculado em todos os apps estaduais, Brasileirão e Europa.
                    </p>
                  </div>
                </div>
                <span className="badge badge-live text-[9px] px-2 py-0.5 font-bold shrink-0">
                  REDE COMPLETA
                </span>
              </label>

              {!allApps && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-[var(--text-muted)] mb-2.5">
                    Selecione apenas os aplicativos autorizados:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {AVAILABLE_APPS.map((app) => {
                      const isChecked = selectedApps.includes(app.slug);
                      return (
                        <div
                          key={app.slug}
                          onClick={() => handleToggleApp(app.slug)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                            isChecked
                              ? 'bg-amber-500/15 border-amber-400 text-white'
                              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 accent-amber-400 rounded"
                          />
                          <span>{app.flag}</span>
                          <span className="truncate">{app.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Agendamento & Regras de Exibição */}
          <div className="card p-6 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" />
              5. Agendamento & Limites Contratuais
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                  Data de Início (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: '#fff' }}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                  Data de Término (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: '#fff' }}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                  Limite de Impressões (Capping)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 para ilimitado"
                  value={maxImpressions || ''}
                  onChange={(e) => setMaxImpressions(parseInt(e.target.value, 10) || 0)}
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: '#fff' }}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Pausa automaticamente após entregar a cota de impressões.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
                  Prioridade de Sorteio (1 a 10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: '#fff' }}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Peso para desempate contra outras campanhas ativas.
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Submissão */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              style={{ background: 'var(--primary)' }}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white hover:brightness-110 shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Salvando Campanha no PocketBase...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Publicar Campanha de House Ad</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Simulador Mobile Mockup Interativo (5 Colunas - Sticky no Desktop) */}
        <div className="lg:col-span-5 sticky top-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Simulador Mobile em Tempo Real
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              PRÉ-VISUALIZAÇÃO
            </span>
          </div>

          {/* Moldura do Celular */}
          <div className="mx-auto w-[310px] h-[620px] bg-[#090d16] border-[6px] border-[#1e293b] rounded-[42px] shadow-2xl p-3 relative flex flex-col justify-between overflow-hidden ring-1 ring-white/10">
            {/* Notch / Speaker */}
            <div className="w-24 h-4 bg-[#1e293b] rounded-full mx-auto mb-2 shrink-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#090d16] mr-2"></div>
              <div className="w-8 h-1 rounded-full bg-[#334155]"></div>
            </div>

            {/* Tela Interna do App */}
            <div className="flex-1 bg-[#0f172a] rounded-[26px] p-3 flex flex-col justify-between overflow-hidden relative border border-white/5">
              {/* Header do App */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-white">
                    ZAP<span style={{ color: 'var(--primary)' }}>SCORE</span>
                  </span>
                </div>
                <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">
                  AO VIVO
                </span>
              </div>

              {/* Slot: header_sponsor (Topo da Tabela) */}
              {placement === 'header_sponsor' && (
                <div className="my-2 p-1.5 rounded-lg border-2 border-dashed border-amber-400/80 bg-amber-400/10 text-center animate-pulse">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Banner Preview"
                      className="w-full h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="py-2 text-[9px] font-bold text-amber-400">
                      ⭐ TOPO DA TABELA (640x120 px)
                    </div>
                  )}
                </div>
              )}

              {/* Feed de Partidas Simulado */}
              <div className="space-y-2 py-2 overflow-hidden flex-1 text-[10px]">
                {/* Card de Jogo 1 */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span>PAL</span>
                    <span className="text-amber-400">2</span>
                  </div>
                  <span className="text-[8px] font-mono text-red-400 font-bold">65' 2T</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span className="text-amber-400">1</span>
                    <span>COR</span>
                  </div>
                </div>

                {/* Slot: native_match_card (Entre Partidas) */}
                {placement === 'native_match_card' && (
                  <div className="my-1.5 p-1 rounded-xl border-2 border-dashed border-amber-400 bg-amber-400/10 text-center animate-pulse">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Card Preview"
                        className="w-full h-14 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="py-3 text-[9px] font-bold text-amber-400">
                        📢 CARD NATIVO ENTRE JOGOS (600x150 px)
                      </div>
                    )}
                  </div>
                )}

                {/* Card de Jogo 2 */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span>SAO</span>
                    <span className="text-white">0</span>
                  </div>
                  <span className="text-[8px] font-mono text-neutral-400">21:30</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span className="text-white">0</span>
                    <span>SAN</span>
                  </div>
                </div>

                {/* Slot: native_news_feed (Em Notícias) */}
                {placement === 'native_news_feed' && (
                  <div className="my-1.5 p-1 rounded-xl border-2 border-dashed border-amber-400 bg-amber-400/10 text-center animate-pulse">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="News Preview"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="py-4 text-[9px] font-bold text-amber-400">
                        📰 CARD NO FEED DE NOTÍCIAS (600x300 px)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Slot: popup_launch (Modal Boas-Vindas) */}
              {placement === 'popup_launch' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-20">
                  <div className="bg-[#1e293b] p-3 rounded-2xl border-2 border-amber-400 w-full text-center space-y-2 shadow-2xl relative">
                    <button className="absolute right-2 top-2 text-[var(--text-muted)] text-[10px]">
                      <X size={12} />
                    </button>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Popup Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="py-8 text-[9px] font-bold text-amber-400 border border-dashed border-amber-400/50 rounded-lg">
                        ✨ POP-UP BOAS-VINDAS (600x600 px)
                      </div>
                    )}
                    <button className="w-full py-1.5 bg-amber-500 text-black text-[9px] font-black rounded-lg">
                      CONFERIR OFERTA
                    </button>
                  </div>
                </div>
              )}

              {/* Slot: banner_bottom (Fixo Acima da Barra Inferior) */}
              {placement === 'banner_bottom' && (
                <div className="my-1 p-1 rounded-lg border-2 border-dashed border-amber-400 bg-amber-400/10 text-center shrink-0 animate-pulse">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Bottom Banner Preview"
                      className="w-full h-9 object-cover rounded"
                    />
                  ) : (
                    <div className="py-2 text-[9px] font-bold text-amber-400">
                      📱 BANNER FIXO DE RODAPÉ (640x100 px)
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Nav Bar do Flutter */}
              <div className="pt-2 border-t border-white/10 flex justify-around text-[8px] text-[var(--text-muted)] font-bold shrink-0">
                <span className="text-white">Jogos</span>
                <span>Tabela</span>
                <span>Notícias</span>
                <span>Vídeos</span>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="w-28 h-1 bg-[#334155] rounded-full mx-auto mt-2 shrink-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
