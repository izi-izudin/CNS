import { Chess, Move, Square } from 'chess.js';
import { BotDifficulty } from '../types/chess';

// Standard piece evaluation values
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional bonuses (Piece-Square Tables from White's perspective)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const KING_TABLE_MID = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

function getSquareIndex(square: Square, color: 'w' | 'b'): number {
  const file = square.charCodeAt(0) - 97; // 0 to 7 (a-h)
  const rank = parseInt(square.charAt(1), 10) - 1; // 0 to 7 (1-8)
  // For white: row 0 is rank 8, row 7 is rank 1
  const row = 7 - rank;
  const col = file;
  if (color === 'w') {
    return row * 8 + col;
  } else {
    // Invert for black
    return (7 - row) * 8 + col;
  }
}

function evaluateBoard(game: Chess): number {
  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const square = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
      const baseValue = PIECE_VALUES[piece.type] || 0;
      let positionalBonus = 0;

      if (piece.type === 'p') {
        positionalBonus = PAWN_TABLE[getSquareIndex(square, piece.color)];
      } else if (piece.type === 'n') {
        positionalBonus = KNIGHT_TABLE[getSquareIndex(square, piece.color)];
      } else if (piece.type === 'b') {
        positionalBonus = BISHOP_TABLE[getSquareIndex(square, piece.color)];
      } else if (piece.type === 'r') {
        positionalBonus = ROOK_TABLE[getSquareIndex(square, piece.color)];
      } else if (piece.type === 'k') {
        positionalBonus = KING_TABLE_MID[getSquareIndex(square, piece.color)];
      }

      const totalPieceScore = baseValue + positionalBonus;

      if (piece.color === 'w') {
        score += totalPieceScore;
      } else {
        score -= totalPieceScore;
      }
    }
  }

  return score;
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) {
      return isMaximizing ? -50000 + (3 - depth) : 50000 - (3 - depth);
    }
    if (game.isDraw()) return 0;
    return evaluateBoard(game);
  }

  const moves = game.moves({ verbose: true });
  // Prioritize captures for faster pruning
  moves.sort((a, b) => (b.captured ? 10 : 0) - (a.captured ? 10 : 0));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBotMove(
  game: Chess,
  difficulty: BotDifficulty
): Move | null {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  if (difficulty === 'easy') {
    // 70% random, 30% heuristic capture
    if (Math.random() < 0.7) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    const captureMoves = legalMoves.filter(m => m.captured);
    if (captureMoves.length > 0) {
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  const depth = difficulty === 'hard' ? 3 : 2;
  const isWhite = game.turn() === 'w';

  let bestMove: Move = legalMoves[0];
  let bestScore = isWhite ? -Infinity : Infinity;

  // Shuffle moves slightly so bot doesn't play identical lines
  const shuffledMoves = [...legalMoves].sort(() => Math.random() - 0.5);

  for (const move of shuffledMoves) {
    game.move(move);
    const score = minimax(
      game,
      depth - 1,
      -Infinity,
      Infinity,
      !isWhite
    );
    game.undo();

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove;
}
