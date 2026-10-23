import React from 'react';
import { ChessPiece } from './ChessPiece';
import { PieceColor, PieceType } from '../types/chess';

interface PromotionModalProps {
  color: PieceColor;
  isOpen: boolean;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel?: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  color,
  isOpen,
  onSelect,
}) => {
  if (!isOpen) return null;

  const pieces: { type: 'q' | 'r' | 'b' | 'n'; label: string }[] = [
    { type: 'q', label: 'Menteri (Queen)' },
    { type: 'r', label: 'Benteng (Rook)' },
    { type: 'b', label: 'Gajah (Bishop)' },
    { type: 'n', label: 'Kuda (Knight)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <h3 className="text-xl font-bold font-display text-white mb-2">
          Promosi Pion
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Pilih bidak promosi untuk meneruskan pertempuran:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {pieces.map((item) => (
            <button
              key={item.type}
              onClick={() => onSelect(item.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500/50 transition-all duration-150 group cursor-pointer active:scale-95"
            >
              <div className="w-16 h-16 transition-transform group-hover:scale-110 mb-1">
                <ChessPiece type={item.type as PieceType} color={color} />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
