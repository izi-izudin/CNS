import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { Chess } from 'chess.js';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

interface PlayerInfo {
  id: string;
  name: string;
  ws?: WebSocket;
  timeLeftMs: number;
}

interface ChessRoom {
  id: string;
  chess: Chess;
  white: PlayerInfo | null;
  black: PlayerInfo | null;
  spectators: { id: string; name: string; ws: WebSocket }[];
  timeControl: { minutes: number; increment: number }; // 0 = untimed
  turn: 'w' | 'b';
  status: 'waiting' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned' | 'timeout';
  winner: 'w' | 'b' | 'draw' | null;
  reason: string | null;
  lastMoveTime: number;
  drawOfferedBy: 'w' | 'b' | null;
  rematchVotes: Set<string>;
  createdAt: number;
}

const rooms = new Map<string, ChessRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function cleanRoomData(room: ChessRoom) {
  return {
    id: room.id,
    fen: room.chess.fen(),
    history: room.chess.history({ verbose: true }),
    turn: room.chess.turn(),
    isCheck: room.chess.inCheck(),
    isCheckmate: room.chess.isCheckmate(),
    isDraw: room.chess.isDraw(),
    status: room.status,
    winner: room.winner,
    reason: room.reason,
    timeControl: room.timeControl,
    drawOfferedBy: room.drawOfferedBy,
    rematchVotes: Array.from(room.rematchVotes),
    white: room.white ? { id: room.white.id, name: room.white.name, connected: !!room.white.ws, timeLeftMs: room.white.timeLeftMs } : null,
    black: room.black ? { id: room.black.id, name: room.black.name, connected: !!room.black.ws, timeLeftMs: room.black.timeLeftMs } : null,
    spectatorCount: room.spectators.length,
  };
}

function broadcastToRoom(room: ChessRoom, message: object) {
  const json = JSON.stringify(message);
  if (room.white?.ws && room.white.ws.readyState === WebSocket.OPEN) {
    room.white.ws.send(json);
  }
  if (room.black?.ws && room.black.ws.readyState === WebSocket.OPEN) {
    room.black.ws.send(json);
  }
  for (const spec of room.spectators) {
    if (spec.ws.readyState === WebSocket.OPEN) {
      spec.ws.send(json);
    }
  }
}

// Periodically check for timeouts in active timed games
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.status === 'active' && room.timeControl.minutes > 0) {
      const activeColor = room.chess.turn();
      const activePlayer = activeColor === 'w' ? room.white : room.black;
      if (activePlayer && room.lastMoveTime > 0) {
        const elapsed = now - room.lastMoveTime;
        const remaining = activePlayer.timeLeftMs - elapsed;
        if (remaining <= 0) {
          activePlayer.timeLeftMs = 0;
          room.status = 'timeout';
          room.winner = activeColor === 'w' ? 'b' : 'w';
          room.reason = `Waktu ${activeColor === 'w' ? 'Putih' : 'Hitam'} habis`;
          broadcastToRoom(room, {
            type: 'GAME_OVER',
            roomState: cleanRoomData(room),
            winner: room.winner,
            reason: room.reason,
          });
        }
      }
    }
  }
}, 1000);

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const roomId = req.params.roomId.toUpperCase();
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Kamar tidak ditemukan' });
  }
  res.json({
    id: room.id,
    hasWhite: !!room.white,
    hasBlack: !!room.black,
    status: room.status,
    timeControl: room.timeControl,
  });
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        const { type } = data;

        if (type === 'CREATE_ROOM') {
          const roomId = generateRoomCode();
          const chess = new Chess();
          const timeControl = data.timeControl || { minutes: 10, increment: 0 };
          const initialMs = timeControl.minutes * 60 * 1000;
          const preferredColor = data.preferredColor || 'w';

          let whitePlayer: PlayerInfo | null = null;
          let blackPlayer: PlayerInfo | null = null;

          const playerInfo: PlayerInfo = {
            id: data.playerId,
            name: data.playerName || 'Pemain 1',
            ws,
            timeLeftMs: initialMs,
          };

          let assignedColor: 'w' | 'b' = 'w';
          if (preferredColor === 'b') {
            blackPlayer = playerInfo;
            assignedColor = 'b';
          } else if (preferredColor === 'random') {
            assignedColor = Math.random() < 0.5 ? 'w' : 'b';
            if (assignedColor === 'w') whitePlayer = playerInfo;
            else blackPlayer = playerInfo;
          } else {
            whitePlayer = playerInfo;
            assignedColor = 'w';
          }

          const room: ChessRoom = {
            id: roomId,
            chess,
            white: whitePlayer,
            black: blackPlayer,
            spectators: [],
            timeControl,
            turn: 'w',
            status: 'waiting',
            winner: null,
            reason: null,
            lastMoveTime: 0,
            drawOfferedBy: null,
            rematchVotes: new Set(),
            createdAt: Date.now(),
          };

          rooms.set(roomId, room);
          currentRoomId = roomId;
          currentPlayerId = data.playerId;

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomId,
            yourColor: assignedColor,
            roomState: cleanRoomData(room),
          }));
        } else if (type === 'JOIN_ROOM') {
          const roomId = (data.roomId || '').toUpperCase();
          const room = rooms.get(roomId);
          if (!room) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'Kamar tidak ditemukan' }));
          }

          currentRoomId = roomId;
          currentPlayerId = data.playerId;

          let yourColor: 'w' | 'b' | 'spectator' = 'spectator';
          const initialMs = room.timeControl.minutes * 60 * 1000;

          // Check if reconnecting
          if (room.white && room.white.id === data.playerId) {
            room.white.ws = ws;
            yourColor = 'w';
          } else if (room.black && room.black.id === data.playerId) {
            room.black.ws = ws;
            yourColor = 'b';
          } else if (!room.white) {
            room.white = { id: data.playerId, name: data.playerName || 'Pemain Putih', ws, timeLeftMs: initialMs };
            yourColor = 'w';
          } else if (!room.black) {
            room.black = { id: data.playerId, name: data.playerName || 'Pemain Hitam', ws, timeLeftMs: initialMs };
            yourColor = 'b';
          } else {
            room.spectators.push({ id: data.playerId, name: data.playerName || 'Penonton', ws });
            yourColor = 'spectator';
          }

          if (room.white && room.black && room.status === 'waiting') {
            room.status = 'active';
            room.lastMoveTime = Date.now();
          }

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomId,
            yourColor,
            roomState: cleanRoomData(room),
          }));

          broadcastToRoom(room, {
            type: 'PLAYER_JOINED',
            color: yourColor,
            name: data.playerName,
            roomState: cleanRoomData(room),
          });
        } else if (type === 'MOVE') {
          const room = currentRoomId ? rooms.get(currentRoomId) : null;
          if (!room || room.status !== 'active') return;

          const playerColor = room.white?.id === data.playerId ? 'w' : room.black?.id === data.playerId ? 'b' : null;
          if (!playerColor || room.chess.turn() !== playerColor) {
            return ws.send(JSON.stringify({ type: 'ERROR', message: 'Bukan giliran Anda' }));
          }

          try {
            const moveResult = room.chess.move({
              from: data.from,
              to: data.to,
              promotion: data.promotion || 'q',
            });

            if (!moveResult) {
              return ws.send(JSON.stringify({ type: 'ERROR', message: 'Langkah tidak valid' }));
            }

            const now = Date.now();
            if (room.timeControl.minutes > 0 && room.lastMoveTime > 0) {
              const elapsed = now - room.lastMoveTime;
              const movingPlayer = playerColor === 'w' ? room.white : room.black;
              if (movingPlayer) {
                movingPlayer.timeLeftMs = Math.max(0, movingPlayer.timeLeftMs - elapsed + (room.timeControl.increment * 1000));
              }
            }
            room.lastMoveTime = now;
            room.drawOfferedBy = null; // moving cancels draw offer

            // Check game status
            if (room.chess.isCheckmate()) {
              room.status = 'checkmate';
              room.winner = playerColor;
              room.reason = `Skakmat oleh ${playerColor === 'w' ? 'Putih' : 'Hitam'}`;
            } else if (room.chess.isStalemate()) {
              room.status = 'stalemate';
              room.winner = 'draw';
              room.reason = 'Remis karena Stalemate (Kebuntuan)';
            } else if (room.chess.isThreefoldRepetition()) {
              room.status = 'draw';
              room.winner = 'draw';
              room.reason = 'Remis karena pengulangan posisi 3 kali';
            } else if (room.chess.isInsufficientMaterial()) {
              room.status = 'draw';
              room.winner = 'draw';
              room.reason = 'Remis karena materi bidak tidak cukup';
            } else if (room.chess.isDraw()) {
              room.status = 'draw';
              room.winner = 'draw';
              room.reason = 'Remis (Aturan 50 Langkah)';
            }

            broadcastToRoom(room, {
              type: 'MOVE_MADE',
              move: moveResult,
              roomState: cleanRoomData(room),
            });
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Langkah gagal';
            ws.send(JSON.stringify({ type: 'ERROR', message }));
          }
        } else if (type === 'RESIGN') {
          const room = currentRoomId ? rooms.get(currentRoomId) : null;
          if (!room || room.status !== 'active') return;

          const playerColor = room.white?.id === data.playerId ? 'w' : room.black?.id === data.playerId ? 'b' : null;
          if (!playerColor) return;

          room.status = 'resigned';
          room.winner = playerColor === 'w' ? 'b' : 'w';
          room.reason = `${playerColor === 'w' ? 'Putih' : 'Hitam'} menyerah`;

          broadcastToRoom(room, {
            type: 'GAME_OVER',
            roomState: cleanRoomData(room),
            winner: room.winner,
            reason: room.reason,
          });
        } else if (type === 'OFFER_DRAW') {
          const room = currentRoomId ? rooms.get(currentRoomId) : null;
          if (!room || room.status !== 'active') return;

          const playerColor = room.white?.id === data.playerId ? 'w' : room.black?.id === data.playerId ? 'b' : null;
          if (!playerColor) return;

          room.drawOfferedBy = playerColor;
          broadcastToRoom(room, {
            type: 'DRAW_OFFERED',
            byColor: playerColor,
            roomState: cleanRoomData(room),
          });
        } else if (type === 'ACCEPT_DRAW') {
          const room = currentRoomId ? rooms.get(currentRoomId) : null;
          if (!room || room.status !== 'active' || !room.drawOfferedBy) return;

          room.status = 'draw';
          room.winner = 'draw';
          room.reason = 'Remis disepakati kedua pemain';
          room.drawOfferedBy = null;

          broadcastToRoom(room, {
            type: 'GAME_OVER',
            roomState: cleanRoomData(room),
            winner: 'draw',
            reason: room.reason,
          });
        } else if (type === 'DECLINE_DRAW') {
          const room = currentRoomId ? rooms.get(currentRoomId) : null;
          if (!room || !room.drawOfferedBy) return;

          room.drawOfferedBy = null;
          broadcastToRoom(room, {
            type: 'DRAW_DECLINED',
            roomState: cleanRoomData(room),
          });
        } else if (type === 'REQUEST_REMATCH') {
          const room = currentRoomId ? rooms.get(currentRoomId) : null;
          if (!room) return;

          room.rematchVotes.add(data.playerId);

          if (room.white && room.black && room.rematchVotes.has(room.white.id) && room.rematchVotes.has(room.black.id)) {
            // Swap colors for rematch!
            const prevWhite = room.white;
            const prevBlack = room.black;
            const initialMs = room.timeControl.minutes * 60 * 1000;

            room.white = { ...prevBlack, timeLeftMs: initialMs };
            room.black = { ...prevWhite, timeLeftMs: initialMs };
            room.chess = new Chess();
            room.status = 'active';
            room.winner = null;
            room.reason = null;
            room.drawOfferedBy = null;
            room.rematchVotes.clear();
            room.lastMoveTime = Date.now();

            broadcastToRoom(room, {
              type: 'REMATCH_STARTED',
              roomState: cleanRoomData(room),
            });
          } else {
            broadcastToRoom(room, {
              type: 'REMATCH_VOTE',
              votes: Array.from(room.rematchVotes),
              byPlayerId: data.playerId,
            });
          }
        } else if (type === 'CHAT_MESSAGE') {
          const room = currentRoomId ? rooms.get(currentRoomId) : null;
          if (!room) return;
          const isWhite = room.white?.id === data.playerId;
          const isBlack = room.black?.id === data.playerId;
          const playerColor = isWhite ? 'w' : isBlack ? 'b' : 'spectator';
          const playerName = isWhite && room.white ? room.white.name : isBlack && room.black ? room.black.name : 'Penonton';

          broadcastToRoom(room, {
            type: 'CHAT_RECEIVED',
            sender: playerName,
            color: playerColor,
            text: (data.text || '').slice(0, 100),
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          if (room.white?.id === currentPlayerId) {
            room.white.ws = undefined;
          } else if (room.black?.id === currentPlayerId) {
            room.black.ws = undefined;
          } else {
            room.spectators = room.spectators.filter(s => s.id !== currentPlayerId);
          }
          broadcastToRoom(room, {
            type: 'PLAYER_DISCONNECTED',
            playerId: currentPlayerId,
            roomState: cleanRoomData(room),
          });
        }
      }
    });
  });

  // Mount Vite or static dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
