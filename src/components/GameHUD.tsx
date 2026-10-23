import React, { useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import {
  Volume2,
  VolumeX,
  RotateCw,
  Flag,
  Handshake,
  ChevronLeft,
  Palette,
  Undo2,
  RefreshCw,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { ChessPiece } from './ChessPiece';
import { BoardTheme, PieceColor, PieceType } from '../types/chess';
import { soundService } from '../services/sound';

interface GameHUDProps {
  game: Chess;
  whiteName: string;
  blackName: string;
  whiteTimeMs: number;
  blackTimeMs: number;
  hasTimer: boolean;
  orientation: 'w' | 'b';
  theme: BoardTheme;
  onChangeTheme: (theme: BoardTheme) => void;
  onFlipBoard: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onBackToMenu: () => void;
  isOnline: boolean;
  onlineRoomId?: string;
  drawOfferedBy?: PieceColor | null;
  playerColor?: PieceColor | null;
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
  // Controls requested
  onUndo?: () => void;
  canUndo?: boolean;
  onRestart?: () => void;
  onClaimDraw?: () => void;
  canClaimDraw?: boolean;
  claimDrawReason?: string | null;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  game,
  whiteName,
  blackName,
  whiteTimeMs,
  blackTimeMs,
  hasTimer,
  orientation,
  theme,
  onChangeTheme,
  onFlipBoard,
  onResign,
  onOfferDraw,
  onBackToMenu,
  isOnline,
  onlineRoomId,
  drawOfferedBy,
  playerColor,
  onAcceptDraw,
  onDeclineDraw,
  onUndo,
  canUndo = false,
  onRestart,
  onClaimDraw,
  canClaimDraw = false,
  claimDrawReason = null,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundService.getMuted());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
  const historyEndRef = useRef<HTMLDivElement>(null);

  const toggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const isCheck = game.inCheck() && !game.isGameOver();
  const currentTurn = game.turn(); // 'w' | 'b'

  // Calculate captured pieces & material differences
  const history = game.history({ verbose: true });

  const capturedPieces = React.useMemo(() => {
    const whiteCaptured: PieceType[] = [];
    const blackCaptured: PieceType[] = [];

    history.forEach((m) => {
      if (m.captured) {
        if (m.color === 'w') {
          blackCaptured.push(m.captured as PieceType);
        } else {
          whiteCaptured.push(m.captured as PieceType);
        }
      }
    });

    const pieceOrder: Record<string, number> = { q: 5, r: 4, b: 3, n: 2, p: 1 };
    whiteCaptured.sort((a, b) => pieceOrder[b] - pieceOrder[a]);
    blackCaptured.sort((a, b) => pieceOrder[b] - pieceOrder[a]);

    const whiteScore = blackCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    const blackScore = whiteCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);

    return {
      whiteCaptured: blackCaptured,
      blackCaptured: whiteCaptured,
      whiteDiff: whiteScore - blackScore,
      blackDiff: blackScore - whiteScore,
    };
  }, [history]);

  // Group history into pairs: 1. e4 e5
  const movePairs = React.useMemo(() => {
    const pairs: { moveNum: number; white: string; black?: string }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        moveNum: Math.floor(i / 2) + 1,
        white: history[i].san,
        black: history[i + 1]?.san,
      });
    }
    return pairs;
  }, [history]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length]);

  const topColor: PieceColor = orientation === 'w' ? 'b' : 'w';
  const bottomColor: PieceColor = orientation === 'w' ? 'w' : 'b';

  const topName = topColor === 'w' ? whiteName : blackName;
  const bottomName = bottomColor === 'w' ? whiteName : blackName;

  const topTime = topColor === 'w' ? whiteTimeMs : blackTimeMs;
  const bottomTime = bottomColor === 'w' ? whiteTimeMs : blackTimeMs;

  const topCaptured = topColor === 'w' ? capturedPieces.whiteCaptured : capturedPieces.blackCaptured;
  const bottomCaptured = bottomColor === 'w' ? capturedPieces.whiteCaptured : capturedPieces.blackCaptured;

  const topDiff = topColor === 'w' ? capturedPieces.whiteDiff : capturedPieces.blackDiff;
  const bottomDiff = bottomColor === 'w' ? capturedPieces.whiteDiff : capturedPieces.blackDiff;

  const isTopTurn = currentTurn === topColor && !game.isGameOver();
  const isBottomTurn = currentTurn === bottomColor && !game.isGameOver();

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Top Bar Navigation & Settings */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/80 rounded-xl border border-slate-800 shadow-sm">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Menu
        </button>

        {/* Status / Check Pill */}
        <div className="flex items-center gap-2">
          {isCheck && (
            <div className="flex items-center gap-1.5 bg-red-600/90 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase shadow-lg shadow-red-600/30 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>CHECK</span>
            </div>
          )}

          {isOnline && onlineRoomId && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Kamar:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {onlineRoomId}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Theme selector */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Ganti Tema Papan"
            >
              <Palette className="w-4 h-4" />
            </button>
            {isThemeMenuOpen && (
              <div className="absolute right-0 top-8 z-30 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-36">
                {(['wood', 'emerald', 'midnight', 'classic'] as BoardTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      onChangeTheme(t);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`px-2 py-1 text-xs text-left rounded capitalize transition-colors ${
                      theme === t ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t === 'wood' ? 'Kayu Walnut' : t === 'emerald' ? 'Turnamen Hijau' : t === 'midnight' ? 'Slate Gelap' : 'Klasik'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onFlipBoard}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Putar Papan"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMuted ? 'Buka Suara' : 'Bisu'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Opponent (Top) Player Card */}
      <div
        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 border ${
          isTopTurn
            ? isCheck
              ? 'bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500/30'
              : 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
            : 'bg-slate-900/50 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center p-0.5 border ${
              topColor === 'w' ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          >
            <ChessPiece type="k" color={topColor} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                {topName}
              </span>
              {isTopTurn && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                  Giliran Melangkah
                </span>
              )}
              {topDiff > 0 && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-1 rounded">
                  +{topDiff}
                </span>
              )}
            </div>
            {/* Captured piece icons */}
            <div className="flex items-center gap-0.5 min-h-[16px] mt-0.5">
              {topCaptured.map((pt, idx) => (
                <div key={idx} className="w-3.5 h-3.5 -ml-1 first:ml-0">
                  <ChessPiece type={pt} color={topColor === 'w' ? 'b' : 'w'} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {hasTimer && (
          <div
            className={`font-mono tabular-nums text-sm sm:text-base font-bold px-2.5 py-1 rounded-lg border ${
              isTopTurn
                ? topTime < 30000
                  ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {formatTime(topTime)}
          </div>
        )}
      </div>

      {/* Claim Draw Alert Banner */}
      {canClaimDraw && onClaimDraw && !game.isGameOver() && (
        <div className="p-2.5 bg-amber-950/80 border border-amber-500/80 rounded-xl flex items-center justify-between text-xs animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 text-amber-200">
            <Scale className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Kondisi remis terpenuhi: <strong>{claimDrawReason || 'Klaim Remis'}</strong></span>
          </div>
          <button
            onClick={onClaimDraw}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition-all cursor-pointer whitespace-nowrap ml-2"
          >
            Claim Draw
          </button>
        </div>
      )}

      {/* Draw offer banner if received */}
      {drawOfferedBy && playerColor && drawOfferedBy !== playerColor && onAcceptDraw && onDeclineDraw && (
        <div className="p-2.5 bg-blue-950/80 border border-blue-700/80 rounded-xl flex items-center justify-between text-xs animate-fade-in">
          <span className="text-blue-200">Lawan menawarkan remis (draw).</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onAcceptDraw}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
            >
              Terima
            </button>
            <button
              onClick={onDeclineDraw}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              Tolak
            </button>
          </div>
        </div>
      )}

      {/* Main Move History strip with SAN notation */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
          <span className="font-semibold text-slate-300">Riwayat Notasi SAN</span>
          <span className="font-mono text-slate-400">Total: {history.length} langkah</span>
        </div>
        <div className="max-h-20 overflow-y-auto pr-1 text-xs font-mono space-y-0.5">
          {movePairs.length === 0 ? (
            <div className="text-slate-600 italic text-[11px] py-1 text-center">
              Permainan dimulai. Putih melangkah pertama.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
              {movePairs.map((p) => (
                <div key={p.moveNum} className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 w-5">{p.moveNum}.</span>
                  <span className="font-semibold text-slate-200">{p.white}</span>
                  {p.black && <span className="font-semibold text-slate-400">{p.black}</span>}
                </div>
              ))}
              <div ref={historyEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Current (Bottom) Player Card */}
      <div
        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 border ${
          isBottomTurn
            ? isCheck
              ? 'bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500/30'
              : 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
            : 'bg-slate-900/50 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center p-0.5 border ${
              bottomColor === 'w' ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          >
            <ChessPiece type="k" color={bottomColor} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                {bottomName}
              </span>
              {isBottomTurn && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                  Giliran Melangkah
                </span>
              )}
              {bottomDiff > 0 && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-1 rounded">
                  +{bottomDiff}
                </span>
              )}
            </div>
            {/* Captured piece icons */}
            <div className="flex items-center gap-0.5 min-h-[16px] mt-0.5">
              {bottomCaptured.map((pt, idx) => (
                <div key={idx} className="w-3.5 h-3.5 -ml-1 first:ml-0">
                  <ChessPiece type={pt} color={bottomColor === 'w' ? 'b' : 'w'} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {hasTimer && (
          <div
            className={`font-mono tabular-nums text-sm sm:text-base font-bold px-2.5 py-1 rounded-lg border ${
              isBottomTurn
                ? bottomTime < 30000
                  ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {formatTime(bottomTime)}
          </div>
        )}
      </div>

      {/* Match Control Buttons: Undo, Restart, Offer Draw, Resign */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo || game.isGameOver()}
            className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Batalkan Langkah Terakhir (Undo)"
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">Undo</span>
          </button>
        )}

        {onRestart && (
          <button
            onClick={onRestart}
            className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Mulai Ulang Permainan (Restart)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate">Restart</span>
          </button>
        )}

        <button
          onClick={onOfferDraw}
          disabled={game.isGameOver()}
          className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Handshake className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate">Remis</span>
        </button>

        <button
          onClick={onResign}
          disabled={game.isGameOver()}
          className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-red-950/50 hover:border-red-800 disabled:opacity-40 text-slate-300 hover:text-red-200 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5 text-red-400" />
          <span className="truncate">Menyerah</span>
        </button>
      </div>
    </div>
  );
};
