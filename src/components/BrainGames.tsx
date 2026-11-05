import { useState, useEffect, useCallback } from 'react';
import {
  CognitiveStage,
  GameSession,
  DifficultyDecision,
  getDifficultyRecommendation,
  prioritizeGames,
  getGameStats,
} from '../utils/brainGamesAI';

interface BrainGamesProps {
  stage: CognitiveStage;
}

interface Game {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  description: string;
}

const GAMES: Game[] = [
  { id: 'memory', name: 'Memory Match', nameHi: 'स्मृति मिलान', icon: '🧠', description: 'Match pairs of cards' },
  { id: 'sequence', name: 'Number Sequence', nameHi: 'संख्या क्रम', icon: '🔢', description: 'Complete the number pattern' },
  { id: 'words', name: 'Word Recall', nameHi: 'शब्द स्मरण', icon: '📝', description: 'Remember and recall words' },
  { id: 'shapes', name: 'Shape Puzzle', nameHi: 'आकार पहेली', icon: '🔷', description: 'Fit shapes together' },
  { id: 'colors', name: 'Color Sort', nameHi: 'रंग छाँट', icon: '🎨', description: 'Sort items by color' },
  { id: 'math', name: 'Simple Math', nameHi: 'सरल गणित', icon: '➕', description: 'Basic arithmetic' },
];

// Memory card game
function MemoryMatchGame({ onComplete, difficulty }: { onComplete: (score: number, max: number) => void; difficulty: string }) {
  const pairCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const emojis = ['🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌈', '⭐'];
  const selectedEmojis = emojis.slice(0, pairCount);
  const cards = [...selectedEmojis, ...selectedEmojis].sort(() => Math.random() - 0.5);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const handleFlip = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched(m => [...m, newFlipped[0], newFlipped[1]]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  useEffect(() => {
    if (matched.length === cards.length) {
      const maxMoves = pairCount * 3;
      const score = Math.max(1, maxMoves - moves);
      setTimeout(() => onComplete(score, maxMoves), 500);
    }
  }, [matched, cards.length, moves, pairCount, onComplete]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {cards.map((emoji, i) => (
          <button
            key={i}
            onClick={() => handleFlip(i)}
            className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all duration-300 ${
              flipped.includes(i) || matched.includes(i)
                ? 'bg-amber-100 scale-105'
                : 'bg-amber-600 hover:bg-amber-500'
            } ${matched.includes(i) ? 'ring-2 ring-green-400' : ''}`}
          >
            {flipped.includes(i) || matched.includes(i) ? emoji : '?'}
          </button>
        ))}
      </div>
      <p className="text-center mt-3 text-gray-600">Moves: {moves} | Matched: {matched.length / 2}/{pairCount}</p>
    </div>
  );
}

// Number sequence game
function NumberSequenceGame({ onComplete, difficulty }: { onComplete: (score: number, max: number) => void; difficulty: string }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const totalRounds = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;

  const generateSequence = useCallback(() => {
    const start = Math.floor(Math.random() * 10);
    const step = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : Math.floor(Math.random() * 4) + 2;
    const length = 4;
    const sequence = Array.from({ length }, (_, i) => start + step * i);
    const answer = start + step * length;
    return { sequence, answer };
  }, [difficulty]);

  const [puzzle, setPuzzle] = useState(generateSequence);

  const handleSubmit = () => {
    if (parseInt(userAnswer) === puzzle.answer) {
      setScore(s => s + 1);
      setFeedback('✅ Correct!');
    } else {
      setFeedback(`❌ Answer was ${puzzle.answer}`);
    }
    setTimeout(() => {
      setFeedback('');
      setUserAnswer('');
      if (currentRound + 1 >= totalRounds) {
        onComplete(score + (parseInt(userAnswer) === puzzle.answer ? 1 : 0), totalRounds);
      } else {
        setCurrentRound(r => r + 1);
        setPuzzle(generateSequence());
      }
    }, 1200);
  };

  return (
    <div className="p-6 text-center">
      <p className="text-lg mb-2">Round {currentRound + 1} of {totalRounds}</p>
      <div className="flex justify-center gap-2 mb-4">
        {puzzle.sequence.map((n, i) => (
          <span key={i} className="bg-amber-100 px-4 py-3 rounded-lg text-xl font-bold text-amber-800">{n}</span>
        ))}
        <span className="bg-orange-200 px-4 py-3 rounded-lg text-xl font-bold text-orange-800">?</span>
      </div>
      <div className="flex justify-center gap-2 items-center">
        <input
          type="number"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          className="w-24 px-3 py-2 border-2 border-amber-300 rounded-lg text-center text-xl"
          placeholder="?"
        />
        <button onClick={handleSubmit} className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700">
          Check
        </button>
      </div>
      {feedback && <p className="mt-3 text-lg">{feedback}</p>}
      <p className="mt-2 text-gray-500">Score: {score}/{totalRounds}</p>
    </div>
  );
}

// Simple Math game
function SimpleMathGame({ onComplete, difficulty }: { onComplete: (score: number, max: number) => void; difficulty: string }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const totalRounds = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : 10;

  const generateProblem = useCallback(() => {
    const maxNum = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : 50;
    const a = Math.floor(Math.random() * maxNum) + 1;
    const b = Math.floor(Math.random() * maxNum) + 1;
    const ops = difficulty === 'easy' ? ['+'] : ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const answer = op === '+' ? a + b : a - b;
    return { a, b, op, answer: Math.abs(answer) };
  }, [difficulty]);

  const [problem, setProblem] = useState(generateProblem);

  const handleSubmit = () => {
    const correct = parseInt(userAnswer) === problem.answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setUserAnswer('');
      if (currentRound + 1 >= totalRounds) {
        onComplete(score + (correct ? 1 : 0), totalRounds);
      } else {
        setCurrentRound(r => r + 1);
        setProblem(generateProblem());
      }
    }, 800);
  };

  return (
    <div className="p-6 text-center">
      <p className="text-lg mb-2">Round {currentRound + 1} of {totalRounds}</p>
      <div className="text-4xl font-bold mb-4 text-amber-800">
        {problem.a} {problem.op} {problem.b} = ?
      </div>
      <div className="flex justify-center gap-2 items-center">
        <input
          type="number"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          className="w-24 px-3 py-2 border-2 border-amber-300 rounded-lg text-center text-2xl"
          placeholder="?"
        />
        <button onClick={handleSubmit} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-lg hover:bg-amber-700">
          ✓
        </button>
      </div>
      <p className="mt-3 text-gray-500">Score: {score}/{totalRounds}</p>
    </div>
  );
}

// Word Recall game
function WordRecallGame({ onComplete, difficulty }: { onComplete: (score: number, max: number) => void; difficulty: string }) {
  const wordCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
  const allWords = ['Sun', 'Tree', 'Book', 'River', 'Bird', 'Moon', 'Flower', 'Stone', 'Cloud', 'Fish'];
  const words = allWords.slice(0, wordCount);

  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [recalled, setRecalled] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim()) {
      setRecalled([...recalled, input.trim()]);
      setInput('');
    }
  };

  const handleSubmit = () => {
    const correct = recalled.filter(w => words.includes(w)).length;
    onComplete(correct, wordCount);
  };

  if (phase === 'show') {
    return (
      <div className="p-6 text-center">
        <p className="text-lg mb-4 text-gray-600">Remember these words:</p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {words.map(w => (
            <span key={w} className="bg-amber-100 px-4 py-2 rounded-lg text-xl font-bold text-amber-800">{w}</span>
          ))}
        </div>
        <button onClick={() => setPhase('recall')} className="bg-amber-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-amber-700">
          I'm Ready!
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <p className="text-lg mb-4 text-gray-600">Type the words you remember:</p>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {recalled.map((w, i) => (
          <span key={i} className={`px-3 py-1 rounded-full text-sm ${words.includes(w) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {w}
          </span>
        ))}
      </div>
      <div className="flex justify-center gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="px-3 py-2 border-2 border-amber-300 rounded-lg"
          placeholder="Type a word..."
        />
        <button onClick={handleAdd} className="bg-amber-500 text-white px-3 py-2 rounded-lg">Add</button>
      </div>
      <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
        Submit ({recalled.length} words)
      </button>
    </div>
  );
}

export default function BrainGames({ stage }: BrainGamesProps) {
  const [sessions, setSessions] = useState<GameSession[]>(() => {
    const saved = localStorage.getItem('shinakht_game_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<DifficultyDecision | null>(null);
  const [nudgeGames, setNudgeGames] = useState<{ gameId: string; gameName: string; daysSincePlayed: number }[]>([]);

  useEffect(() => {
    localStorage.setItem('shinakht_game_sessions', JSON.stringify(sessions));
    const rec = getDifficultyRecommendation(sessions, stage);
    setRecommendation(rec);

    const gameHistory = GAMES.map(g => ({
      gameId: g.id,
      gameName: g.name,
      lastPlayed: sessions.filter(s => s.gameId === g.id).reduce((max, s) => Math.max(max, s.timestamp), 0),
    }));
    setNudgeGames(prioritizeGames(gameHistory));
  }, [sessions, stage]);

  const stats = getGameStats(sessions);

  const handleGameComplete = (gameId: string, score: number, maxScore: number) => {
    const newSession: GameSession = {
      gameId,
      gameName: GAMES.find(g => g.id === gameId)?.name || '',
      score,
      maxScore,
      timestamp: Date.now(),
      stage,
    };
    setSessions(prev => [...prev, newSession]);
    setActiveGame(null);
  };

  const difficulty = recommendation?.level || 'medium';

  if (activeGame) {
    return (
      <div className="p-4">
        <button onClick={() => setActiveGame(null)} className="mb-4 text-amber-700 hover:text-amber-900 flex items-center gap-2">
          <i className="fas fa-arrow-left"></i> Back to Games
        </button>
        <h3 className="text-xl font-bold text-center mb-4">
          {GAMES.find(g => g.id === activeGame)?.name}
          <span className="ml-2 text-sm bg-amber-100 px-2 py-1 rounded-full">{difficulty}</span>
        </h3>
        {activeGame === 'memory' && <MemoryMatchGame onComplete={(s, m) => handleGameComplete('memory', s, m)} difficulty={difficulty} />}
        {activeGame === 'sequence' && <NumberSequenceGame onComplete={(s, m) => handleGameComplete('sequence', s, m)} difficulty={difficulty} />}
        {activeGame === 'math' && <SimpleMathGame onComplete={(s, m) => handleGameComplete('math', s, m)} difficulty={difficulty} />}
        {activeGame === 'words' && <WordRecallGame onComplete={(s, m) => handleGameComplete('words', s, m)} difficulty={difficulty} />}
        {(activeGame === 'shapes' || activeGame === 'colors') && (
          <div className="text-center p-8">
            <p className="text-6xl mb-4">{activeGame === 'shapes' ? '🔷' : '🎨'}</p>
            <p className="text-gray-600">Coming soon! Try another game.</p>
            <button onClick={() => setActiveGame(null)} className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg">Back</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* AI Recommendation Banner */}
      {recommendation && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤖</span>
            <span className="font-semibold text-amber-800">AI Difficulty: {recommendation.level.toUpperCase()}</span>
          </div>
          <p className="text-sm text-amber-700">{recommendation.reason}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border">
          <p className="text-2xl font-bold text-amber-700">{stats.totalGames}</p>
          <p className="text-xs text-gray-500">Games Played</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border">
          <p className="text-2xl font-bold text-green-600">{stats.avgScore}%</p>
          <p className="text-xs text-gray-500">Avg Score</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border">
          <p className="text-2xl font-bold text-purple-600">{stats.streak}</p>
          <p className="text-xs text-gray-500">Day Streak 🔥</p>
        </div>
      </div>

      {/* Nudge Games */}
      {nudgeGames.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-blue-700 font-medium mb-1">💡 Try revisiting:</p>
          <p className="text-sm text-blue-600">{nudgeGames[0].gameName} ({nudgeGames[0].daysSincePlayed} days ago)</p>
        </div>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-amber-300 hover:shadow-md transition-all text-left"
          >
            <span className="text-3xl">{game.icon}</span>
            <h4 className="font-semibold text-gray-800 mt-2 text-sm">{game.name}</h4>
            <p className="text-xs text-gray-500">{game.nameHi}</p>
            <p className="text-xs text-gray-400 mt-1">{game.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
