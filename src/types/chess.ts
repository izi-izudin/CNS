import { Move } from 'chess.js';

export type GameMode = 'TITLE' | 'PASS_AND_PLAY' | 'VS_BOT' | 'ONLINE';

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type BoardTheme = 'wood' | 'emerald' | 'midnight' | 'classic';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface TimeControl {
  minutes: number;
  increment: number;
}

export interface Player {
  id: string;
  name: string;
  color: PieceColor;
  timeLeftMs: number;
  isBot?: boolean;
}

export interface OnlineRoomState {
  id: string;
  fen: string;
  history: Move[];
  turn: PieceColor;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  status: 'waiting' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned' | 'timeout';
  winner: PieceColor | 'draw' | null;
  reason: string | null;
  timeControl: TimeControl;
  drawOfferedBy: PieceColor | null;
  rematchVotes: string[];
  white: { id: string; name: string; connected: boolean; timeLeftMs: number } | null;
  black: { id: string; name: string; connected: boolean; timeLeftMs: number } | null;
  spectatorCount: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  color: PieceColor | 'spectator';
  text: string;
  timestamp: number;
}
