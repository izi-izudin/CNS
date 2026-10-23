import React, { useState } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import { BoardTheme, PieceColor } from '../types/chess';

interface ChessBoardProps {
  game: Chess;
  orientation: 'w' | 'b';
  theme: BoardTheme;
  selectedSquare: Square | null;
  onSquareClick: (square: Square) => void;
  onPieceDrop?: (from: Square, to: Square) => void;
  lastMove: { from: Square; to: Square } | null;
  isInteractive: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  orientation,
  theme,
  selectedSquare,
  onSquareClick,
  onPieceDrop,
  lastMove,
  isInteractive,
}) => {
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  // Theme palettes: Light square & Dark square classes
  const themeColors: Record<BoardTheme, { light: string; dark: string; border: string }> = {
    emerald: {
      light: 'bg-[#EEEED2]',
      dark: 'bg-[#769656]',
      border: 'border-[#4b6136]',
    },
    wood: {
      light: 'bg-[#EADECA]',
      dark: 'bg-[#8F5E3C]',
      border: 'border-[#5C3A21]',
    },
    midnight: {
      light: 'bg-[#CBD5E1]',
      dark: 'bg-[#475569]',
      border: 'border-[#1E293B]',
    },
    classic: {
      light: 'bg-[#F1F5F9]',
      dark: 'bg-[#334155]',
      border: 'border-[#0F172A]',
    },
  };

  const currentTheme = themeColors[theme] || themeColors.wood;

  // Calculate legal moves for selected square
  const legalMoves = React.useMemo(() => {
    if (!selectedSquare) return new Set<Square>();
    const moves = game.moves({ square: selectedSquare, verbose: true });
    return new Set<Square>(moves.map(m => m.to as Square));
  }, [game, selectedSquare]);

  // King square in check
  const kingInCheckSquare = React.useMemo(() => {
    if (!game.inCheck()) return null;
    const currentTurn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === currentTurn) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          return `${file}${rank}` as Square;
        }
      }
    }
    return null;
  }, [game]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'w' ? files : [...files].reverse();
  const displayRanks = orientation === 'w' ? ranks : [...ranks].reverse();

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!isInteractive) {
      e.preventDefault();
      return;
    }
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const fromSquare = draggedSquare || (e.dataTransfer.getData('text/plain') as Square);
    setDraggedSquare(null);

    if (fromSquare && fromSquare !== targetSquare && onPieceDrop) {
      onPieceDrop(fromSquare, targetSquare);
    }
  };

  return (
    <div className="relative w-full max-w-[min(100vw-32px,min(85vh-160px,620px))] mx-auto select-none">
      {/* Outer border & subtle wooden frame / luxury bezel */}
      <div
        className={`relative aspect-square w-full rounded-2xl p-2 sm:p-3 shadow-2xl transition-colors duration-300 border-4 ${currentTheme.border} bg-slate-900/90 shadow-black/80`}
      >
        {/* The 8x8 Board Grid */}
        <div className="relative w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-inner">
          {displayRanks.map((rank, rIdx) =>
            displayFiles.map((file, cIdx) => {
              const square = `${file}${rank}` as Square;
              const fileIdx = file.charCodeAt(0) - 97;
              const rankIdx = parseInt(rank, 10) - 1;
              const isDark = (fileIdx + rankIdx) % 2 === 0;

              const piece = game.get(square);
              const isSelected = selectedSquare === square;
              const isLegal = legalMoves.has(square);
              const isLastMoveFrom = lastMove?.from === square;
              const isLastMoveTo = lastMove?.to === square;
              const isKingChecked = kingInCheckSquare === square;

              // Corner rank/file labels
              const showRankLabel = orientation === 'w' ? cIdx === 0 : cIdx === 7;
              const showFileLabel = orientation === 'w' ? rIdx === 7 : rIdx === 0;

              return (
                <div
                  key={square}
                  onClick={() => isInteractive && onSquareClick(square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  className={`relative flex items-center justify-center chess-square transition-colors duration-100 ${
                    isDark ? currentTheme.dark : currentTheme.light
                  } ${isKingChecked ? 'king-in-check z-20' : ''}`}
                >
                  {/* Last Move Overlay */}
                  {(isLastMoveFrom || isLastMoveTo) && (
                    <div className="absolute inset-0 bg-amber-400/35 pointer-events-none z-0" />
                  )}

                  {/* Selection Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-500/50 shadow-inner ring-2 ring-amber-300 pointer-events-none z-10" />
                  )}

                  {/* Legal Destination Highlight */}
                  {isLegal && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      {piece ? (
                        // Capture indicator: outer ring
                        <div className="w-full h-full rounded-full ring-4 ring-red-500/70 border-4 border-transparent scale-90" />
                      ) : (
                        // Move indicator: centered solid circle
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/30 ring-2 ring-white/60 shadow-sm" />
                      )}
                    </div>
                  )}

                  {/* Chess Piece Graphic */}
                  {piece && (
                    <div
                      draggable={isInteractive && piece.color === game.turn()}
                      onDragStart={(e) => handleDragStart(e, square)}
                      className={`relative z-10 w-full h-full p-1 sm:p-1.5 flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:scale-105 ${
                        draggedSquare === square ? 'opacity-40 scale-95' : ''
                      }`}
                    >
                      <ChessPiece
                        type={piece.type as PieceSymbol}
                        color={piece.color as Color}
                      />
                    </div>
                  )}

                  {/* File & Rank Coordinates for tournament accuracy */}
                  {showRankLabel && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold font-mono pointer-events-none z-20 ${
                        isDark ? 'text-white/60' : 'text-slate-800/60'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {showFileLabel && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-bold font-mono pointer-events-none z-20 ${
                        isDark ? 'text-white/60' : 'text-slate-800/60'
                      }`}
                    >
                      {file}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
