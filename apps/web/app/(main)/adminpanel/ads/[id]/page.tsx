'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
  RefreshCw,
  Image as ImageIcon,
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
  { slug: 'campeonato_catarinense', name: 'Catarinense', flag: '🌲' },
  { slug: 'campeonato_capixaba', name: 'Capixaba', flag: '🏖️' },
  { slug: 'campeonato_goiano', name: 'Goiano', flag: '🌾' },
  { slug: 'campeonato_matogrossense', name: 'Matogrossense', flag: '🌿' },
  { slug: 'campeonato_sulmatogrossense', name: 'Sul-Matogrossense', flag: '🐆' },
  { slug: 'campeonato_brasiliense', name: 'Brasiliense', flag: '🏛️' },
  { slug: 'campeonato_potiguar', name: 'Potiguar', flag: '☀️' },
  { slug: 'campeonato_piauiense', name: 'Piauiense', flag: '🏜️' },
  { slug: 'campeonato_sergipano', name: 'Sergipano', flag: '🦀' },
  { slug: 'campeonato_paraense', name: 'Paraense', flag: '🦅' },
  { slug: 'campeonato_amazonense', name: 'Amazonense', flag: '🌳' },
  { slug: 'campeonato_acreano', name: 'Acreano', flag: '⭐' },
  { slug: 'campeonato_amapaense', name: 'Amapaense', flag: '🧭' },
  { slug: 'campeonato_rondoniense', name: 'Rondoniense', flag: '🚂' },
  { slug: 'campeonato_roraimense', name: 'Roraimense', flag: '⛰️' },
  { slug: 'campeonato_tocantinense', name: 'Tocantinense', flag: '🌞' },
  { slug: 'brasileirao', name: 'Brasileirão', flag: '🇧🇷' },
  { slug: 'europa', name: 'Suíte Europa', flag: '🇪🇺' },
  { slug: 'copadonordeste', name: 'Copa do Nordeste', flag: '☀️' },
  { slug: 'copadobrasil', name: 'Copa do Brasil', flag: '🇧🇷' },
  { slug: 'copalibertadores', name: 'Copa Libertadores', flag: '🏆' },
];

export default function EditAdCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  // Loading State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // File & Creative State
  const [currentCreativeUrl, setCurrentCreativeUrl] = useState<string | null>(null);
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [copiedCanva, setCopiedCanva] = useState(false);

  // Filter State
  const [showOnlyFree, setShowOnlyFree] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentPlacement = PLACEMENTS.find((p) => p.id === placement) || PLACEMENTS[0];

  // Carrega dados da campanha para edição
  useEffect(() => {
    if (!campaignId) return;

    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/ads/campaigns/${campaignId}`);
        const json = await res.json();

        if (json.success && json.data) {
          const c = json.data;
          setTitle(c.title || '');
          setAdvertiser(c.advertiser || '');
          setPlacement(c.placement || 'banner_bottom');
          setDestinationUrl(c.destination_url || '');
          setPriority(c.priority || 5);
          setMaxImpressions(c.max_impressions || 0);
          setStatus(c.status || 'active');
          setCurrentCreativeUrl(c.creative_url || null);

          // Formatação de datas para datetime-local (YYYY-MM-DDTHH:mm)
          if (c.start_at) {
            try {
              const d = new Date(c.start_at);
              setStartAt(d.toISOString().slice(0, 16));
            } catch (_) {}
          }
          if (c.end_at) {
            try {
              const d = new Date(c.end_at);
              setEndAt(d.toISOString().slice(0, 16));
            } catch (_) {}
          }

          // Apps alvos
          const apps: string[] = Array.isArray(c.target_apps) ? c.target_apps : [];
          if (apps.includes('all') || apps.length === 0) {
            setAllApps(true);
            setSelectedApps([]);
          } else {
            setAllApps(false);
            setSelectedApps(apps);
          }
        } else {
          setErrorMsg('Campanha não encontrada ou indisponível.');
        }
      } catch (err: any) {
        setErrorMsg('Erro ao carregar dados da campanha: ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

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

      const res = await fetch(`${API_BASE}/ads/campaigns/${campaignId}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        router.push('/adminpanel/ads');
      } else {
        setErrorMsg(data.message || 'Erro ao atualizar campanha no servidor.');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw size={32} className="animate-spin text-amber-400" />
        <p className="text-sm font-semibold text-[var(--text-muted)]">Carregando dados da campanha...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/adminpanel/ads"
            className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)] transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Megaphone className="text-amber-400" size={24} />
              Editar Campanha de Publicidade
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Altere os aplicativos alvos, substitua a arte ou ajuste os parâmetros de exibição.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal: Configurações Gerais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Dados do Anunciante & Campanha */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Building2 size={16} className="text-amber-400" />
              1. Identificação da Campanha
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  Título da Campanha *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Patrocínio Master Copa do Nordeste"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white text-sm focus:outline-none focus:border-amber-400 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  Nome do Anunciante / Marca
                </label>
                <input
                  type="text"
                  value={advertiser}
                  onChange={(e) => setAdvertiser(e.target.value)}
                  placeholder="Ex: BetNordeste, ZapScore Pro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white text-sm focus:outline-none focus:border-amber-400 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                <Link2 size={13} className="text-amber-400" />
                URL de Destino (Link ao Clicar) *
              </label>
              <input
                type="url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://anunciante.com.br/?utm_source=zapscore&utm_medium=app"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white text-sm focus:outline-none focus:border-amber-400 transition-all font-mono text-xs"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Ao clicar no anúncio, o torcedor será redirecionado para esta página em seu navegador.
              </p>
            </div>
          </div>

          {/* Card 2: Seleção de Espaço (Placement) */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-amber-400" />
                2. Espaço de Exibição no App (Placement)
              </h2>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <input
                  type="checkbox"
                  checked={showOnlyFree}
                  onChange={(e) => setShowOnlyFree(e.target.checked)}
                  className="rounded accent-emerald-400"
                />
                Ver apenas espaços 100% Livres de AdMob
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visiblePlacements.map((p) => {
                const isSelected = placement === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setPlacement(p.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/5'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-neutral-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-bold text-white text-xs">{p.name}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            p.isFree
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {p.admobStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] mt-3 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-neutral-300 font-bold">{p.dimensions}</span>
                      <span className="text-[var(--text-muted)] font-semibold">{p.aspectRatio}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Aplicativos Alvo (Targeting) */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Target size={16} className="text-amber-400" />
              3. Aplicativos Alvo (Distribuição)
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:border-neutral-600 transition-all">
                <input
                  type="checkbox"
                  checked={allApps}
                  onChange={(e) => {
                    setAllApps(e.target.checked);
                    if (e.target.checked) setSelectedApps([]);
                  }}
                  className="w-4 h-4 accent-amber-400 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-white">Veicular em Todos os Aplicativos (Rede Global)</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Exibição unificada em toda a rede ZapScore (Copa do Nordeste, Copas, Brasileirão e Estaduais).
                  </p>
                </div>
              </label>

              {!allApps && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-[var(--text-muted)] mb-2.5">
                    Selecione os aplicativos autorizados para esta campanha:
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
        </div>

        {/* Coluna Lateral: Upload de Criativo & Regras de Exibição */}
        <div className="space-y-6">
          {/* Card: Upload / Substituição de Arte Criativa */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <UploadCloud size={16} className="text-amber-400" />
              Arte Criativa
            </h2>

            {/* Dica do Canva */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Dimensão Canva Recomendada:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCanva}
                  className="text-[10px] font-bold text-amber-300 hover:text-white flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-md transition-all"
                >
                  {copiedCanva ? <Check size={11} /> : <Copy size={11} />}
                  {copiedCanva ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs font-mono font-bold text-white">
                {currentPlacement.canvaWidth} x {currentPlacement.canvaHeight} px ({currentPlacement.aspectRatio})
              </p>
            </div>

            {/* Exibição da Imagem Atual ou Novo Upload */}
            {(previewUrl || currentCreativeUrl) ? (
              <div className="space-y-3">
                <div className="relative rounded-xl border border-[var(--border)] overflow-hidden bg-black/40 group">
                  <img
                    src={previewUrl || currentCreativeUrl!}
                    alt="Criativo da Campanha"
                    className="w-full h-auto max-h-48 object-contain mx-auto"
                  />
                  <div className="p-2 bg-neutral-900/90 text-center text-[10px] text-[var(--text-muted)] font-semibold border-t border-neutral-800">
                    {previewUrl ? 'Nova arte selecionada' : 'Arte atualmente ativa'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-white hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center gap-2"
                >
                  <UploadCloud size={14} />
                  Substituir Imagem
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] hover:border-amber-400/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--surface)] hover:bg-neutral-800/40"
              >
                <UploadCloud size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-xs font-bold text-white mb-1">Clique para fazer upload da arte</p>
                <p className="text-[10px] text-[var(--text-muted)]">PNG, JPG ou WEBP até 5MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Card: Período, Capping e Prioridade */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Calendar size={16} className="text-amber-400" />
              Regras de Veiculação
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-muted)] mb-1">Status da Campanha</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white font-bold"
                >
                  <option value="active">🟢 Ativa (Em Veiculação)</option>
                  <option value="paused">🟡 Pausada</option>
                  <option value="scheduled">🔵 Agendada</option>
                  <option value="draft">📝 Rascunho</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] mb-1">Data/Hora Inicial (Opcional)</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] mb-1">Data/Hora Final (Opcional)</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-[var(--text-muted)] mb-1">Prioridade (1 a 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-muted)] mb-1">Limite Impressões</label>
                  <input
                    type="number"
                    min="0"
                    value={maxImpressions}
                    onChange={(e) => setMaxImpressions(parseInt(e.target.value, 10) || 0)}
                    placeholder="0 = ilimitado"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Salvando Alterações...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Salvar Alterações
                </>
              )}
            </button>

            <Link
              href="/adminpanel/ads"
              className="w-full py-3 px-4 rounded-2xl border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)] font-bold text-xs transition-all block text-center"
            >
              Cancelar e Voltar
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
