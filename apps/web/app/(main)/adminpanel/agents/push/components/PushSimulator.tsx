"use client";

import React from 'react';
import { Bell, Smartphone, Image as ImageIcon, Sparkles } from 'lucide-react';

interface PushSimulatorProps {
  title: string;
  body: string;
  imageUrl?: string;
  appName?: string;
  timeAgo?: string;
}

export const PushSimulator: React.FC<PushSimulatorProps> = ({
  title,
  body,
  imageUrl,
  appName = "Brasileirão",
  timeAgo = "Agora"
}) => {
  return (
    <div className="relative mx-auto w-full max-w-sm rounded-[40px] border-4 border-slate-700 bg-slate-950 p-4 shadow-2xl shadow-emerald-950/40">
      {/* Dynamic Island / Notch */}
      <div className="mx-auto mb-6 h-5 w-28 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-slate-800" />
      </div>

      {/* Relógio do Mockup */}
      <div className="mb-8 text-center">
        <span className="text-4xl font-light text-white tracking-tight">16:00</span>
        <p className="text-xs text-slate-400 font-medium mt-1">Domingo, 30 de Agosto</p>
      </div>

      {/* Card da Notificação no Lock Screen */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800/80 p-3.5 backdrop-blur-xl shadow-lg transition-all duration-300">
        {/* Cabeçalho da Notificação */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-[10px] font-bold text-slate-950 shadow-sm shadow-emerald-500/50">
              ⚽
            </div>
            <span className="text-xs font-semibold text-slate-200 tracking-wide">{appName}</span>
          </div>
          <span className="text-[10px] text-slate-400">{timeAgo}</span>
        </div>

        {/* Conteúdo Textual */}
        <h4 className="text-sm font-bold text-white leading-tight">
          {title || "Título da Notificação"}
        </h4>
        <p className="mt-1 text-xs text-slate-300 leading-snug line-clamp-3">
          {body || "Digite a mensagem para visualizar a pré-visualização em tempo real..."}
        </p>

        {/* Rich Push Thumbnail (BigPicture) */}
        {imageUrl && imageUrl.trim() !== "" && (
          <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageUrl} 
              alt="Rich Push Preview" 
              className="h-32 w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Barra de navegação inferior simulada */}
      <div className="mt-12 flex justify-center pb-2">
        <div className="h-1 w-24 rounded-full bg-slate-600" />
      </div>
    </div>
  );
};
