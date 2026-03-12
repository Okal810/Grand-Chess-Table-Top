/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess, Move } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCw, 
  RotateCcw, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Trophy,
  AlertCircle,
  Settings2,
  FlipVertical,
  Users,
  User,
  Flag,
  Handshake,
  Download,
  Clock,
  X,
  Check,
  Trash2,
  Edit3,
  Play,
  Maximize,
  Minimize,
  Volume2,
  VolumeX
} from 'lucide-react';

// --- Subcomponents ---
const PlayerArea = ({ color, timer, isTurn, inCheck, onResign, onDrawOffer, drawOfferedByOpponent, onDrawAcceptClick, rotated }: any) => {
  return (
    <div className={`flex items-center justify-between w-full p-4 bg-zinc-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-zinc-700 ${rotated ? 'rotate-180' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`text-4xl font-mono font-bold ${isTurn ? 'text-white' : 'text-zinc-500'}`}>
          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
        {isTurn && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />}
        {inCheck && (
          <div className="px-3 py-1.5 text-sm font-extrabold tracking-wide uppercase rounded-lg bg-red-600/90 text-white shadow-[0_0_12px_rgba(220,38,38,0.6)] animate-pulse">
            Check
          </div>
        )}
      </div>
      <div className="flex gap-3">
        {drawOfferedByOpponent ? (
          <button 
            onClick={onDrawAcceptClick} 
            className="p-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all shadow-lg"
            title="Accept Draw"
          >
            <Check size={24} />
          </button>
        ) : (
          <button 
            onClick={onDrawOffer} 
            className="p-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-xl transition-all"
            title="Offer Draw"
          >
            <Handshake size={24} />
          </button>
        )}
        <button 
          onClick={onResign} 
          className="p-3 bg-red-900/50 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all"
          title="Resign"
        >
          <Flag size={24} />
        </button>
      </div>
    </div>
  );
};

const EditPalette = ({ editTool, setEditTool, turn, setTurn, clearBoard, resetBoard, pieces, PIECES }: any) => {
  return (
    <div className="flex flex-col gap-4 w-full p-4 bg-zinc-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-zinc-700">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold">Custom Board</h3>
        <div className="flex gap-2">
          <button onClick={clearBoard} className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">Clear</button>
          <button onClick={resetBoard} className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">Reset</button>
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-xl">
        <span className="text-sm text-zinc-400">Turn:</span>
        <div className="flex gap-2">
          <button 
            onClick={() => setTurn('w')} 
            className={`px-4 py-1 rounded-lg font-bold transition-colors ${turn === 'w' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            White
          </button>
          <button 
            onClick={() => setTurn('b')} 
            className={`px-4 py-1 rounded-lg font-bold transition-colors ${turn === 'b' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            Black
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {['w', 'b'].map((color) => (
          <div key={color} className="flex gap-1 bg-zinc-900 p-1 rounded-xl">
            {pieces.map((p: any) => {
              const isSelected = editTool !== 'trash' && editTool?.color === color && editTool?.type === p;
              return (
                <button 
                  key={p} 
                  onClick={() => setEditTool({ type: p, color })}
                  className={`p-1 rounded-lg transition-all ${isSelected ? 'bg-blue-600' : 'hover:bg-zinc-700'}`}
                >
                  <img src={PIECES[`${color}${p}`]} className="w-8 h-8" alt={`${color}${p}`} />
                </button>
              )
            })}
          </div>
        ))}
        <button 
          onClick={() => setEditTool('trash')}
          className={`p-2 rounded-xl flex items-center justify-center transition-all ${editTool === 'trash' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-700'}`}
        >
          <Trash2 size={24} />
        </button>
      </div>
    </div>
  );
};

// --- Types ---

type Square = string;
type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type Color = 'w' | 'b';

interface Piece {
  type: PieceSymbol;
  color: Color;
}

// --- Constants ---

const PIECES: Record<string, string> = {
  wp: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  wn: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wb: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wr: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wq: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wk: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  bp: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  bn: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  br: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bq: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bk: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// --- Components ---

export default function App() {
  const [game] = useState(new Chess());
  const [trigger, setTrigger] = useState(0);
  const forceUpdate = useCallback(() => setTrigger(t => t + 1), []);

  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showPromotion, setShowPromotion] = useState<{ from: string; to: string } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [tabletopMode, setTabletopMode] = useState(true);

  // New features state
  const [timerMinutes, setTimerMinutes] = useState<number | null>(10);
  const [timers, setTimers] = useState<{w: number, b: number}>({ w: 600, b: 600 });
  const [timerActive, setTimerActive] = useState(false);
  const [customGameOver, setCustomGameOver] = useState<string | null>(null);
  const [drawOffer, setDrawOffer] = useState<Color | null>(null);
  const [showDrawConfirm, setShowDrawConfirm] = useState<Color | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTool, setEditTool] = useState<{ type: PieceSymbol, color: Color } | 'trash' | null>(null);

  // Sync game state
  const board = useMemo(() => game.board(), [game, trigger]);
  const turn = game.turn();
  const isGameOver = !isEditing && (game.isGameOver() || customGameOver !== null);
  const isCheck = game.inCheck();
  const audioContextRef = React.useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: 'move' | 'capture' | 'check' | 'gameOver') => {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const beep = (freq: number, duration: number, gain = 0.04, delay = 0) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      vol.gain.setValueAtTime(0.0001, now + delay);
      vol.gain.exponentialRampToValueAtTime(gain, now + delay + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(vol);
      vol.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    if (type === 'move') beep(540, 0.08);
    if (type === 'capture') {
      beep(420, 0.09, 0.05);
      beep(320, 0.11, 0.04, 0.06);
    }
    if (type === 'check') {
      beep(760, 0.08, 0.05);
      beep(920, 0.1, 0.045, 0.07);
    }
    if (type === 'gameOver') {
      beep(520, 0.1, 0.05);
      beep(420, 0.12, 0.045, 0.08);
      beep(320, 0.16, 0.04, 0.18);
    }
  }, [getAudioContext, soundEnabled]);


  useEffect(() => {
    if (isGameOver) playSound('gameOver');
  }, [isGameOver, playSound]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Timer logic
  useEffect(() => {
    if (!timerActive || isGameOver || timerMinutes === null || isEditing) return;

    const interval = setInterval(() => {
      setTimers(prev => {
        const currentTurn = game.turn();
        const newTime = prev[currentTurn] - 1;
        if (newTime <= 0) {
          setCustomGameOver(`Timeout! ${currentTurn === 'w' ? 'Black' : 'White'} wins.`);
          setTimerActive(false);
          return { ...prev, [currentTurn]: 0 };
        }
        return { ...prev, [currentTurn]: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, isGameOver, game, timerMinutes, isEditing, trigger]);

  const resetGame = () => {
    game.reset();
    setSelectedSquare(null);
    setMoveHistory([]);
    setLastMove(null);
    setShowPromotion(null);
    setCustomGameOver(null);
    setDrawOffer(null);
    setShowDrawConfirm(null);
    if (timerMinutes !== null) {
      setTimers({ w: timerMinutes * 60, b: timerMinutes * 60 });
    }
    setTimerActive(false);
    forceUpdate();
  };

  const applyTimerSettings = (minutes: number | null) => {
    setTimerMinutes(minutes);
    if (minutes !== null) {
      setTimers({ w: minutes * 60, b: minutes * 60 });
    }
    setShowSettings(false);
    resetGame();
  };

  const handleResign = (color: Color) => {
    setCustomGameOver(`${color === 'w' ? 'White' : 'Black'} resigned. ${color === 'w' ? 'Black' : 'White'} wins.`);
    setTimerActive(false);
  };

  const handleDrawOffer = (color: Color) => {
    setDrawOffer(color);
  };

  const exportPGN = () => {
    const pgn = game.pgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chess_game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Validate board
      const b = game.board();
      let wKing = false;
      let bKing = false;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p && p.type === 'k') {
            if (p.color === 'w') wKing = true;
            if (p.color === 'b') bKing = true;
          }
        }
      }
      if (!wKing || !bKing) {
        alert("Board must have both a White and Black King to play.");
        return;
      }
      
      setMoveHistory([]);
      setLastMove(null);
      setCustomGameOver(null);
      setDrawOffer(null);
      setShowDrawConfirm(null);
      setTimerActive(false);
      if (timerMinutes !== null) {
        setTimers({ w: timerMinutes * 60, b: timerMinutes * 60 });
      }
    }
    setIsEditing(!isEditing);
  };

  const clearBoard = () => {
    game.clear();
    forceUpdate();
  };

  const resetBoard = () => {
    game.reset();
    forceUpdate();
  };

  const setTurnForEdit = (color: Color) => {
    const tokens = game.fen().split(' ');
    tokens[1] = color;
    const success = game.load(tokens.join(' '));
    if (!success) {
      alert("Cannot change turn. Ensure the board position is valid (e.g. both kings present).");
    }
    forceUpdate();
  };

  const handleSquareClick = (square: string) => {
    if (isEditing) {
      if (editTool === 'trash') {
        game.remove(square as any);
        forceUpdate();
      } else if (editTool) {
        if (editTool.type === 'k') {
          const b = game.board();
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const p = b[r][c];
              if (p && p.type === 'k' && p.color === editTool.color) {
                game.remove(`${FILES[c]}${RANKS[r]}` as any);
              }
            }
          }
        }
        game.put(editTool as any, square as any);
        forceUpdate();
      }
      return;
    }

    if (isGameOver) return;

    // If a square is already selected, try to move
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      const moveAttempt = {
        from: selectedSquare,
        to: square,
        promotion: 'q', // Default to queen for now, handle properly if needed
      };

      try {
        // Check if move is valid (including promotion check)
        const moves = game.moves({ square: selectedSquare as any, verbose: true });
        const isPromotion = moves.some(m => m.to === square && m.flags.includes('p'));

        if (isPromotion) {
          setShowPromotion({ from: selectedSquare, to: square });
          return;
        }

        const move = game.move(moveAttempt);
        if (move) {
          setLastMove({ from: move.from, to: move.to });
          setSelectedSquare(null);
          setMoveHistory(prev => [...prev, move.san]);
          setDrawOffer(null); // Reset draw offer on move
          playSound(move.captured ? 'capture' : 'move');
          if (game.inCheck()) playSound('check');
          if (!timerActive && timerMinutes !== null) setTimerActive(true);
          forceUpdate();
        } else {
          // If move failed, check if we clicked another of our own pieces
          const piece = game.get(square as any);
          if (piece && piece.color === turn) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        }
      } catch (e) {
        setSelectedSquare(null);
      }
    } else {
      // Select the square if it has a piece of the current turn's color
      const piece = game.get(square as any);
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
      }
    }
  };

  const handlePromotion = (pieceType: PieceSymbol) => {
    if (!showPromotion) return;

    try {
      const move = game.move({
        from: showPromotion.from,
        to: showPromotion.to,
        promotion: pieceType,
      });

      if (move) {
        setLastMove({ from: move.from, to: move.to });
        setMoveHistory(prev => [...prev, move.san]);
        setDrawOffer(null);
        playSound(move.captured ? 'capture' : 'move');
        if (game.inCheck()) playSound('check');
        if (!timerActive && timerMinutes !== null) setTimerActive(true);
        forceUpdate();
      }
    } catch (e) {
      console.error("Promotion failed", e);
    }
    setShowPromotion(null);
    setSelectedSquare(null);
  };

  const rotateBoard = (dir: 'cw' | 'ccw') => {
    setRotation(prev => {
      if (dir === 'cw') return (prev + 90) % 360;
      return (prev - 90 + 360) % 360;
    });
  };

  const undoMove = () => {
    game.undo();
    setMoveHistory(prev => prev.slice(0, -1));
    setLastMove(null);
    setSelectedSquare(null);
    setDrawOffer(null);
    forceUpdate();
  };

  // Get valid moves for highlighting
  const validMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare as any, verbose: true }).map(m => m.to);
  }, [selectedSquare, game]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen h-[100dvh] bg-[#1a1a1a] text-white overflow-hidden relative select-none">
      
      {/* Global Header */}
      {!isFullscreen && (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-auto">
        <div className="flex gap-2">
          <button 
            onClick={toggleEditMode} 
            className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${isEditing ? 'bg-green-600 hover:bg-green-500' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            {isEditing ? <Play size={18} /> : <Edit3 size={18} />}
            <span className="hidden sm:inline">{isEditing ? 'Start Game' : 'Custom Match'}</span>
          </button>
          <button 
            onClick={undoMove}
            disabled={moveHistory.length === 0 || isGameOver || isEditing}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 font-bold"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Undo</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTabletopMode(prev => !prev)}
            className={`p-2 rounded-full transition-colors ${tabletopMode ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}
            title="Toggle Tabletop Mode"
          >
            {tabletopMode ? <Users size={20} /> : <User size={20} />}
          </button>
          <button 
            onClick={() => setRotation(prev => (prev + 180) % 360)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
            title="Flip Board 180°"
          >
            <FlipVertical size={20} />
          </button>
          <button 
            onClick={() => rotateBoard('ccw')}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={() => rotateBoard('cw')}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
          >
            <RotateCw size={20} />
          </button>
          <button 
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-2 rounded-full transition-colors ${soundEnabled ? 'bg-emerald-700/40 text-emerald-300 hover:bg-emerald-700/60' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
            title="Enter Fullscreen"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
      )}

      {/* Floating Exit Fullscreen Button */}
      {isFullscreen && (
        <button 
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-50 p-3 bg-zinc-800/50 hover:bg-zinc-700/80 backdrop-blur-md rounded-full transition-all text-zinc-300 hover:text-white"
          title="Exit Fullscreen"
        >
          <Minimize size={24} />
        </button>
      )}

      {/* Main Rotating Container */}
      <motion.div 
        animate={{ rotate: rotation }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={`relative flex flex-col items-center justify-center gap-4 w-full h-full ${isFullscreen ? 'max-w-[min(85vh,95vw)] max-h-[100dvh] mt-0' : 'max-w-[min(65vh,90vw)] max-h-[min(90vh,90vw)] mt-16'}`}
      >
        {/* Black Player Area */}
        {!isEditing && (
          <PlayerArea 
            color="b" 
            timer={timers.b} 
            isTurn={turn === 'b'} 
            inCheck={isCheck && turn === 'b' && !isGameOver}
            onResign={() => handleResign('b')}
            onDrawOffer={() => handleDrawOffer('b')}
            drawOfferedByOpponent={drawOffer === 'w'}
            onDrawAcceptClick={() => setShowDrawConfirm('b')}
            rotated={true}
          />
        )}

        {/* Board Area */}
        <div className="relative w-full aspect-square bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border-8 border-zinc-800">
          <div className="chess-board-grid w-full h-full">
            {RANKS.map((rank, rIdx) => (
              FILES.map((file, fIdx) => {
                const square = `${file}${rank}`;
                const isLight = (rIdx + fIdx) % 2 === 0;
                const piece = board[rIdx][fIdx];
                const isSelected = selectedSquare === square;
                const isValidMove = validMoves.includes(square);
                const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);

                return (
                  <div 
                    key={square}
                    onClick={() => handleSquareClick(square)}
                    className={`
                      relative flex items-center justify-center cursor-pointer touch-none
                      ${isLight ? 'square-light' : 'square-dark'}
                      ${isSelected ? 'ring-4 ring-inset ring-blue-400 z-10' : ''}
                    `}
                  >
                    {/* Last Move Highlight */}
                    {isLastMove && <div className="absolute inset-0 square-last-move pointer-events-none" />}
                    
                    {/* Valid Move Indicator */}
                    {isValidMove && (
                      <div className={`
                        absolute w-4 h-4 rounded-full pointer-events-none
                        ${piece ? 'border-4 border-black/20 w-full h-full rounded-none' : 'bg-black/10'}
                      `} />
                    )}

                    {/* Piece */}
                    <AnimatePresence mode="popLayout">
                      {piece && (
                        <motion.img
                          key={`${square}-${piece.type}-${piece.color}`}
                          initial={{ scale: 0.5, opacity: 0, rotate: 0 }}
                          animate={{ 
                            scale: 1, 
                            opacity: 1,
                            rotate: tabletopMode ? (piece.color === 'b' ? 180 : 0) : 0
                          }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          src={PIECES[`${piece.color}${piece.type}`]}
                          alt={`${piece.color}${piece.type}`}
                          className="w-[85%] h-[85%] z-20 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </AnimatePresence>

                    {/* Coordinates (only on edges) */}
                    {fIdx === 0 && (
                      <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold ${isLight ? 'text-zinc-400' : 'text-zinc-200'}`}>
                        {rank}
                      </span>
                    )}
                    {rIdx === 7 && (
                      <span className={`absolute bottom-0.5 right-0.5 text-[10px] font-bold ${isLight ? 'text-zinc-400' : 'text-zinc-200'}`}>
                        {file}
                      </span>
                    )}
                  </div>
                );
              })
            ))}
          </div>

          {/* Promotion Overlay */}
          <AnimatePresence>
            {showPromotion && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <div className="bg-zinc-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                  <h2 className="text-lg font-bold">Promote to:</h2>
                  <div className="flex gap-4">
                    {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => handlePromotion(type)}
                        className="p-2 hover:bg-zinc-700 rounded-xl transition-all hover:scale-110"
                      >
                        <img 
                          src={PIECES[`${turn}${type}`]} 
                          alt={type} 
                          className="w-16 h-16"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over Overlay */}
          <AnimatePresence>
            {isGameOver && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
              >
                <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-6 max-w-sm">
                  <div className="p-4 bg-yellow-500/20 rounded-full">
                    <Trophy className="text-yellow-500 w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Game Over</h2>
                    <p className="text-zinc-400 text-lg">
                      {customGameOver ? (
                        customGameOver
                      ) : game.isCheckmate() ? (
                        <>Checkmate! <span className="text-white font-bold">{turn === 'w' ? 'Black' : 'White'} wins.</span></>
                      ) : game.isDraw() ? (
                        "It's a draw!"
                      ) : (
                        "Game ended."
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={exportPGN}
                      className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      PGN
                    </button>
                    <button 
                      onClick={resetGame}
                      className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={20} />
                      Play Again
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draw Confirm Overlay */}
          <AnimatePresence>
            {showDrawConfirm && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm ${showDrawConfirm === 'b' ? 'rotate-180' : ''}`}
              >
                <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-6 max-w-sm">
                  <h2 className="text-2xl font-bold text-white">Do you agree on a draw?</h2>
                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => {
                        setCustomGameOver("Draw by agreement.");
                        setTimerActive(false);
                        setShowDrawConfirm(null);
                        setDrawOffer(null);
                      }}
                      className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => setShowDrawConfirm(null)}
                      className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all"
                    >
                      No
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* White Player Area */}
        {!isEditing && (
          <PlayerArea 
            color="w" 
            timer={timers.w} 
            isTurn={turn === 'w'} 
            inCheck={isCheck && turn === 'w' && !isGameOver}
            onResign={() => handleResign('w')}
            onDrawOffer={() => handleDrawOffer('w')}
            drawOfferedByOpponent={drawOffer === 'b'}
            onDrawAcceptClick={() => setShowDrawConfirm('w')}
            rotated={false}
          />
        )}

        {/* Edit Palette */}
        {isEditing && (
          <EditPalette 
            editTool={editTool} 
            setEditTool={setEditTool} 
            turn={turn}
            setTurn={setTurnForEdit}
            clearBoard={clearBoard}
            resetBoard={resetBoard}
            pieces={['k', 'q', 'r', 'b', 'n', 'p']}
            PIECES={PIECES}
          />
        )}

      </motion.div>

      {/* Settings Overlay (Global, not rotated) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 max-w-sm w-full relative">
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="text-blue-400" />
                Time Control
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                {[2, 3, 5, 10, 20].map(mins => (
                  <button
                    key={mins}
                    onClick={() => applyTimerSettings(mins)}
                    className={`py-3 rounded-xl font-bold transition-all ${timerMinutes === mins ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                  >
                    {mins} min
                  </button>
                ))}
                <button
                  onClick={() => applyTimerSettings(null)}
                  className={`py-3 rounded-xl font-bold transition-all ${timerMinutes === null ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                >
                  Unlimited
                </button>
              </div>
              
              <p className="text-xs text-zinc-500 text-center mt-2">
                Changing the timer will reset the current game.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
