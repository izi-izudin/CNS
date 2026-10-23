import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Eye } from 'lucide-react';
import { PieceColor } from '../types/chess';

interface GameOverModalProps {
  isOpen: boolean;
  winner: PieceColor | 'draw' | null;
  reason: string | null;
  playerColor?: PieceColor | null;
  onRematch: () => void;
  onReviewBoard: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  reason,
  playerColor,
  onRematch,
  onReviewBoard,
  onHome,
}) => {
  useEffect(() => {
    if (isOpen && winner) {
      if (winner === 'draw') return;
      // Confetti burst if user won or in local game
      if (!playerColor || winner === playerColor) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#FFFFFF'],
        });
      }
    }
  }, [isOpen, winner, playerColor]);

  if (!isOpen) return null;

  const isDraw = winner === 'draw' || !winner;
  let winnerTitle = '';

  if (isDraw) {
    if (reason?.toLowerCase().includes('stalemate')) {
      winnerTitle = 'DRAW — STALEMATE';
    } else if (reason?.toLowerCase().includes('materi') || reason?.toLowerCase().includes('material')) {
      winnerTitle = 'DRAW — INSUFFICIENT MATERIAL';
    } else if (reason?.toLowerCase().includes('50') || reason?.toLowerCase().includes('75')) {
      winnerTitle = 'DRAW — 50-MOVE RULE';
    } else if (reason?.toLowerCase().includes('pengulangan') || reason?.toLowerCase().includes('repetition')) {
      winnerTitle = 'DRAW — THREEFOLD REPETITION';
    } else {
      winnerTitle = 'DRAW';
    }
  } else if (reason?.toLowerCase().includes('skakmat') || reason?.toLowerCase().includes('checkmate')) {
    winnerTitle = winner === 'w' ? 'CHECKMATE — WHITE WINS' : 'CHECKMATE — BLACK WINS';
  } else if (reason?.toLowerCase().includes('menyerah') || reason?.toLowerCase().includes('resign')) {
    winnerTitle = winner === 'w' ? 'RESIGNATION — WHITE WINS' : 'RESIGNATION — BLACK WINS';
  } else if (reason?.toLowerCase().includes('waktu') || reason?.toLowerCase().includes('timeout')) {
    winnerTitle = winner === 'w' ? 'TIMEOUT — WHITE WINS' : 'TIMEOUT — BLACK WINS';
  } else {
    winnerTitle = winner === 'w' ? 'WHITE WINS' : 'BLACK WINS';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
        {/* Ambient background glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isDraw ? 'bg-blue-500' : 'bg-amber-500'
          }`}
        />

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-lg">
          <Trophy className={`w-8 h-8 ${isDraw ? 'text-blue-400' : 'text-amber-400'}`} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white mb-2">
          {winnerTitle}
        </h2>

        {reason && (
          <p className="text-sm sm:text-base text-slate-300 mb-6 bg-slate-800/50 py-2 px-4 rounded-xl border border-slate-700/50 inline-block max-w-full">
            {reason}
          </p>
        )}

        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={onRematch}
            className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all duration-150 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            Main Lagi
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onReviewBoard}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Tinjau Papan
            </button>
            <button
              onClick={onHome}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Menu Utama
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
