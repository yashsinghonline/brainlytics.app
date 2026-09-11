// Client-side storage and scoring engine - 100% offline persistence
(function (global) {
  const STORAGE_KEY = "brain-games:v1";

  const SKILLS = {
    memory: { label: "Memory", glyph: "memory" },
    logic: { label: "Logic", glyph: "logic" },
    speed: { label: "Speed", glyph: "speed" },
    math: { label: "Math", glyph: "math" },
    focus: { label: "Focus", glyph: "focus" },
    pattern: { label: "Pattern", glyph: "pattern" },
  };

  const SKILL_ORDER = ["memory", "logic", "speed", "math", "focus", "pattern"];

  const ACHIEVEMENTS = [
    { id: "first-win", title: "First Win", glyph: "trophy", desc: "Complete your first game", check: (s) => s.totalGames >= 1 },
    { id: "streak-3", title: "Warming Up", glyph: "flame", desc: "Reach a 3 day streak", check: (s) => s.longestStreak >= 3 },
    { id: "streak-7", title: "7 Day Streak", glyph: "flame", desc: "Train 7 days in a row", check: (s) => s.longestStreak >= 7 },
    { id: "streak-14", title: "Two Week Force", glyph: "flame", desc: "Reach a 14 day streak", check: (s) => s.longestStreak >= 14 },
    { id: "streak-30", title: "Unstoppable", glyph: "flame", desc: "Reach a 30 day streak", check: (s) => s.longestStreak >= 30 },
    { id: "lightning", title: "Lightning Fast", glyph: "bolt", desc: "Average under 250 ms reaction", check: (s) => s.bestReaction !== null && s.bestReaction < 250 },
    { id: "memory-master", title: "Memory Master", glyph: "memory", desc: "Score 3,000+ in Memory Grid", check: (s) => (s.bests["memory-grid"] || 0) >= 3000 },
    { id: "perfect-accuracy", title: "Perfect Accuracy", glyph: "focus", desc: "100% accuracy over 10+ rounds", check: (s) => s.bestAccuracy >= 100 },
    { id: "games-25", title: "25 Games Played", glyph: "library", desc: "Play 25 games", check: (s) => s.totalGames >= 25 },
    { id: "games-100", title: "100 Games Played", glyph: "library", desc: "Play 100 games", check: (s) => s.totalGames >= 100 },
    { id: "top-score", title: "Top Score", glyph: "crown", desc: "Score 10,000+ in one game", check: (s) => Object.values(s.bests).some((v) => v >= 10000) },
    { id: "combo-10", title: "Combo 10", glyph: "speed", desc: "Hit a 10x combo", check: (s) => s.maxCombo >= 10 },
    { id: "combo-25", title: "Combo 25", glyph: "speed", desc: "Hit a 25x combo", check: (s) => s.maxCombo >= 25 },
    { id: "explorer", title: "Explorer", glyph: "diamond", desc: "Play 6 different games", check: (s) => s.uniqueGames >= 6 },
    { id: "all-games", title: "Full Tour", glyph: "library", desc: "Play all 12 games", check: (s) => s.uniqueGames >= 12 },
    { id: "daily-1", title: "Daily Duty", glyph: "calendar", desc: "Complete a daily challenge", check: (s) => s.dailyCompletions >= 1 },
    { id: "daily-5", title: "Daily Habit", glyph: "calendar", desc: "Complete 5 daily challenges", check: (s) => s.dailyCompletions >= 5 },
  ];

  const DEFAULT_STATE = {
    playerId: "user-" + Math.random().toString(36).slice(2, 9),
    name: "Player",
    avatar: "diamond",
    settings: { sound: true, haptics: true, theme: "dark", notifications: false },
    sessions: [],
    dailies: [],
    playDays: [],
    streak: 0,
    achievements: [],
  };

  function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function nextStreak(playDays, today, currentStreak) {
    if (playDays.includes(today)) return currentStreak || 1;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = todayKey(y);
    return playDays.includes(yesterday) ? (currentStreak || 0) + 1 : 1;
  }

  function computeStats(sessions, dailies, streakBest, gamesList) {
    const bests = {};
    let bestReaction = null;
    let bestAccuracy = 0;
    let maxCombo = 0;
    const gameIds = new Set();

    for (const session of sessions) {
      if (session.score > (bests[session.gameId] || 0)) bests[session.gameId] = session.score;
      if (session.avgReactionMs && session.avgReactionMs > 80) {
        if (bestReaction === null || session.avgReactionMs < bestReaction) {
          bestReaction = session.avgReactionMs;
        }
      }
      if (session.rounds >= 5 && session.accuracy > bestAccuracy) bestAccuracy = session.accuracy;
      if (session.maxCombo > maxCombo) maxCombo = session.maxCombo;
      gameIds.add(session.gameId);
    }

    const skillRatings = {};
    const allGames = gamesList || [];
    for (const key of SKILL_ORDER) {
      const relevant = allGames.filter((g) => g.skill === key || g.secondary === key);
      let total = 0;
      for (const game of relevant) {
        const best = bests[game.id] || 0;
        const primary = game.skill === key;
        const rating = Math.max(0, Math.min(100, Math.round((best / (game.target || 3000)) * 100)));
        total += primary ? rating : rating * 0.4;
      }
      const primaries = relevant.filter((g) => g.skill === key).length || 1;
      const secondaries = relevant.length - primaries;
      const weighted = total / (primaries + secondaries * 0.4);
      skillRatings[key] = Math.max(0, Math.min(100, Math.round(weighted)));
    }

    const skillSum = SKILL_ORDER.reduce((sum, key) => sum + (skillRatings[key] || 0), 0);
    const dailyCompletions = (dailies || []).filter((d) => d.completed).length;

    return {
      totalGames: sessions.length,
      bests,
      skillRatings,
      brainScore: Math.round(skillSum * 24),
      longestStreak: streakBest,
      bestReaction,
      bestAccuracy,
      uniqueGames: gameIds.size,
      maxCombo,
      dailyCompletions,
    };
  }

  function evaluateAchievements(stats) {
    return ACHIEVEMENTS.filter((a) => a.check(stats)).map((a) => a.id);
  }

  function scoreForRound({ correct, reactionMs, points, combo, level }) {
    if (points !== undefined) return points;
    if (!correct) return -50;
    const base = 100 + (level - 1) * 20;
    const speedBonus = reactionMs && reactionMs < 1500 ? Math.round(50 * (1 - reactionMs / 1500)) : 0;
    const comboBonus = Math.min(combo, 20) * 25;
    return base + speedBonus + comboBonus;
  }

  function gameAccuracy(correct, rounds) {
    if (rounds <= 0) return 0;
    return Math.round((correct / rounds) * 1000) / 10;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
      }
    } catch (e) {}
    return { ...DEFAULT_STATE };
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  global.StorageManager = {
    STORAGE_KEY,
    SKILLS,
    SKILL_ORDER,
    ACHIEVEMENTS,
    DEFAULT_STATE,
    todayKey,
    nextStreak,
    computeStats,
    evaluateAchievements,
    scoreForRound,
    gameAccuracy,
    loadState,
    saveState,
  };
})(window);
