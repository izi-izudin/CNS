import React, { useState } from 'react';
import { Globe, Users, Cpu, HelpCircle, Trophy, Volume2, VolumeX, Sparkles, X } from 'lucide-react';
import { BotDifficulty } from '../types/chess';
import { soundService } from '../services/sound';

interface TitleScreenProps {
  onStartOnline: () => void;
  onStartPassAndPlay: () => void;
  onStartBot: (difficulty: BotDifficulty) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartOnline,
  onStartPassAndPlay,
  onStartBot,
}) => {
  const [selectedBotDiff, setSelectedBotDiff] = useState<BotDifficulty>('medium');
  const [showBotModal, setShowBotModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getMuted());

  const toggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 bg-radial from-slate-900 via-slate-950 to-black overflow-hidden select-none">
      {/* Background ambient radial lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Row */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-medium text-slate-400 tracking-wider uppercase">
            Standar Resmi 1:1
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Panduan Catur</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Buka Suara' : 'Bisu'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Hero Centerpiece */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-2xl px-4">
        {/* User uploaded artwork cutout */}
        <div className="relative mb-4 group cursor-pointer">
          <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl transform scale-75 group-hover:scale-95 transition-transform duration-500" />
          <img
            src="/assets/aistudio/catur_icon_cutout_70d4b4f2.png"
            alt="Bidak Catur Raja dan Kuda"
            className="relative w-44 sm:w-56 h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] transform transition-transform duration-300 group-hover:-translate-y-1"
          />
        </div>

        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-2">
          <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white uppercase drop-shadow-md">
            CATUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">NUSANTARA</span>
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          Papan catur proporsional 1:1 dengan aturan kompetisi FIDE. Bertanding online bersama teman lewat kode kamar atau duel offline di satu layar.
        </p>

        {/* Main Game Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-xl">
          {/* 1. Main Daring (Online) */}
          <button
            onClick={onStartOnline}
            className="group relative flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-500/70 shadow-lg hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              Main Daring
            </span>
            <span className="text-[11px] text-slate-400 mt-1 text-center">
              Multiplayer Online via Kode Kamar
            </span>
            <div className="mt-3 px-2 py-0.5 rounded-full bg-amber-400/10 text-[10px] font-mono font-bold text-amber-300 border border-amber-400/20">
              Real-time
            </div>
          </button>

          {/* 2. Main Luring (Pass & Play) */}
          <button
            onClick={onStartPassAndPlay}
            className="group relative flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-500/70 shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              2 Pemain Lokal
            </span>
            <span className="text-[11px] text-slate-400 mt-1 text-center">
              Player 1 vs Player 2 (Pass & Play)
            </span>
            <div className="mt-3 px-2 py-0.5 rounded-full bg-emerald-400/10 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-400/20">
              Player 1 vs 2
            </div>
          </button>

          {/* 3. Latihan Lawan AI */}
          <button
            onClick={() => setShowBotModal(true)}
            className="group relative flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-blue-500/70 shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              Latihan vs Bot
            </span>
            <span className="text-[11px] text-slate-400 mt-1 text-center">
              Asah Taktik dengan 3 Level AI
            </span>
            <div className="mt-3 px-2 py-0.5 rounded-full bg-blue-400/10 text-[10px] font-mono font-bold text-blue-300 border border-blue-400/20">
              Solo Bot
            </div>
          </button>
        </div>
      </div>

      {/* Control Hint Line */}
      <footer className="w-full text-center z-10 py-3">
        <p className="text-[11px] sm:text-xs text-slate-400 font-mono tracking-wide">
          Klik / Seret Bidak · R Putar Papan · Jam Catur FIDE · Suara Prosedural
        </p>
      </footer>

      {/* Modal Bot Difficulty Selection */}
      {showBotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center relative">
            <button
              onClick={() => setShowBotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-blue-400" />
            </div>

            <h3 className="text-xl font-bold font-display text-white mb-2">
              Pilih Tingkat Kesulitan AI
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Sesuaikan kemampuan bot dengan tingkat kemahiran Anda:
            </p>

            <div className="space-y-2 mb-6">
              {[
                { id: 'easy', label: 'Pemula (Mudah)', desc: 'Cocok untuk belajar langkah dan taktik dasar' },
                { id: 'medium', label: 'Menengah (Sedang)', desc: 'Analisis 2 langkah ke depan & posisi bidak' },
                { id: 'hard', label: 'Mahir (Sulit)', desc: 'Evaluasi minimax 3 langkah dengan strategi pusat' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setSelectedBotDiff(diff.id as BotDifficulty)}
                  className={`w-full p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedBotDiff === diff.id
                      ? 'bg-blue-500/20 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold text-white">{diff.label}</div>
                  <div className="text-[11px] text-slate-400">{diff.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowBotModal(false);
                onStartBot(selectedBotDiff);
              }}
              className="w-full py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              Mulai Bertanding Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Modal Rules & Guide */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold font-display text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Aturan & Fitur Catur Nusantara
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 mb-1">1. Proporsi Papan 1:1 Presisi</h4>
                <p>Papan catur dibuat simetris 1:1 di semua resolusi, memudahkan perhitungan visual taktik catur baik di HP, tablet, maupun monitor desktop.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-emerald-400 mb-1">2. Bermain Daring (Online Room)</h4>
                <p>Buat kamar baru, atur waktu (misal Rapid 10m atau Blitz 5m), salin kode 6-huruf atau tautan URL kamar, lalu kirim ke teman Anda. Sinkronisasi langkah bidak terjadi secara seketika (sub-50ms).</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-blue-400 mb-1">3. Aturan Standar FIDE Lengkap</h4>
                <p>Mendukung Rokade (*Castling*), Makan Lewat (*En Passant*), Promosi Pion ke Menteri/Benteng/Gajah/Kuda, deteksi Skakmat, Remis 50 Langkah, dan Stalemate.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-purple-400 mb-1">4. Suara Prosedural Sintetis</h4>
                <p>Efek suara benturan kayu bidak catur dihasilkan langsung oleh Web Audio API tanpa perlu unduhan file audio besar, dengan tombol bisu/suara yang mudah diakses.</p>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-6 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
