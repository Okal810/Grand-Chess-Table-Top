/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  VolumeX,
  Skull,
  Ghost,
  Dices,
  WandSparkles,
  Sword,
  Flame,
  Shuffle,
  Sparkles
} from 'lucide-react';
import pinnedMemeImg from './assets/pinned-meme-placeholder.png';

// --- Subcomponents ---
const PlayerArea = ({ color, timer, isTurn, checkStatus, onResign, onDrawOffer, drawOfferedByOpponent, onDrawAcceptClick, rotated }: any) => {
  return (
    <div className={`flex items-center justify-between w-full p-4 bg-zinc-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-zinc-700 ${rotated ? 'rotate-180' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`text-4xl font-mono font-bold ${isTurn ? 'text-white' : 'text-zinc-500'}`}>
          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
        {isTurn && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />}
        {checkStatus === 'check' && (
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
type Curse = 'fireball' | 'hex' | 'swap' | 'excalibur';

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

// --- Cursed Chess Mode ---

const HALLUCINATION_LINES = [
  "He has no idea, or has he?",
  "Somewhere, a grandmaster weeps quietly.",
  "The engine evaluation just left the chat.",
  "Studies show 9 out of 10 long thinks end in a blunder anyway.",
  "The pieces are starting to judge you.",
  "Reader, he does not, in fact, see it.",
  "A bead of sweat has been forming for several minutes now.",
  "Somewhere a clock is still ticking. This is not it.",
  "He is not stalling. He is 'calculating'.",
];

const WHEEL_SEGMENTS: { type: PieceSymbol; label: string }[] = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
  { type: 'p', label: 'Pawn (again!)' },
];

const WHEEL_COLORS = ['#7c3aed', '#dc2626', '#0891b2', '#ca8a04', '#16a34a'];

const CURSE_BOOK: { id: Curse; label: string; cost: number; icon: React.ReactNode; help: string }[] = [
  { id: 'fireball', label: 'Fireball', cost: 3, icon: <Flame size={18} />, help: 'Delete one enemy piece. Kings are fireproof (lame).' },
  { id: 'hex', label: 'Pawnify', cost: 2, icon: <WandSparkles size={18} />, help: 'Turn an enemy piece into a deeply disappointed pawn.' },
  { id: 'swap', label: 'Quantum Swap', cost: 2, icon: <Shuffle size={18} />, help: 'Choose two of your pieces and swap their atoms.' },
  { id: 'excalibur', label: 'Excalibur', cost: 3, icon: <Sword size={18} />, help: 'Promote any friendly non-king piece to a queen. Balanced.' },
];

function kingSquareOf(board: ReturnType<Chess['board']>, color: Color): Square | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        return `${FILES[c]}${RANKS[r]}`;
      }
    }
  }
  return null;
}

const RAY_DIRECTIONS: { dr: number; dc: number; kind: 'line' | 'diag' }[] = [
  { dr: -1, dc: 0, kind: 'line' }, { dr: 1, dc: 0, kind: 'line' },
  { dr: 0, dc: -1, kind: 'line' }, { dr: 0, dc: 1, kind: 'line' },
  { dr: -1, dc: -1, kind: 'diag' }, { dr: -1, dc: 1, kind: 'diag' },
  { dr: 1, dc: -1, kind: 'diag' }, { dr: 1, dc: 1, kind: 'diag' },
];

function computePinnedSquares(board: ReturnType<Chess['board']>): Set<string> {
  const pinned = new Set<string>();
  for (const kingColor of ['w', 'b'] as Color[]) {
    const kingSquare = kingSquareOf(board, kingColor);
    if (!kingSquare) continue;
    const kingC = FILES.indexOf(kingSquare[0]);
    const kingR = RANKS.indexOf(kingSquare[1]);

    for (const { dr, dc, kind } of RAY_DIRECTIONS) {
      let r = kingR + dr;
      let c = kingC + dc;
      let blocker: string | null = null;

      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const piece = board[r][c];
        if (piece) {
          if (piece.color === kingColor) {
            if (blocker !== null) break; // a second friendly piece shields the first -- no pin
            blocker = `${FILES[c]}${RANKS[r]}`;
          } else {
            if (blocker !== null) {
              const attacksLine = kind === 'line' && (piece.type === 'r' || piece.type === 'q');
              const attacksDiag = kind === 'diag' && (piece.type === 'b' || piece.type === 'q');
              if (attacksLine || attacksDiag) pinned.add(blocker);
            }
            break; // enemy piece caps the ray either way
          }
        }
        r += dr;
        c += dc;
      }
    }
  }
  return pinned;
}

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

  // --- Cursed Chess Mode state ---
  const [cursedMode, setCursedMode] = useState(false);
  const [rookSacrifice, setRookSacrifice] = useState<{ id: number; color: Color } | null>(null);
  const [enPassantFlash, setEnPassantFlash] = useState(0);
  const [queenLostToast, setQueenLostToast] = useState(0);
  const [hallucination, setHallucination] = useState<string | null>(null);
  const [bongcloud, setBongcloud] = useState<{ w: boolean; b: boolean }>({ w: false, b: false });
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelResult, setWheelResult] = useState<PieceSymbol | null>(null);
  const [mana, setMana] = useState<{ w: number; b: number }>({ w: 3, b: 3 });
  const [activeCurse, setActiveCurse] = useState<Curse | null>(null);
  const [curseFirstSquare, setCurseFirstSquare] = useState<string | null>(null);
  const [curseToast, setCurseToast] = useState<string | null>(null);
  const [spellUsedAt, setSpellUsedAt] = useState<string | null>(null);

  // Pin reaction meme (standard + cursed chess): no persistent badge -- only
  // trying to move the same pinned piece a second time in a row calls it out.
  const [pinMemeId, setPinMemeId] = useState(0);
  const pinAttemptsRef = useRef<Map<string, number>>(new Map());

  const lastProcessedMoveCountRef = useRef(0);
  const lastMoveTimeRef = useRef(Date.now());
  const bongcloudStartRef = useRef<number | null>(null);

  // Sync game state
  const board = useMemo(() => game.board(), [game, trigger]);
  const turn = game.turn();
  const isGameOver = !isEditing && (customGameOver !== null || (!cursedMode && game.isGameOver()));
  // No check indicator in cursed mode by design -- a king in danger gives no
  // warning at all, which is the whole point of the mode.
  const isCheck = !cursedMode && game.inCheck();
  const audioContextRef = React.useRef<AudioContext | null>(null);

  // Runs `fn` with king-safety legality checks disabled, so chess.js will generate
  // and accept moves that leave a king in (or walk it into) check -- including
  // capturing it outright. chess.js's `private` members are compile-time only, so
  // this reaches the real prototype method at runtime.
  const withCursedRules = useCallback(<T,>(fn: () => T): T => {
    const anyGame = game as any;
    const hadOwn = Object.prototype.hasOwnProperty.call(anyGame, '_isKingAttacked');
    const own = anyGame._isKingAttacked;
    anyGame._isKingAttacked = () => false;
    try {
      return fn();
    } finally {
      if (hadOwn) anyGame._isKingAttacked = own;
      else delete anyGame._isKingAttacked;
    }
  }, [game]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: 'move' | 'capture' | 'check' | 'gameOver' | 'enPassant' | 'rookSacrifice' | 'queenLost' | 'bongcloud') => {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const beep = (freq: number, duration: number, gain = 0.04, delay = 0, type2: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type2;
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
    if (type === 'enPassant') {
      // A short, jarring "you weren't supposed to see that" stinger.
      beep(180, 0.05, 0.07, 0, 'sawtooth');
      beep(1400, 0.04, 0.05, 0.03, 'square');
      beep(90, 0.18, 0.06, 0.05, 'sawtooth');
    }
    if (type === 'rookSacrifice') {
      beep(110, 0.35, 0.07, 0, 'sawtooth');
      beep(98, 0.4, 0.06, 0.05, 'sawtooth');
      beep(80, 0.5, 0.06, 0.12, 'square');
    }
    if (type === 'queenLost') {
      // Womp womp womp - descending muted trumpet.
      beep(233, 0.22, 0.06, 0, 'sawtooth');
      beep(220, 0.22, 0.06, 0.24, 'sawtooth');
      beep(207, 0.22, 0.06, 0.48, 'sawtooth');
      beep(196, 0.5, 0.07, 0.72, 'sawtooth');
    }
    if (type === 'bongcloud') {
      beep(392, 0.15, 0.06, 0, 'sawtooth');
      beep(494, 0.15, 0.06, 0.14, 'sawtooth');
      beep(587, 0.3, 0.07, 0.28, 'sawtooth');
    }
  }, [getAudioContext, soundEnabled]);


  useEffect(() => {
    if (isGameOver) playSound('gameOver');
  }, [isGameOver, playSound]);

  // --- Cursed Chess Mode effects ---

  // King-capture win condition + draw detection, standing in for checkmate/stalemate
  // which no longer apply once check itself has been abolished.
  useEffect(() => {
    if (!cursedMode || isEditing || customGameOver !== null) return;
    let wKing = false, bKing = false;
    for (const row of board) {
      for (const sq of row) {
        if (sq?.type === 'k') {
          if (sq.color === 'w') wKing = true; else bKing = true;
        }
      }
    }
    if (!wKing) {
      setCustomGameOver('👑💀 Regicide! Black captured the King. Black wins.');
      setTimerActive(false);
    } else if (!bKing) {
      setCustomGameOver('👑💀 Regicide! White captured the King. White wins.');
      setTimerActive(false);
    } else if (game.isInsufficientMaterial()) {
      setCustomGameOver("Draw by insufficient material.");
      setTimerActive(false);
    } else if (game.isThreefoldRepetition()) {
      setCustomGameOver("Draw by threefold repetition.");
      setTimerActive(false);
    } else if (game.isDrawByFiftyMoves()) {
      setCustomGameOver("Draw by the fifty-move rule.");
      setTimerActive(false);
    }
  }, [trigger, cursedMode, isEditing, customGameOver, board, game]);

  // Rook sacrifice shake, en passant jumpscare, queen-lost trumpet.
  // Reacts only to genuinely new moves (guarded by a processed-count ref) so
  // Undo never replays an effect for a move it's rewinding past.
  useEffect(() => {
    if (!cursedMode || isEditing) return;
    const hist = game.history({ verbose: true }) as Move[];
    if (hist.length > lastProcessedMoveCountRef.current) {
      const last = hist[hist.length - 1];
      // Moving recharges the player's cursed battery. Casting remains limited
      // to one spell per turn, regardless of available mana.
      setMana(prev => ({ ...prev, [last.color]: Math.min(5, prev[last.color] + 1) }));
      if (last.captured === 'r') {
        setRookSacrifice({ id: Date.now(), color: last.color });
        playSound('rookSacrifice');
      }
      if (last.isEnPassant()) {
        setEnPassantFlash(id => id + 1);
        playSound('enPassant');
      }
      if (last.captured === 'q') {
        setQueenLostToast(id => id + 1);
        playSound('queenLost');
      }
    }
    lastProcessedMoveCountRef.current = hist.length;
  }, [trigger, cursedMode, isEditing, game, playSound]);

  // Bongcloud detection: 1.e4 Ke2 for White, 1...e5 2...Ke7 for Black.
  useEffect(() => {
    if (!cursedMode || isEditing) return;
    const hist = game.history() as string[];
    const clean = (s?: string) => (s ?? '').replace(/[+#]$/, '');
    const white = hist.filter((_, i) => i % 2 === 0).map(clean);
    const black = hist.filter((_, i) => i % 2 === 1).map(clean);
    if (!bongcloud.w && white[0] === 'e4' && white[1] === 'Ke2') {
      setBongcloud(prev => ({ ...prev, w: true }));
      if (bongcloudStartRef.current === null) bongcloudStartRef.current = Date.now();
      playSound('bongcloud');
    }
    if (!bongcloud.b && black[0] === 'e5' && black[1] === 'Ke7') {
      setBongcloud(prev => ({ ...prev, b: true }));
      if (bongcloudStartRef.current === null) bongcloudStartRef.current = Date.now();
      playSound('bongcloud');
    }
  }, [trigger, cursedMode, isEditing, game, bongcloud.w, bongcloud.b, playSound]);

  // Long-think hallucinations: reset the thinking clock on every move/edit,
  // then surface cycling flavor text once a turn drags past 60s.
  useEffect(() => {
    lastMoveTimeRef.current = Date.now();
    setHallucination(null);
  }, [trigger]);

  // Give every pinned piece a fresh "first attempt" after each move/edit.
  useEffect(() => {
    pinAttemptsRef.current.clear();
  }, [trigger]);

  useEffect(() => {
    if (!cursedMode || isGameOver || isEditing) {
      setHallucination(null);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastMoveTimeRef.current;
      if (elapsed > 60000) {
        const idx = Math.floor(elapsed / 9000) % HALLUCINATION_LINES.length;
        setHallucination(HALLUCINATION_LINES[idx]);
      } else {
        setHallucination(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cursedMode, isGameOver, isEditing]);

  // Bongcloud boss music: a looping heroic arpeggio, capped at 30s total from
  // the moment the buff first triggered (not restarted by re-renders).
  useEffect(() => {
    const active = (bongcloud.w || bongcloud.b) && soundEnabled && !isGameOver;
    if (!active || bongcloudStartRef.current === null) return;
    const remaining = 30000 - (Date.now() - bongcloudStartRef.current);
    if (remaining <= 0) return;

    const playRiff = () => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [220, 277.18, 329.63, 440];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const vol = ctx.createGain();
        osc.type = 'sawtooth';
        const t = now + i * 0.18;
        osc.frequency.setValueAtTime(freq, t);
        vol.gain.setValueAtTime(0.0001, t);
        vol.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
        vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        osc.connect(vol);
        vol.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.17);
      });
    };

    playRiff();
    const interval = setInterval(playRiff, 900);
    const stopTimeout = setTimeout(() => clearInterval(interval), remaining);
    return () => {
      clearInterval(interval);
      clearTimeout(stopTimeout);
    };
  }, [bongcloud.w, bongcloud.b, soundEnabled, isGameOver, getAudioContext]);

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
    setRookSacrifice(null);
    setBongcloud({ w: false, b: false });
    bongcloudStartRef.current = null;
    setHallucination(null);
    setWheelSpinning(false);
    setWheelResult(null);
    setMana({ w: 3, b: 3 });
    setActiveCurse(null);
    setCurseFirstSquare(null);
    setCurseToast(null);
    setSpellUsedAt(null);
    lastProcessedMoveCountRef.current = 0;
    lastMoveTimeRef.current = Date.now();
    forceUpdate();
  };

  const toggleCursedMode = () => {
    setCursedMode(prev => !prev);
    resetGame();
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
    try {
      game.load(tokens.join(' '));
    } catch (e) {
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

    // Cursed Extreme spell targeting deliberately mutates the board outside of
    // normal chess rules. A spell is a bonus action, but only one may be cast
    // during a turn so the tabletop does not become a button-mashing contest.
    if (cursedMode && activeCurse) {
      const spell = CURSE_BOOK.find(item => item.id === activeCurse)!;
      const piece = game.get(square as any);
      const fail = (message: string) => setCurseToast(message);
      const finish = (message: string) => {
        setMana(prev => ({ ...prev, [turn]: prev[turn] - spell.cost }));
        setSpellUsedAt(`${turn}-${game.history().length}`);
        setActiveCurse(null);
        setCurseFirstSquare(null);
        setSelectedSquare(null);
        setCurseToast(message);
        forceUpdate();
      };

      if (activeCurse === 'swap') {
        if (!piece || piece.color !== turn) return fail('🌀 The quantum warranty only covers your own pieces.');
        if (!curseFirstSquare) {
          setCurseFirstSquare(square);
          return fail('🌀 First atom locked. Pick another friendly piece.');
        }
        if (curseFirstSquare === square) return fail('🌀 Swapping a piece with itself achieves absolutely nothing.');
        const firstPiece = game.get(curseFirstSquare as any)!;
        game.remove(curseFirstSquare as any);
        game.remove(square as any);
        game.put(piece as any, curseFirstSquare as any);
        game.put(firstPiece as any, square as any);
        finish('🌀 QUANTUM ENTANGLEMENT! The arbiter has resigned.');
        return;
      }

      if (!piece) return fail('The void cannot be cursed. It already has tenure.');
      if (piece.type === 'k') return fail('👑 Royal plot armor blocked the spell. Try violence the old-fashioned way.');
      if (activeCurse === 'fireball') {
        if (piece.color === turn) return fail('🔥 Friendly fire is disabled by your mom.');
        game.remove(square as any);
        finish('🔥 FIREBALL! That piece has been sent to the shadow realm.');
      } else if (activeCurse === 'hex') {
        if (piece.color === turn) return fail('🐸 You may only pawnify an enemy. Have standards.');
        game.remove(square as any);
        game.put({ type: 'p', color: piece.color } as any, square as any);
        finish('🐸 Career update: that piece is now an unpaid pawn.');
      } else if (activeCurse === 'excalibur') {
        if (piece.color !== turn) return fail('⚔️ Excalibur refuses to buff the enemy. Surprisingly sensible.');
        game.remove(square as any);
        game.put({ type: 'q', color: piece.color } as any, square as any);
        finish('⚔️ EXCALIBUR! We have a queen surplus and zero regrets.');
      }
      return;
    }

    // If a square is already selected, try to move
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (pinnedSquares.has(selectedSquare)) {
        const attempts = (pinAttemptsRef.current.get(selectedSquare) ?? 0) + 1;
        pinAttemptsRef.current.set(selectedSquare, attempts);
        if (attempts >= 2) setPinMemeId(id => id + 1);
      }

      const moveAttempt = {
        from: selectedSquare,
        to: square,
        promotion: 'q', // Default to queen for now, handle properly if needed
      };

      try {
        // Check if move is valid (including promotion check)
        const moves = cursedMode
          ? withCursedRules(() => game.moves({ square: selectedSquare as any, verbose: true }))
          : game.moves({ square: selectedSquare as any, verbose: true });
        const isPromotion = moves.some(m => m.to === square && m.flags.includes('p'));

        if (isPromotion) {
          setShowPromotion({ from: selectedSquare, to: square });
          return;
        }

        const move = cursedMode ? withCursedRules(() => game.move(moveAttempt)) : game.move(moveAttempt);
        if (move) {
          setLastMove({ from: move.from, to: move.to });
          setSelectedSquare(null);
          setMoveHistory(prev => [...prev, move.san]);
          setDrawOffer(null); // Reset draw offer on move
          playSound(move.captured ? 'capture' : 'move');
          if (!cursedMode && game.inCheck()) playSound('check');
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

    // chess.js has no concept of "promoting to a pawn" -- the wheel's joke
    // outcome is applied by promoting to a queen at the engine level, then
    // immediately swapping the piece back to a pawn on the board.
    const stayPawn = pieceType === 'p';
    const engineType = stayPawn ? 'q' : pieceType;

    try {
      const moveFn = () => game.move({
        from: showPromotion.from,
        to: showPromotion.to,
        promotion: engineType,
      });
      const move = cursedMode ? withCursedRules(moveFn) : moveFn();

      if (move) {
        let san = move.san;
        if (stayPawn) {
          const promoted = game.get(showPromotion.to as any)!;
          game.remove(showPromotion.to as any);
          game.put({ type: 'p', color: promoted.color }, showPromotion.to as any);
          san = san.replace('=Q', '=P');
        }
        setLastMove({ from: move.from, to: move.to });
        setMoveHistory(prev => [...prev, san]);
        setDrawOffer(null);
        playSound(move.captured ? 'capture' : 'move');
        if (!cursedMode && game.inCheck()) playSound('check');
        if (!timerActive && timerMinutes !== null) setTimerActive(true);
        forceUpdate();
      }
    } catch (e) {
      console.error("Promotion failed", e);
    }
    setShowPromotion(null);
    setSelectedSquare(null);
    setWheelSpinning(false);
    setWheelResult(null);
  };

  const spinPromotionWheel = () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);
    setWheelResult(null);
    const resultIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const jitter = (Math.random() - 0.5) * (segmentAngle * 0.6);
    const spins = 5 + Math.floor(Math.random() * 3);
    setWheelRotation(prev => {
      const currentNormalized = ((prev % 360) + 360) % 360;
      // Land the chosen segment's center under the top pointer, ignoring the
      // wheel's current rest angle, then add the extra full spins on top.
      const targetNormalized = (360 - resultIndex * segmentAngle) % 360;
      const delta = ((targetNormalized - currentNormalized) + 360) % 360;
      return prev + delta + spins * 360 + jitter;
    });
    setTimeout(() => {
      const result = WHEEL_SEGMENTS[resultIndex].type;
      setWheelResult(result);
      setTimeout(() => handlePromotion(result), 700);
    }, 2600);
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
    const moves = cursedMode
      ? withCursedRules(() => game.moves({ square: selectedSquare as any, verbose: true }))
      : game.moves({ square: selectedSquare as any, verbose: true });
    return moves.map(m => m.to);
  }, [selectedSquare, game, cursedMode, withCursedRules]);

  // Pin detection (feature works in both standard and cursed chess): ray-cast
  // out from each king along the 8 directions and flag the first own piece hit
  // if a same-line enemy slider (rook/queen on files/ranks, bishop/queen on
  // diagonals) stands beyond it with nothing else in between.
  const pinnedSquares = useMemo(() => {
    if (isEditing) return new Set<string>(); // board may be mid-setup (missing a king, etc.)
    return computePinnedSquares(board);
  }, [board, isEditing]);

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
            onClick={toggleCursedMode}
            className={`p-2 rounded-full transition-colors ${cursedMode ? 'bg-purple-700/50 text-purple-300 shadow-[0_0_10px_rgba(147,51,234,0.6)] animate-pulse' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            title={cursedMode ? 'Cursed Chess Mode: ON (click to disable)' : 'Enable Cursed Chess Mode'}
          >
            <Skull size={20} />
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
            checkStatus={isGameOver ? null : isCheck && turn === 'b' ? 'check' : null}
            onResign={() => handleResign('b')}
            onDrawOffer={() => handleDrawOffer('b')}
            drawOfferedByOpponent={drawOffer === 'w'}
            onDrawAcceptClick={() => setShowDrawConfirm('b')}
            rotated={true}
          />
        )}

        {/* Board Area */}
        <motion.div
          key={rookSacrifice?.id ?? 'still'}
          animate={rookSacrifice ? { x: [0, -14, 14, -14, 14, -8, 8, -4, 4, 0], y: [0, 6, -6, 4, -4, 2, -2, 0, 0, 0] } : { x: 0, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          className="relative w-full aspect-square bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border-8 border-zinc-800"
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
                // The aura only shows while the king is still parked on its
                // "second rank" (e2 for White, e7 for Black) -- step off it
                // and the buff goes away, even though bongcloud[] stays true.
                const hasBongcloudAura = !!piece && piece.type === 'k' && bongcloud[piece.color]
                  && rank === (piece.color === 'w' ? '2' : '7');

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

                    {/* Bongcloud King Aura */}
                    {hasBongcloudAura && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none z-10 rounded-full"
                        style={{ boxShadow: '0 0 18px 8px rgba(250,204,21,0.55)' }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      />
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
                          className={`w-[85%] h-[85%] z-20 pointer-events-none ${hasBongcloudAura ? 'drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]' : ''}`}
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </AnimatePresence>

                    {/* Bongcloud Sunglasses */}
                    {hasBongcloudAura && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none text-xl select-none">
                        😎
                      </div>
                    )}

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
            {showPromotion && !cursedMode && (
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
            {showPromotion && cursedMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              >
                <div className="bg-zinc-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-purple-300">
                    <Dices size={20} /> Wheel of Promotion Fate
                  </h2>
                  <div className="relative w-56 h-56">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-yellow-400 drop-shadow" />
                    <motion.div
                      className="relative w-full h-full rounded-full border-4 border-zinc-700 shadow-[0_0_30px_rgba(0,0,0,0.6)]"
                      style={{
                        background: `conic-gradient(from ${-180 / WHEEL_SEGMENTS.length}deg, ${WHEEL_SEGMENTS.map((_, i) => `${WHEEL_COLORS[i]} ${i * (360 / WHEEL_SEGMENTS.length)}deg ${(i + 1) * (360 / WHEEL_SEGMENTS.length)}deg`).join(', ')})`
                      }}
                      animate={{ rotate: wheelRotation }}
                      transition={{ duration: 2.5, ease: [0.15, 0, 0.2, 1] }}
                    >
                      {WHEEL_SEGMENTS.map((seg, i) => {
                        const segmentAngle = 360 / WHEEL_SEGMENTS.length;
                        const angleRad = (i * segmentAngle * Math.PI) / 180;
                        const radius = 36;
                        const x = 50 + radius * Math.sin(angleRad);
                        const y = 50 - radius * Math.cos(angleRad);
                        return (
                          <div
                            key={seg.type}
                            className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={{ left: `${x}%`, top: `${y}%` }}
                          >
                            <img src={PIECES[`${turn}${seg.type}`]} alt={seg.label} className="w-8 h-8 drop-shadow-md" referrerPolicy="no-referrer" />
                          </div>
                        );
                      })}
                      <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-600" />
                    </motion.div>
                  </div>
                  {wheelResult ? (
                    <p className="text-lg font-extrabold text-yellow-400 animate-pulse">
                      🎉 {WHEEL_SEGMENTS.find(s => s.type === wheelResult)?.label}!
                    </p>
                  ) : (
                    <button
                      onClick={spinPromotionWheel}
                      disabled={wheelSpinning}
                      className="px-6 py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Dices size={20} />
                      {wheelSpinning ? 'Spinning...' : 'Spin the Wheel!'}
                    </button>
                  )}
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
        </motion.div>

        {/* White Player Area */}
        {!isEditing && (
          <PlayerArea 
            color="w" 
            timer={timers.w} 
            isTurn={turn === 'w'} 
            checkStatus={isGameOver ? null : isCheck && turn === 'w' ? 'check' : null}
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

      {/* Cursed Extreme spell book — intentionally global so it stays readable
          while the physical board is rotated for tabletop play. */}
      <AnimatePresence>
        {cursedMode && !isEditing && !isGameOver && (
          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="cursed-spellbook absolute right-3 top-20 z-[65] w-52 rounded-2xl border border-fuchsia-500/60 bg-zinc-950/90 p-3 shadow-[0_0_35px_rgba(192,38,211,0.3)] backdrop-blur-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-fuchsia-300"><Sparkles size={15} /> Extreme</span>
              <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-xs font-bold text-cyan-300">🔮 {mana[turn]}/5</span>
            </div>
            <p className="mb-2 text-[10px] leading-tight text-zinc-500">{turn === 'w' ? 'White' : 'Black'} may cast one illegal bonus action this turn.</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CURSE_BOOK.map(spell => {
                const used = spellUsedAt === `${turn}-${game.history().length}`;
                const disabled = mana[turn] < spell.cost || used;
                return (
                  <button
                    key={spell.id}
                    disabled={disabled}
                    title={spell.help}
                    onClick={() => {
                      setActiveCurse(current => current === spell.id ? null : spell.id);
                      setCurseFirstSquare(null);
                      setCurseToast(activeCurse === spell.id ? null : `Choose a target: ${spell.help}`);
                    }}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-xl border p-1 text-[10px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-25 ${activeCurse === spell.id ? 'border-fuchsia-300 bg-fuchsia-600 text-white animate-pulse' : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-fuchsia-500 hover:bg-fuchsia-950'}`}
                  >
                    {spell.icon}<span>{spell.label}</span><span className="text-cyan-400">{spell.cost} mana</span>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {curseToast && cursedMode && (
          <motion.button
            key={curseToast}
            initial={{ opacity: 0, y: -15, scale: .9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCurseToast(null)}
            className="absolute left-1/2 top-20 z-[80] max-w-sm -translate-x-1/2 rounded-xl border border-fuchsia-400/50 bg-black/90 px-4 py-2 text-center text-sm font-bold text-fuchsia-200 shadow-[0_0_25px_rgba(217,70,239,.35)]"
          >
            {curseToast}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Rook Sacrifice Banner */}
      <AnimatePresence>
        {rookSacrifice && (
          <motion.div
            key={rookSacrifice.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[75] flex items-center justify-center pointer-events-none px-6"
            onAnimationComplete={() => {
              setTimeout(() => setRookSacrifice(null), 1500);
            }}
          >
            <p className="text-center text-3xl sm:text-5xl font-black uppercase tracking-tight text-red-500 drop-shadow-[0_0_18px_rgba(220,38,38,0.9)]" style={{ WebkitTextStroke: '1px black' }}>
              AND HE sacrificed the ROOOOOKKKK
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* En Passant Jumpscare Flash */}
      <AnimatePresence>
        {enPassantFlash > 0 && (
          <motion.div
            key={enPassantFlash}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-[74] bg-red-600 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Queen Lost Toast */}
      <AnimatePresence>
        {queenLostToast > 0 && (
          <motion.div
            key={queenLostToast}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[74] pointer-events-none"
            onAnimationComplete={() => {
              setTimeout(() => setQueenLostToast(0), 1600);
            }}
          >
            <p className="text-2xl sm:text-4xl font-black text-zinc-300 drop-shadow-lg">📯 Womp womp womp...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Piece Meme (2nd+ attempt to move a pinned piece) */}
      <AnimatePresence>
        {pinMemeId > 0 && (
          <motion.div
            key={pinMemeId}
            initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 z-[76] flex items-center justify-center pointer-events-none px-6"
            onAnimationComplete={() => {
              setTimeout(() => setPinMemeId(0), 1800);
            }}
          >
            <img
              src={pinnedMemeImg}
              alt="Pinned!"
              className="max-w-[min(80vw,320px)] rounded-2xl shadow-2xl border-4 border-red-600"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Long-Think Hallucination */}
      <AnimatePresence>
        {hallucination && (
          <motion.div
            key={hallucination}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[74] pointer-events-none px-4 max-w-md"
          >
            <p className="flex items-center gap-2 text-center text-sm sm:text-base italic text-purple-300/90 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-500/30">
              <Ghost size={16} className="shrink-0" /> {hallucination}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
              
              <div className="flex flex-col gap-3 pb-2 border-b border-zinc-800">
                <button
                  onClick={toggleCursedMode}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl transition-all ${cursedMode ? 'bg-purple-700/30 border border-purple-500/50' : 'bg-zinc-800 border border-transparent hover:bg-zinc-700'}`}
                >
                  <span className="flex items-center gap-2 font-bold">
                    <Skull className={cursedMode ? 'text-purple-300' : 'text-zinc-400'} size={20} />
                    Cursed Chess: EXTREME
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${cursedMode ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                    {cursedMode ? 'On' : 'Off'}
                  </span>
                </button>
                <p className="text-xs text-zinc-500">
                  No check, capturable kings, spell casting, fireballs, weapon upgrades, quantum swaps, pawnification, cursed promotion roulette and deeply unnecessary sound effects. Toggling resets the game.
                </p>
              </div>

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
