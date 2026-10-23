import React, { useState } from 'react';
import { Copy, Check, Users, Play, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import { TimeControl } from '../types/chess';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (timeControl: TimeControl, preferredColor: 'w' | 'b' | 'random', playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  createdRoomId: string | null;
  isConnecting: boolean;
  errorMessage: string | null;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  createdRoomId,
  isConnecting,
  errorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('catur_player_name') || 'Pemain 1';
  });
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Time control options
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>({
    minutes: 10,
    increment: 0,
  });
  const [selectedColor, setSelectedColor] = useState<'w' | 'b' | 'random'>('random');

  if (!isOpen) return null;

  const timeOptions: { label: string; sub: string; tc: TimeControl }[] = [
    { label: 'Rapid 10m', sub: 'Standar Catur', tc: { minutes: 10, increment: 0 } },
    { label: 'Blitz 5m', sub: 'Cepat & Intens', tc: { minutes: 5, increment: 0 } },
    { label: 'Bullet 3m', sub: 'Kilat Refleks', tc: { minutes: 3, increment: 0 } },
    { label: 'Santai', sub: 'Tanpa Batas Waktu', tc: { minutes: 0, increment: 0 } },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartCreate = () => {
    localStorage.setItem('catur_player_name', playerName.trim() || 'Pemain 1');
    onCreateRoom(selectedTimeControl, selectedColor, playerName.trim() || 'Pemain 1');
  };

  const handleStartJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    localStorage.setItem('catur_player_name', playerName.trim() || 'Pemain 2');
    onJoinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim() || 'Pemain 2');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-display text-white">
              Main Catur Daring (Online)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time WebSocket</span>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs sm:text-sm">
            {errorMessage}
          </div>
        )}

        {/* If room was already created, show waiting room view */}
        {createdRoomId ? (
          <div className="text-center py-4 space-y-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Users className="w-9 h-9 text-amber-400" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Kamar Siap! Menunggu Lawan...
              </h3>
              <p className="text-xs text-slate-400">
                Bagikan kode kamar atau tautan di bawah ini kepada teman Anda.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between max-w-xs mx-auto">
              <span className="text-2xl font-black font-mono tracking-widest text-amber-400">
                {createdRoomId}
              </span>
              <button
                onClick={() => handleCopyCode(createdRoomId)}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>

            <button
              onClick={() => handleCopyLink(createdRoomId)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Tautan Undangan Tersalin!' : 'Salin Tautan Undangan Langsung'}
            </button>
          </div>
        ) : (
          <div>
            {/* Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'create'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Buat Kamar Baru
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'join'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gabung dengan Kode
              </button>
            </div>

            {/* Player Name Input */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Nama Anda:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Masukkan nama Anda"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {activeTab === 'create' ? (
              <div className="space-y-5">
                {/* Time Control Options */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Pilih Kontrol Waktu:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {timeOptions.map((opt) => {
                      const isSelected = selectedTimeControl.minutes === opt.tc.minutes;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setSelectedTimeControl(opt.tc)}
                          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-sm font-bold">{opt.label}</div>
                          <div className="text-[11px] text-slate-400">{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Pilihan Bidak:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'w', label: 'Putih (Main Dulu)' },
                      { id: 'random', label: 'Acak' },
                      { id: 'b', label: 'Hitam' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id as 'w' | 'b' | 'random')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                          selectedColor === c.id
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={handleStartCreate}
                  className="w-full mt-4 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  {isConnecting ? 'Membuat Kamar...' : 'Buat Kamar & Dapatkan Kode'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleStartJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Masukkan Kode Kamar (6 Karakter):
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="Contoh: A8K2F9"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono text-center text-xl font-bold tracking-widest placeholder-slate-700 focus:outline-none focus:border-amber-500 uppercase transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConnecting || !roomCodeInput.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  {isConnecting ? 'Menghubungkan...' : 'Gabung Pertandingan Sekarang'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
