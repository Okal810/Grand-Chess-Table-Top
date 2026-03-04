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
  User
} from 'lucide-react';

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
  const [game, setGame] = useState(new Chess());
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showPromotion, setShowPromotion] = useState<{ from: string; to: string } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [tabletopMode, setTabletopMode] = useState(true);

  // Sync game state
  const board = useMemo(() => game.board(), [game]);
  const turn = game.turn();
  const isGameOver = game.isGameOver();
  const isCheck = game.inCheck();

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setMoveHistory([]);
    setLastMove(null);
    setShowPromotion(null);
  };

  const handleSquareClick = (square: string) => {
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
          const newGame = new Chess();
          newGame.loadPgn(game.pgn());
          setGame(newGame);
          setLastMove({ from: move.from, to: move.to });
          setSelectedSquare(null);
          setMoveHistory(prev => [...prev, move.san]);
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
        const newGame = new Chess();
        newGame.loadPgn(game.pgn());
        setGame(newGame);
        setLastMove({ from: move.from, to: move.to });
        setMoveHistory(prev => [...prev, move.san]);
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
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    const undone = gameCopy.undo();
    if (!undone) return; // Nothing to undo

    setGame(gameCopy);
    setMoveHistory(prev => prev.slice(0, -1));

    // Restore lastMove from the move before the undone one
    const history = gameCopy.history({ verbose: true });
    if (history.length > 0) {
      const prevMove = history[history.length - 1];
      setLastMove({ from: prevMove.from, to: prevMove.to });
    } else {
      setLastMove(null);
    }
    setSelectedSquare(null);
  };

  // Get valid moves for highlighting
  const validMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare as any, verbose: true }).map(m => m.to);
  }, [selectedSquare, game]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 md:p-8 select-none overflow-hidden">
      {/* Header / Status */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${turn === 'w' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-zinc-800 border border-zinc-600'}`} />
          <h1 className="text-xl font-semibold tracking-tight">
            {isGameOver ? 'Game Over' : `${turn === 'w' ? 'White' : 'Black'}'s Turn`}
            {isCheck && !isGameOver && <span className="ml-2 text-red-500 animate-pulse">(Check!)</span>}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTabletopMode(prev => !prev)}
            className={`p-2 rounded-full transition-colors ${tabletopMode ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
            title={tabletopMode ? "Tabletop Mode (Pieces face each other)" : "Standard Mode (All pieces face same way)"}
          >
            {tabletopMode ? <Users size={20} /> : <User size={20} />}
          </button>
          <button
            onClick={() => setRotation(prev => (prev + 180) % 360)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            title="Flip Board (180°)"
          >
            <FlipVertical size={20} />
          </button>
          <button
            onClick={() => rotateBoard('ccw')}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            title="Rotate Counter-Clockwise"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => rotateBoard('cw')}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            title="Rotate Clockwise"
          >
            <RotateCw size={20} />
          </button>
          <button
            onClick={resetGame}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-red-400"
            title="Reset Game"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="relative flex-1 flex items-center justify-center w-full max-h-[80vh] aspect-square">
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative w-full h-full max-w-[min(80vh,80vw)] aspect-square bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border-8 border-zinc-800"
        >
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
                      {game.isCheckmate() ? (
                        <>Checkmate! <span className="text-white font-bold">{turn === 'w' ? 'Black' : 'White'} wins.</span></>
                      ) : game.isDraw() ? (
                        "It's a draw!"
                      ) : (
                        "Game ended."
                      )}
                    </p>
                  </div>
                  <button
                    onClick={resetGame}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    Play Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer Controls */}
      <div className="w-full max-w-4xl mt-6 flex items-center justify-between px-4">
        <div className="flex items-center gap-4 text-zinc-500 text-sm font-mono">
          <div className="flex flex-col">
            <span className="uppercase text-[10px] tracking-widest opacity-50">Moves</span>
            <span className="text-zinc-300">{moveHistory.length > 0 ? moveHistory.length : '0'}</span>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="flex flex-col">
            <span className="uppercase text-[10px] tracking-widest opacity-50">State</span>
            <span className={isCheck ? 'text-red-400' : 'text-zinc-300'}>
              {isCheck ? 'CHECK' : 'NORMAL'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={undoMove}
            disabled={moveHistory.length === 0 || isGameOver}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 font-semibold"
          >
            <ChevronLeft size={20} />
            Undo
          </button>
        </div>
      </div>

      {/* Hint for Tabletop Mode */}
      <div className="mt-4 text-zinc-600 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
        <AlertCircle size={12} />
        Optimized for Tablet & Tabletop Mode
      </div>
    </div>
  );
}
