import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { TitleScreen } from './components/TitleScreen';
import { ChessBoard } from './components/ChessBoard';
import { GameHUD } from './components/GameHUD';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { GameMode, BoardTheme, BotDifficulty, PieceColor, TimeControl, OnlineRoomState } from './types/chess';
import { soundService } from './services/sound';
import { getBotMove } from './services/aiBot';

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>('TITLE');
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [fen, setFen] = useState<string>(() => game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('wood');

  // Pawn Promotion State
  const [isPromotionOpen, setIsPromotionOpen] = useState(false);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{ from: Square; to: Square } | null>(null);

  // Game Over State
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);

  // Bot State
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Online Multiplayer State
  const [isOnlineLobbyOpen, setIsOnlineLobbyOpen] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [onlineRoomState, setOnlineRoomState] = useState<OnlineRoomState | null>(null);
  const [myOnlineColor, setMyOnlineColor] = useState<PieceColor | 'spectator' | null>(null);
  const [onlinePlayerId] = useState<string>(() => {
    let id = localStorage.getItem('catur_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('catur_player_id', id);
    }
    return id;
  });
  const [wsConnecting, setWsConnecting] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Clocks
  const [timeControl, setTimeControl] = useState<TimeControl>({ minutes: 0, increment: 0 });
  const [whiteTimeMs, setWhiteTimeMs] = useState<number>(0);
  const [blackTimeMs, setBlackTimeMs] = useState<number>(0);

  // Names
  const [whiteName, setWhiteName] = useState('Putih');
  const [blackName, setBlackName] = useState('Hitam');

  // Connect or initialize WebSocket if needed
  const getWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return wsRef.current;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnecting(false);
      setWsError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        if (type === 'ROOM_CREATED') {
          setCreatedRoomId(data.roomId);
          setMyOnlineColor(data.yourColor);
          setOrientation(data.yourColor === 'b' ? 'b' : 'w');
          setOnlineRoomState(data.roomState);
        } else if (type === 'ROOM_JOINED') {
          setMyOnlineColor(data.yourColor);
          setOrientation(data.yourColor === 'b' ? 'b' : 'w');
          setOnlineRoomState(data.roomState);
          setIsOnlineLobbyOpen(false);
          setGameMode('ONLINE');
          syncRoomToClient(data.roomState);
        } else if (type === 'PLAYER_JOINED') {
          setOnlineRoomState(data.roomState);
          if (data.roomState.status === 'active') {
            setIsOnlineLobbyOpen(false);
            setGameMode('ONLINE');
            syncRoomToClient(data.roomState);
          }
        } else if (type === 'MOVE_MADE') {
          setOnlineRoomState(data.roomState);
          syncRoomToClient(data.roomState, data.move);
        } else if (type === 'GAME_OVER') {
          setOnlineRoomState(data.roomState);
          setWinner(data.winner);
          setGameOverReason(data.reason);
          setIsGameOverOpen(true);
          if (data.winner === myOnlineColor) {
            soundService.playVictory();
          } else if (data.winner === 'draw') {
            soundService.playMove();
          } else {
            soundService.playDefeat();
          }
        } else if (type === 'DRAW_OFFERED') {
          setOnlineRoomState(data.roomState);
        } else if (type === 'DRAW_DECLINED') {
          setOnlineRoomState(data.roomState);
        } else if (type === 'REMATCH_STARTED') {
          setOnlineRoomState(data.roomState);
          syncRoomToClient(data.roomState);
          setIsGameOverOpen(false);
        } else if (type === 'ERROR') {
          setWsError(data.message || 'Terjadi kesalahan server');
          setWsConnecting(false);
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    ws.onerror = () => {
      setWsError('Koneksi WebSocket terputus');
      setWsConnecting(false);
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    wsRef.current = ws;
    return ws;
  }, [myOnlineColor]);

  // Synchronize incoming room state with local chess instance
  const syncRoomToClient = useCallback((roomState: OnlineRoomState, lastMoveObj?: Move) => {
    const newGame = new Chess();
    newGame.load(roomState.fen);
    setGame(newGame);
    setFen(newGame.fen());

    if (lastMoveObj) {
      setLastMove({ from: lastMoveObj.from as Square, to: lastMoveObj.to as Square });
      if (newGame.inCheck()) {
        soundService.playCheck();
      } else if (lastMoveObj.captured) {
        soundService.playCapture();
      } else {
        soundService.playMove();
      }
    }

    if (roomState.white) {
      setWhiteName(roomState.white.name);
      setWhiteTimeMs(roomState.white.timeLeftMs);
    }
    if (roomState.black) {
      setBlackName(roomState.black.name);
      setBlackTimeMs(roomState.black.timeLeftMs);
    }
    setTimeControl(roomState.timeControl);

    if (roomState.status !== 'waiting' && roomState.status !== 'active') {
      setWinner(roomState.winner);
      setGameOverReason(roomState.reason);
      setIsGameOverOpen(true);
    }
  }, []);

  // Check URL params on initial load for invite links: ?room=XYZ123
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setIsOnlineLobbyOpen(true);
    }
  }, []);

  // Timer interval for offline & bot games
  useEffect(() => {
    if (gameMode === 'TITLE' || gameMode === 'ONLINE' || timeControl.minutes === 0 || game.isGameOver()) {
      return;
    }

    const interval = setInterval(() => {
      const activeColor = game.turn();
      if (activeColor === 'w') {
        setWhiteTimeMs((prev) => {
          if (prev <= 1000) {
            handleGameOver('b', 'Waktu Putih telah habis');
            return 0;
          }
          return prev - 1000;
        });
      } else {
        setBlackTimeMs((prev) => {
          if (prev <= 1000) {
            handleGameOver('w', 'Waktu Hitam telah habis');
            return 0;
          }
          return prev - 1000;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode, timeControl.minutes, game]);

  // Online clock decrement during active turn
  useEffect(() => {
    if (gameMode !== 'ONLINE' || !onlineRoomState || onlineRoomState.status !== 'active' || timeControl.minutes === 0) {
      return;
    }

    const interval = setInterval(() => {
      const activeTurn = onlineRoomState.turn;
      if (activeTurn === 'w') {
        setWhiteTimeMs((prev) => Math.max(0, prev - 1000));
      } else {
        setBlackTimeMs((prev) => Math.max(0, prev - 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode, onlineRoomState, timeControl.minutes]);

  // Handle Game Over
  const handleGameOver = useCallback((win: PieceColor | 'draw', reasonText: string) => {
    setWinner(win);
    setGameOverReason(reasonText);
    setIsGameOverOpen(true);
    if (win === 'draw') {
      soundService.playMove();
    } else if (gameMode === 'VS_BOT') {
      if (win === 'w') soundService.playVictory();
      else soundService.playDefeat();
    } else {
      soundService.playVictory();
    }
  }, [gameMode]);

  // Check board state after local moves
  const checkGameEndConditions = useCallback((currentGame: Chess) => {
    // 75-move rule check (automatic draw)
    const tokens = currentGame.fen().split(' ');
    const halfmoves = parseInt(tokens[4], 10) || 0;
    if (halfmoves >= 150) {
      handleGameOver('draw', 'Remis Otomatis: Aturan 75 Langkah (75-Move Rule)');
      return true;
    }

    if (currentGame.isCheckmate()) {
      const win = currentGame.turn() === 'w' ? 'b' : 'w';
      handleGameOver(win, `Skakmat oleh ${win === 'w' ? 'Putih' : 'Hitam'}`);
      return true;
    }
    if (currentGame.isStalemate()) {
      handleGameOver('draw', 'Remis karena Stalemate (Kebuntuan)');
      return true;
    }
    if (currentGame.isInsufficientMaterial()) {
      handleGameOver('draw', 'Remis karena materi bidak tidak cukup (Insufficient Material)');
      return true;
    }
    if (currentGame.isThreefoldRepetition()) {
      handleGameOver('draw', 'Remis karena pengulangan posisi 3 kali (Threefold Repetition)');
      return true;
    }
    if (currentGame.isDraw()) {
      handleGameOver('draw', 'Remis (Aturan 50 Langkah)');
      return true;
    }
    return false;
  }, [handleGameOver]);

  // Execute a verified move
  const executeMove = useCallback((from: Square, to: Square, promotionPiece: 'q' | 'r' | 'b' | 'n' = 'q') => {
    if (gameMode === 'ONLINE') {
      // Send move to server
      const ws = getWebSocket();
      if (ws && ws.readyState === WebSocket.OPEN && onlineRoomState) {
        ws.send(JSON.stringify({
          type: 'MOVE',
          roomId: onlineRoomState.id,
          playerId: onlinePlayerId,
          from,
          to,
          promotion: promotionPiece,
        }));
      }
      setSelectedSquare(null);
      return;
    }

    try {
      const move = game.move({
        from,
        to,
        promotion: promotionPiece,
      });

      if (!move) return;

      setFen(game.fen());
      setLastMove({ from, to });
      setSelectedSquare(null);

      // Sound feedback
      if (game.inCheck()) {
        soundService.playCheck();
      } else if (move.captured) {
        soundService.playCapture();
      } else {
        soundService.playMove();
      }

      // Add increment if timed
      if (timeControl.increment > 0) {
        if (move.color === 'w') {
          setWhiteTimeMs((prev) => prev + timeControl.increment * 1000);
        } else {
          setBlackTimeMs((prev) => prev + timeControl.increment * 1000);
        }
      }

      const isEnded = checkGameEndConditions(game);

      // Bot turn trigger
      if (!isEnded && gameMode === 'VS_BOT' && game.turn() === 'b') {
        setIsBotThinking(true);
        setTimeout(() => {
          const botMove = getBotMove(game, botDifficulty);
          if (botMove) {
            const bRes = game.move(botMove);
            setFen(game.fen());
            setLastMove({ from: botMove.from as Square, to: botMove.to as Square });
            if (game.inCheck()) {
              soundService.playCheck();
            } else if (bRes && bRes.captured) {
              soundService.playCapture();
            } else {
              soundService.playMove();
            }
            checkGameEndConditions(game);
          }
          setIsBotThinking(false);
        }, 500);
      }
    } catch (e) {
      console.error('Invalid move:', e);
    }
  }, [game, gameMode, timeControl, botDifficulty, onlineRoomState, onlinePlayerId, getWebSocket, checkGameEndConditions]);

  // Handle square clicks
  const handleSquareClick = (square: Square) => {
    if (game.isGameOver()) return;
    if (isBotThinking) return;

    if (gameMode === 'ONLINE') {
      if (!myOnlineColor || myOnlineColor === 'spectator') return;
      if (game.turn() !== myOnlineColor) return;
    }

    // If already clicked a piece of current turn
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Check if moving to square is a promotion
      const piece = game.get(selectedSquare);
      if (
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && square.endsWith('8')) || (piece.color === 'b' && square.endsWith('1')))
      ) {
        const moves = game.moves({ square: selectedSquare, verbose: true });
        const isLegal = moves.some((m) => m.to === square);
        if (isLegal) {
          setPendingPromotionMove({ from: selectedSquare, to: square });
          setIsPromotionOpen(true);
          return;
        }
      }

      // Check if clicking another friendly piece
      const targetPiece = game.get(square);
      if (targetPiece && targetPiece.color === game.turn()) {
        setSelectedSquare(square);
        soundService.playClick();
        return;
      }

      // Attempt move
      executeMove(selectedSquare, square);
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        soundService.playClick();
      }
    }
  };

  const handlePieceDrop = (from: Square, to: Square) => {
    if (game.isGameOver() || isBotThinking) return;
    if (gameMode === 'ONLINE' && game.turn() !== myOnlineColor) return;

    const piece = game.get(from);
    if (
      piece &&
      piece.type === 'p' &&
      ((piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1')))
    ) {
      const moves = game.moves({ square: from, verbose: true });
      if (moves.some((m) => m.to === to)) {
        setPendingPromotionMove({ from, to });
        setIsPromotionOpen(true);
        return;
      }
    }

    executeMove(from, to);
  };

  const handlePromotionSelect = (promotedPiece: 'q' | 'r' | 'b' | 'n') => {
    setIsPromotionOpen(false);
    if (pendingPromotionMove) {
      executeMove(pendingPromotionMove.from, pendingPromotionMove.to, promotedPiece);
      setPendingPromotionMove(null);
    }
  };

  // Start Offline Modes
  const startPassAndPlay = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setOrientation('w');
    setWhiteName('Player 1 (White)');
    setBlackName('Player 2 (Black)');
    setTimeControl({ minutes: 0, increment: 0 });
    setWhiteTimeMs(0);
    setBlackTimeMs(0);
    setIsGameOverOpen(false);
    setWinner(null);
    setGameOverReason(null);
    setGameMode('PASS_AND_PLAY');
  };

  // Undo move logic
  const handleUndo = useCallback(() => {
    if (gameMode === 'ONLINE') return;
    if (game.history().length === 0) return;

    if (gameMode === 'VS_BOT') {
      // Revert bot move and player move
      game.undo();
      if (game.history().length > 0 && game.turn() === 'b') {
        game.undo();
      }
    } else {
      game.undo();
    }

    setFen(game.fen());
    const hist = game.history({ verbose: true });
    if (hist.length > 0) {
      const prev = hist[hist.length - 1];
      setLastMove({ from: prev.from as Square, to: prev.to as Square });
    } else {
      setLastMove(null);
    }
    setSelectedSquare(null);
    setIsGameOverOpen(false);
    setWinner(null);
    setGameOverReason(null);
    soundService.playClick();
  }, [game, gameMode]);

  // Restart match logic
  const handleRestart = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setIsGameOverOpen(false);
    setWinner(null);
    setGameOverReason(null);
    if (timeControl.minutes > 0) {
      const initialMs = timeControl.minutes * 60 * 1000;
      setWhiteTimeMs(initialMs);
      setBlackTimeMs(initialMs);
    }
    soundService.playClick();
  }, [timeControl]);

  // 50-move rule and threefold repetition claim logic
  const halfmoveCount = React.useMemo(() => {
    const tokens = fen.split(' ');
    return parseInt(tokens[4], 10) || 0;
  }, [fen]);

  const isThreefold = game.isThreefoldRepetition();
  const is50Move = halfmoveCount >= 100;
  const canClaimDraw = !game.isGameOver() && (isThreefold || is50Move);
  const claimDrawReason = isThreefold
    ? 'Threefold Repetition (Pengulangan Posisi 3 Kali)'
    : is50Move
    ? 'Aturan 50 Langkah (50-Move Rule)'
    : null;

  const handleClaimDraw = useCallback(() => {
    if (!canClaimDraw) return;
    const reasonText = isThreefold
      ? 'Remis diklaim: Threefold Repetition'
      : 'Remis diklaim: Aturan 50 Langkah (50-Move Rule)';
    handleGameOver('draw', reasonText);
  }, [canClaimDraw, isThreefold, handleGameOver]);

  const startBotGame = (difficulty: BotDifficulty) => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setOrientation('w');
    setWhiteName('Anda (Putih)');
    setBlackName(`Bot Catur (${difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Mahir'})`);
    setBotDifficulty(difficulty);
    setTimeControl({ minutes: 0, increment: 0 });
    setWhiteTimeMs(0);
    setBlackTimeMs(0);
    setIsGameOverOpen(false);
    setWinner(null);
    setGameOverReason(null);
    setGameMode('VS_BOT');
  };

  // Online Room Creation & Joining
  const handleCreateOnlineRoom = (tc: TimeControl, preferredColor: 'w' | 'b' | 'random', playerName: string) => {
    setWsConnecting(true);
    setWsError(null);
    const ws = getWebSocket();
    const sendPayload = () => {
      ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        playerId: onlinePlayerId,
        playerName,
        timeControl: tc,
        preferredColor,
      }));
    };

    if (ws.readyState === WebSocket.OPEN) {
      sendPayload();
    } else {
      ws.onopen = () => {
        setWsConnecting(false);
        sendPayload();
      };
    }
  };

  const handleJoinOnlineRoom = (roomId: string, playerName: string) => {
    setWsConnecting(true);
    setWsError(null);
    const ws = getWebSocket();
    const sendPayload = () => {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomId,
        playerId: onlinePlayerId,
        playerName,
      }));
    };

    if (ws.readyState === WebSocket.OPEN) {
      sendPayload();
    } else {
      ws.onopen = () => {
        setWsConnecting(false);
        sendPayload();
      };
    }
  };

  const handleResign = () => {
    if (game.isGameOver()) return;
    if (gameMode === 'ONLINE') {
      const ws = getWebSocket();
      if (ws && ws.readyState === WebSocket.OPEN && onlineRoomState) {
        ws.send(JSON.stringify({
          type: 'RESIGN',
          roomId: onlineRoomState.id,
          playerId: onlinePlayerId,
        }));
      }
    } else {
      const resigningColor = game.turn();
      const win = resigningColor === 'w' ? 'b' : 'w';
      handleGameOver(win, `${resigningColor === 'w' ? 'Putih' : 'Hitam'} mengundurkan diri (menyerah)`);
    }
  };

  const handleOfferDraw = () => {
    if (game.isGameOver()) return;
    if (gameMode === 'ONLINE') {
      const ws = getWebSocket();
      if (ws && ws.readyState === WebSocket.OPEN && onlineRoomState) {
        ws.send(JSON.stringify({
          type: 'OFFER_DRAW',
          roomId: onlineRoomState.id,
          playerId: onlinePlayerId,
        }));
      }
    } else if (gameMode === 'PASS_AND_PLAY') {
      handleGameOver('draw', 'Remis disepakati oleh kedua pemain');
    }
  };

  const handleAcceptDraw = () => {
    if (gameMode === 'ONLINE' && onlineRoomState) {
      const ws = getWebSocket();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ACCEPT_DRAW',
          roomId: onlineRoomState.id,
          playerId: onlinePlayerId,
        }));
      }
    }
  };

  const handleDeclineDraw = () => {
    if (gameMode === 'ONLINE' && onlineRoomState) {
      const ws = getWebSocket();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'DECLINE_DRAW',
          roomId: onlineRoomState.id,
          playerId: onlinePlayerId,
        }));
      }
    }
  };

  const handleRematch = () => {
    if (gameMode === 'ONLINE' && onlineRoomState) {
      const ws = getWebSocket();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'REQUEST_REMATCH',
          roomId: onlineRoomState.id,
          playerId: onlinePlayerId,
        }));
      }
    } else if (gameMode === 'VS_BOT') {
      startBotGame(botDifficulty);
    } else {
      startPassAndPlay();
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
      {gameMode === 'TITLE' ? (
        <TitleScreen
          onStartOnline={() => setIsOnlineLobbyOpen(true)}
          onStartPassAndPlay={startPassAndPlay}
          onStartBot={startBotGame}
        />
      ) : (
        <div className="w-full max-w-4xl min-h-screen flex flex-col justify-between p-3 sm:p-5 mx-auto">
          {/* Top HUD Controls & Opponent Status */}
          <GameHUD
            game={game}
            whiteName={whiteName}
            blackName={blackName}
            whiteTimeMs={whiteTimeMs}
            blackTimeMs={blackTimeMs}
            hasTimer={timeControl.minutes > 0}
            orientation={orientation}
            theme={boardTheme}
            onChangeTheme={setBoardTheme}
            onFlipBoard={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            onBackToMenu={() => setGameMode('TITLE')}
            isOnline={gameMode === 'ONLINE'}
            onlineRoomId={onlineRoomState?.id}
            drawOfferedBy={onlineRoomState?.drawOfferedBy}
            playerColor={myOnlineColor === 'spectator' ? null : myOnlineColor}
            onAcceptDraw={handleAcceptDraw}
            onDeclineDraw={handleDeclineDraw}
            onUndo={handleUndo}
            canUndo={game.history().length > 0 && gameMode !== 'ONLINE'}
            onRestart={handleRestart}
            onClaimDraw={handleClaimDraw}
            canClaimDraw={canClaimDraw}
            claimDrawReason={claimDrawReason}
          />

          {/* Center 1:1 Aspect Ratio Chessboard */}
          <main className="my-auto py-2 flex items-center justify-center w-full">
            <ChessBoard
              game={game}
              orientation={orientation}
              theme={boardTheme}
              selectedSquare={selectedSquare}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              lastMove={lastMove}
              isInteractive={!game.isGameOver() && !isBotThinking}
            />
          </main>
        </div>
      )}

      {/* Pawn Promotion Modal */}
      <PromotionModal
        color={game.turn()}
        isOpen={isPromotionOpen}
        onSelect={handlePromotionSelect}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        winner={winner}
        reason={gameOverReason}
        playerColor={myOnlineColor === 'spectator' ? null : myOnlineColor}
        onRematch={handleRematch}
        onReviewBoard={() => setIsGameOverOpen(false)}
        onHome={() => {
          setIsGameOverOpen(false);
          setGameMode('TITLE');
        }}
      />

      {/* Online Multiplayer Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isOnlineLobbyOpen}
        onClose={() => setIsOnlineLobbyOpen(false)}
        onCreateRoom={handleCreateOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
        createdRoomId={createdRoomId}
        isConnecting={wsConnecting}
        errorMessage={wsError}
      />
    </div>
  );
}
